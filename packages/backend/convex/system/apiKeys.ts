import { action, internalMutation, internalQuery, mutation, query } from "../_generated/server";
import { ConvexError, v } from "convex/values";
import { Id } from "../_generated/dataModel";
import { hasFeature } from "./pricing";

// Helper to hash the key for storage
async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Generates a new API key and stores its hash
export const create = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const orgId = (identity.orgId || (identity as any).org_id) as string;
    if (!orgId) throw new ConvexError("Organization not found");

    const canUseApi = await hasFeature(ctx, orgId, "canUseApi");
    if (!canUseApi) throw new ConvexError("API keys are not available on your current plan.");

    // Generate a secure random key
    const rawKey = `zephyra_${crypto.randomUUID().replace(/-/g, "")}${crypto.randomUUID().replace(/-/g, "")}`;
    const keyHash = await hashKey(rawKey);
    const keyPrefix = rawKey.substring(0, 16);

    await ctx.db.insert("apiKeys", {
      organizationId: orgId,
      name: args.name,
      keyPrefix,
      keyHash,
      scopes: ["all"],
      createdByUserId: identity.subject,
      revoked: false,
    });

    // Return the raw key ONLY ONCE. It cannot be retrieved again.
    return { rawKey };
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const orgId = (identity.orgId || (identity as any).org_id) as string;
    if (!orgId) throw new ConvexError("Organization not found");

    return await ctx.db
      .query("apiKeys")
      .withIndex("by_organization_id", (q) => q.eq("organizationId", orgId))
      .collect();
  },
});

export const remove = mutation({
  args: {
    id: v.id("apiKeys"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const orgId = (identity.orgId || (identity as any).org_id) as string;
    if (!orgId) throw new ConvexError("Organization not found");

    const apiKey = await ctx.db.get(args.id);
    if (!apiKey || apiKey.organizationId !== orgId) {
      throw new ConvexError("API key not found");
    }

    await ctx.db.delete(args.id);
  },
});

// Used by HTTP handlers to verify an API key
export const verifyAndRecordUsage = internalMutation({
  args: {
    rawKey: v.string(),
  },
  handler: async (ctx, args) => {
    const keyHash = await hashKey(args.rawKey);

    const apiKey = await ctx.db
      .query("apiKeys")
      .withIndex("by_key_hash", (q) => q.eq("keyHash", keyHash))
      .first();

    if (!apiKey) return null;

    // Update last used
    await ctx.db.patch(apiKey._id, { lastUsedAt: Date.now() });

    return { organizationId: apiKey.organizationId };
  },
});
