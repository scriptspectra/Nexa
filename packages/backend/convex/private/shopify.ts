/**
 * Shopify integration — private (authenticated) actions and queries.
 * These are called from the dashboard by logged-in organization admins.
 */

import { ConvexError, v } from "convex/values";
import { action, internalAction, internalMutation, internalQuery, mutation, query } from "../_generated/server";
import { internal } from "../_generated/api";
import { getSecretValue, parseSecretString, upsertSecret } from "../lib/secrets";
import {
  fetchAllShopifyProducts,
  fetchShopifyProduct,
  productToRagText,
  registerShopifyWebhook,
  validateShopifyCredentials,
} from "../lib/shopify";
import rag from "../system/ai/rag";

// ─── Helpers ────────────────────────────────────────────────────────────────

function getSecretName(organizationId: string): string {
  return `nexa/shopify/${organizationId}`;
}

function productRagKey(productId: number): string {
  return `shopify-product-${productId}`;
}

// ─── Public Actions (called from dashboard) ──────────────────────────────────

/**
 * Validates credentials, saves them, registers webhooks, and starts the
 * initial full product sync. Called when the user connects their Shopify store.
 */
export const connectShopify = action({
  args: {
    shopDomain: v.string(),
    adminApiKey: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({ code: "UNAUTHORIZED", message: "Not authenticated" });
    }

    const orgId = (identity.orgId || (identity as any).org_id) as string;
    if (!orgId) {
      throw new ConvexError({ code: "UNAUTHORIZED", message: "Organization not found" });
    }

    // Normalize domain — strip https:// if user accidentally includes it
    const shopDomain = args.shopDomain
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "")
      .trim();

    // Step 1: Validate credentials against Shopify API
    let shopName: string;
    try {
      shopName = await validateShopifyCredentials(shopDomain, args.adminApiKey);
    } catch (err: any) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: err.message || "Invalid Shopify credentials",
      });
    }

    // Step 2: Store credentials securely in AWS Secrets Manager
    const secretName = getSecretName(orgId);
    await upsertSecret(secretName, {
      shopDomain,
      adminApiKey: args.adminApiKey,
      shopName,
    });

    // Step 3: Create/update the plugin record in Convex
    await ctx.runMutation(internal.system.plugins.upsert, {
      organizationId: orgId,
      service: "shopify",
      secretName,
    });

    // Step 4: Register Shopify webhooks so we get real-time updates
    const convexHttpUrl = process.env.CONVEX_SITE_URL || "";
    const webhookCallbackUrl = `${convexHttpUrl}/shopify-webhook`;
    const webhookTopics = [
      "products/update",
      "products/delete",
      "inventory_levels/update",
    ];

    for (const topic of webhookTopics) {
      try {
        await registerShopifyWebhook(shopDomain, args.adminApiKey, topic, webhookCallbackUrl);
      } catch (err) {
        // Log but don't fail — sync still works even without webhooks
        console.warn(`Failed to register webhook for topic "${topic}":`, err);
      }
    }

    // Step 5: Kick off full product sync in the background
    await ctx.runMutation(internal.private.shopify.upsertSyncLog, {
      organizationId: orgId,
      status: "running",
      syncedProducts: 0,
    });
    await ctx.scheduler.runAfter(0, internal.private.shopify.runFullProductSync, {
      organizationId: orgId,
    });

    return { shopName, shopDomain };
  },
});

/**
 * Manually triggers a full re-sync. Called from the "Re-sync now" button.
 */
export const triggerResync = action({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({ code: "UNAUTHORIZED", message: "Not authenticated" });
    }

    const orgId = (identity.orgId || (identity as any).org_id) as string;
    if (!orgId) {
      throw new ConvexError({ code: "UNAUTHORIZED", message: "Organization not found" });
    }

    await ctx.runMutation(internal.private.shopify.upsertSyncLog, {
      organizationId: orgId,
      status: "running",
      syncedProducts: 0,
    });

    await ctx.scheduler.runAfter(0, internal.private.shopify.runFullProductSync, {
      organizationId: orgId,
    });
  },
});

/**
 * Disconnects Shopify — removes the plugin record and deletes all Shopify
 * RAG entries for this organization.
 */
export const disconnectShopify = action({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({ code: "UNAUTHORIZED", message: "Not authenticated" });
    }

    const orgId = (identity.orgId || (identity as any).org_id) as string;
    if (!orgId) {
      throw new ConvexError({ code: "UNAUTHORIZED", message: "Organization not found" });
    }

    // Delete all Shopify-sourced RAG entries for this org
    await ctx.runAction(internal.private.shopify.deleteAllShopifyRagEntries, {
      organizationId: orgId,
    });

    // Delete the plugin record
    await ctx.runMutation(internal.private.shopify.deletePluginRecord, {
      organizationId: orgId,
    });

    // Delete the sync log
    await ctx.runMutation(internal.private.shopify.deleteSyncLog, {
      organizationId: orgId,
    });
  },
});

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * Returns the Shopify plugin status for the current org — whether connected,
 * and the sync log info.
 */
export const getShopifyStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const orgId = (identity.orgId || (identity as any).org_id) as string;
    if (!orgId) return null;

    const plugin = await ctx.db
      .query("plugins")
      .withIndex("by_organization_id_and_service", (q) =>
        q.eq("organizationId", orgId).eq("service", "shopify")
      )
      .unique();

    if (!plugin) return { connected: false, syncLog: null };

    const syncLog = await ctx.db
      .query("shopifySyncLog")
      .withIndex("by_organization_id", (q) => q.eq("organizationId", orgId))
      .unique();

    return {
      connected: true,
      secretName: plugin.secretName,
      syncLog,
    };
  },
});

// ─── Internal Mutations ───────────────────────────────────────────────────────

export const upsertSyncLog = internalMutation({
  args: {
    organizationId: v.string(),
    status: v.union(v.literal("running"), v.literal("done"), v.literal("error")),
    totalProducts: v.optional(v.number()),
    syncedProducts: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("shopifySyncLog")
      .withIndex("by_organization_id", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .unique();

    const patch = {
      status: args.status,
      totalProducts: args.totalProducts,
      syncedProducts: args.syncedProducts,
      lastSyncedAt: args.status === "done" ? Date.now() : undefined,
      errorMessage: args.errorMessage,
    };

    if (existing) {
      await ctx.db.patch(existing._id, patch);
    } else {
      await ctx.db.insert("shopifySyncLog", {
        organizationId: args.organizationId,
        ...patch,
      });
    }
  },
});

export const deletePluginRecord = internalMutation({
  args: { organizationId: v.string() },
  handler: async (ctx, args) => {
    const plugin = await ctx.db
      .query("plugins")
      .withIndex("by_organization_id_and_service", (q) =>
        q.eq("organizationId", args.organizationId).eq("service", "shopify")
      )
      .unique();

    if (plugin) {
      await ctx.db.delete(plugin._id);
    }
  },
});

export const deleteSyncLog = internalMutation({
  args: { organizationId: v.string() },
  handler: async (ctx, args) => {
    const log = await ctx.db
      .query("shopifySyncLog")
      .withIndex("by_organization_id", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .unique();

    if (log) {
      await ctx.db.delete(log._id);
    }
  },
});

// ─── Internal Actions (background work) ──────────────────────────────────────

/**
 * Helper — finds a RAG entry by its key within a namespace and deletes it.
 * Since @convex-dev/rag doesn't expose a getEntryByKey API, we list all entries
 * in the namespace and match on the key field.
 */
async function deleteRagEntryByKey(
  ctx: any,
  organizationId: string,
  key: string
): Promise<void> {
  let cursor: string | null = null;
  do {
    const namespace = await rag.getNamespace(ctx, { namespace: organizationId });
    if (!namespace) return;

    const result = await rag.list(ctx, {
      namespaceId: namespace.namespaceId,
      paginationOpts: { cursor, numItems: 100 },
    });

    for (const entry of result.page) {
      if (entry.key === key) {
        await rag.deleteAsync(ctx, { entryId: entry.entryId });
        return; // Keys are unique — stop after first match
      }
    }

    cursor = result.isDone ? null : result.continueCursor;
  } while (cursor);
}

/**
 * Deletes all RAG entries that were sourced from Shopify for a given org.
 * Used during disconnect.
 */
export const deleteAllShopifyRagEntries = internalAction({
  args: { organizationId: v.string() },
  handler: async (ctx, args) => {
    const { organizationId } = args;

    const namespace = await rag.getNamespace(ctx, { namespace: organizationId });
    if (!namespace) return;

    let cursor: string | null = null;
    do {
      const result = await rag.list(ctx, {
        namespaceId: namespace.namespaceId,
        paginationOpts: { cursor, numItems: 100 },
      });

      for (const entry of result.page) {
        if ((entry.metadata as any)?.source === "shopify") {
          await rag.deleteAsync(ctx, { entryId: entry.entryId });
        }
      }

      cursor = result.isDone ? null : result.continueCursor;
    } while (cursor);
  },
});


/**
 * Full product sync — fetches all products from Shopify and upserts each
 * one into the RAG knowledge base.
 */
export const runFullProductSync = internalAction({
  args: { organizationId: v.string() },
  handler: async (ctx, args) => {
    const { organizationId } = args;

    // Get credentials from AWS Secrets Manager
    const plugin = await ctx.runQuery(
      internal.system.plugins.getByOrganizationIdAndService,
      { organizationId, service: "shopify" }
    );

    if (!plugin) {
      await ctx.runMutation(internal.private.shopify.upsertSyncLog, {
        organizationId,
        status: "error",
        errorMessage: "Shopify plugin not found",
      });
      return;
    }

    let secretData: { shopDomain: string; adminApiKey: string } | null = null;
    try {
      const secret = await getSecretValue(plugin.secretName);
      secretData = parseSecretString<{ shopDomain: string; adminApiKey: string }>(secret);
    } catch (err: any) {
      await ctx.runMutation(internal.private.shopify.upsertSyncLog, {
        organizationId,
        status: "error",
        errorMessage: `Failed to retrieve credentials: ${err.message}`,
      });
      return;
    }

    if (!secretData) {
      await ctx.runMutation(internal.private.shopify.upsertSyncLog, {
        organizationId,
        status: "error",
        errorMessage: "Stored Shopify credentials are invalid",
      });
      return;
    }

    const { shopDomain, adminApiKey } = secretData;

    // Fetch all products
    let products;
    try {
      products = await fetchAllShopifyProducts(shopDomain, adminApiKey);
    } catch (err: any) {
      await ctx.runMutation(internal.private.shopify.upsertSyncLog, {
        organizationId,
        status: "error",
        errorMessage: `Failed to fetch products: ${err.message}`,
      });
      return;
    }

    await ctx.runMutation(internal.private.shopify.upsertSyncLog, {
      organizationId,
      status: "running",
      totalProducts: products.length,
      syncedProducts: 0,
    });

    let syncedCount = 0;
    for (const product of products) {
      try {
        const text = productToRagText(product);
        const key = productRagKey(product.id);

        await rag.add(ctx, {
          namespace: organizationId,
          text,
          key,
          title: product.title,
          metadata: {
            source: "shopify",
            productId: product.id,
            shopDomain,
          },
        });

        syncedCount++;
      } catch (err) {
        console.warn(`Failed to sync product ${product.id}:`, err);
      }
    }

    await ctx.runMutation(internal.private.shopify.upsertSyncLog, {
      organizationId,
      status: "done",
      totalProducts: products.length,
      syncedProducts: syncedCount,
    });
  },
});

/**
 * Syncs a single product by ID — used by the webhook handler when a
 * product is updated or an order changes inventory.
 */
export const syncSingleProduct = internalAction({
  args: {
    organizationId: v.string(),
    productId: v.number(),
  },
  handler: async (ctx, args) => {
    const { organizationId, productId } = args;

    const plugin = await ctx.runQuery(
      internal.system.plugins.getByOrganizationIdAndService,
      { organizationId, service: "shopify" }
    );

    if (!plugin) return;

    const secret = await getSecretValue(plugin.secretName);
    const secretData = parseSecretString<{ shopDomain: string; adminApiKey: string }>(secret);
    if (!secretData) return;

    const { shopDomain, adminApiKey } = secretData;

    const product = await fetchShopifyProduct(shopDomain, adminApiKey, productId);

    if (!product) {
      // Product was deleted — find and remove from RAG by listing entries
      const key = productRagKey(productId);
      await deleteRagEntryByKey(ctx, organizationId, key);
      return;
    }

    const text = productToRagText(product);
    const key = productRagKey(productId);

    // rag.add with same key = upsert (replaces existing entry)
    await rag.add(ctx, {
      namespace: organizationId,
      text,
      key,
      title: product.title,
      metadata: {
        source: "shopify",
        productId: product.id,
        shopDomain,
      },
    });
  },
});

/**
 * Called by the HTTP webhook handler when a product is created, updated, or deleted.
 * Looks up which org owns this shop and syncs the affected product.
 */
export const handleProductWebhook = internalAction({
  args: {
    shopDomain: v.string(),
    productId: v.number(),
    deleted: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { shopDomain, productId, deleted } = args;

    // Find the organization that owns this shop domain
    const organizationId = await ctx.runAction(
      internal.private.shopify.getOrgIdByShopDomain,
      { shopDomain }
    );

    if (!organizationId) {
      console.warn(`SHOPIFY_WEBHOOK: No org found for shop domain "${shopDomain}"`);
      return;
    }

    if (deleted) {
      const key = productRagKey(productId);
      await deleteRagEntryByKey(ctx, organizationId, key);
    } else {
      await ctx.runAction(internal.private.shopify.syncSingleProduct, {
        organizationId,
        productId,
      });
    }
  },
});

/**
 * Called by the HTTP webhook handler when inventory levels change.
 * Uses the inventory_item_id to look up which product changed, then re-syncs it.
 */
export const handleInventoryWebhook = internalAction({
  args: {
    shopDomain: v.string(),
    inventoryItemId: v.number(),
  },
  handler: async (ctx, args) => {
    const { shopDomain, inventoryItemId } = args;

    const organizationId = await ctx.runAction(
      internal.private.shopify.getOrgIdByShopDomain,
      { shopDomain }
    );

    if (!organizationId) {
      console.warn(`SHOPIFY_WEBHOOK: No org found for shop domain "${shopDomain}"`);
      return;
    }

    // Fetch product ID from inventory item via Shopify API
    const plugin = await ctx.runQuery(
      internal.system.plugins.getByOrganizationIdAndService,
      { organizationId, service: "shopify" }
    );
    if (!plugin) return;

    const secret = await getSecretValue(plugin.secretName);
    const secretData = parseSecretString<{ shopDomain: string; adminApiKey: string }>(secret);
    if (!secretData) return;

    // Find variant with this inventory item, then get the product
    const variantUrl = `https://${secretData.shopDomain}/admin/api/2024-10/variants.json?inventory_item_ids=${inventoryItemId}&fields=id,product_id`;
    const variantRes = await fetch(variantUrl, {
      headers: { "X-Shopify-Access-Token": secretData.adminApiKey },
    });

    if (!variantRes.ok) return;
    const variantData = (await variantRes.json()) as { variants: { product_id: number }[] };
    const productId = variantData.variants?.[0]?.product_id;

    if (!productId) return;

    await ctx.runAction(internal.private.shopify.syncSingleProduct, {
      organizationId,
      productId,
    });
  },
});

/**
 * Internal query — finds which organization ID owns a given Shopify shop domain.
 * Used by webhook handlers to route updates to the right org.
 */
export const getOrgIdByShopDomain = internalAction({
  args: { shopDomain: v.string() },
  handler: async (ctx, args): Promise<string | null> => {
    // Get all Shopify plugins and look for the one with this shop domain
    const plugins = await ctx.runQuery(internal.private.shopify.listAllShopifyPlugins, {});

    for (const plugin of plugins) {
      try {
        const secret = await getSecretValue(plugin.secretName);
        const secretData = parseSecretString<{ shopDomain: string }>(secret);
        if (secretData?.shopDomain === args.shopDomain) {
          return plugin.organizationId;
        }
      } catch {
        // Skip plugins with invalid secrets
      }
    }

    return null;
  },
});

export const listAllShopifyPlugins = internalQuery({
  args: {},
  handler: async (ctx) => {
    const allPlugins = await ctx.db.query("plugins").collect();
    return allPlugins
      .filter((p) => p.service === "shopify")
      .map((p) => ({ organizationId: p.organizationId, secretName: p.secretName }));
  },
});
