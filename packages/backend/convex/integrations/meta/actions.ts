import { internalAction, internalMutation, internalQuery, action } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { v } from "convex/values";
import { MetaOAuthProvider } from "./MetaOAuthProvider";
import { MetaProvider } from "./MetaProvider";

export const handleOAuthCallback = internalAction({
  args: {
    code: v.string(),
    redirectUri: v.string(),
    orgId: v.string(),
  },
  handler: async (ctx, args) => {
    const oauthProvider = new MetaOAuthProvider();
    const tokenResult = await oauthProvider.exchangeCodeForToken(args.code, args.redirectUri);

    // Save token to DB
    await ctx.runMutation((internal as any).integrations.meta.actions.saveMetaIntegration, {
      organizationId: args.orgId,
      accessToken: tokenResult.accessToken,
    });

    // We can also trigger the initial resource discovery here, 
    // or the frontend can poll and trigger it.
  },
});

export const saveMetaIntegration = internalMutation({
  args: {
    organizationId: v.string(),
    accessToken: v.string(),
  },
  handler: async (ctx, args) => {
    // Upsert the integration record
    const existing = await ctx.db
      .query("integrations")
      .withIndex("by_organization_id_and_provider", (q) =>
        q.eq("organizationId", args.organizationId).eq("provider", "meta")
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        accessToken: args.accessToken,
        status: "connected",
        lastSyncedAt: Date.now(),
        lastHealthyAt: Date.now(),
      });
    } else {
      await ctx.db.insert("integrations", {
        organizationId: args.organizationId,
        provider: "meta",
        status: "connected",
        accessToken: args.accessToken,
        lastSyncedAt: Date.now(),
        lastHealthyAt: Date.now(),
      });
    }
  },
});

export const discoverMetaResources = internalAction({
  args: { organizationId: v.string() },
  handler: async (ctx, args) => {
    const integration = await ctx.runQuery((internal as any).integrations.meta.actions.getMetaIntegration, {
      organizationId: args.organizationId,
    });

    if (!integration || !integration.accessToken) {
      throw new Error("Meta integration not connected");
    }

    const metaProvider = new MetaProvider();
    const resources = await metaProvider.discoverResources(integration.accessToken);

    return resources;
  },
});
export const discoverMetaResourcesPublic = action({
  args: { organizationId: v.string() },
  handler: async (ctx, args) => {
    const integration = await ctx.runQuery(
      (internal as any).integrations.meta.actions.getMetaIntegration,
      { organizationId: args.organizationId },
    );

    if (!integration || !integration.accessToken) {
      throw new Error("Meta integration not connected");
    }

    const metaProvider = new MetaProvider();
    const resources = await metaProvider.discoverResources(integration.accessToken);

    return resources;
  },
});

export const getMetaIntegration = internalQuery({
  args: { organizationId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("integrations")
      .withIndex("by_organization_id_and_provider", (q) =>
        q.eq("organizationId", args.organizationId).eq("provider", "meta")
      )
      .first();
  },
});

export const getResourceById = internalQuery({
  args: { resourceId: v.id("integrationResources") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.resourceId);
  },
});

export const getIntegrationById = internalQuery({
  args: { integrationId: v.id("integrations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.integrationId);
  },
});

export const subscribeResourceWebhooks = action({
  args: {
    resourceId: v.id("integrationResources"),
  },
  handler: async (ctx, args) => {
    const resource = await ctx.runQuery((internal as any).integrations.meta.actions.getResourceById, {
      resourceId: args.resourceId,
    });

    if (!resource || resource.status !== "active") {
      throw new Error("Resource not found or not active");
    }

    const integration = await ctx.runQuery((internal as any).integrations.meta.actions.getIntegrationById, {
      integrationId: resource.integrationId,
    });

    if (!integration || !integration.accessToken) {
      throw new Error("Parent integration not found or disconnected");
    }

    const metaProvider = new MetaProvider();
    const discovered = [{
      externalResourceId: resource.externalResourceId,
      name: resource.name,
      resourceType: resource.resourceType,
      capabilities: resource.capabilities,
      raw: resource.raw,
    }];

    await metaProvider.registerWebhooks(discovered, integration.accessToken);
  },
});
