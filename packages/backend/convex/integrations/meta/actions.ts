import { internalAction, internalMutation, internalQuery } from "../../_generated/server";
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
      .withIndex("by_organization_id", (q) => q.eq("organizationId", args.organizationId))
      .filter((q) => q.eq(q.field("provider"), "meta"))
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

export const getMetaIntegration = internalQuery({
  args: { organizationId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("integrations")
      .withIndex("by_organization_id", (q) => q.eq("organizationId", args.organizationId))
      .filter((q) => q.eq(q.field("provider"), "meta"))
      .first();
  },
});
