import { query, mutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";

export const getIntegrationStatus = query({
  args: {
    organizationId: v.string(),
    provider: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.organizationId) return null;
    return await ctx.db
      .query("integrations")
      .withIndex("by_organization_id_and_provider", (q) =>
        q.eq("organizationId", args.organizationId).eq("provider", args.provider)
      )
      .first();
  },
});

export const listConnected = query({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.organizationId) return [];
    const integrations = await ctx.db
      .query("integrations")
      .withIndex("by_organization_id", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .collect();
    // Return only healthy/syncing integrations as provider strings
    return integrations
      .filter((i) => i.status === "healthy" || i.status === "syncing")
      .map((i) => i.provider);
  },
});


export const getById = internalQuery({
  args: { integrationId: v.id("integrations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.integrationId);
  },
});

export const getIntegrationResources = query({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.organizationId) return [];
    return await ctx.db
      .query("integrationResources")
      .withIndex("by_organization_id", (q) => q.eq("organizationId", args.organizationId))
      .collect();
  },
});

export const enableIntegrationResource = mutation({
  args: {
    organizationId: v.string(),
    integrationId: v.id("integrations"),
    provider: v.string(),
    resourceType: v.string(),
    externalResourceId: v.string(),
    name: v.string(),
    capabilities: v.any(),
    raw: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("integrationResources")
      .withIndex("by_external_resource_id", (q) =>
        q.eq("externalResourceId", args.externalResourceId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: "active",
        name: args.name,
        capabilities: args.capabilities,
        raw: args.raw,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("integrationResources", {
        organizationId: args.organizationId,
        integrationId: args.integrationId,
        provider: args.provider,
        resourceType: args.resourceType,
        externalResourceId: args.externalResourceId,
        name: args.name,
        capabilities: args.capabilities,
        status: "active",
        raw: args.raw,
      });
    }
  },
});

export const disableIntegrationResource = mutation({
  args: {
    resourceId: v.id("integrationResources"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.resourceId, {
      status: "disconnected",
    });
  },
});

export const disconnectIntegration = mutation({
  args: {
    organizationId: v.string(),
    provider: v.string(),
  },
  handler: async (ctx, args) => {
    const integration = await ctx.db
      .query("integrations")
      .withIndex("by_organization_id_and_provider", (q) =>
        q.eq("organizationId", args.organizationId).eq("provider", args.provider)
      )
      .first();

    if (integration) {
      await ctx.db.patch(integration._id, {
        status: "disconnected",
        accessToken: undefined,
        refreshToken: undefined,
      });

      // Also disable all related resources
      const resources = await ctx.db
        .query("integrationResources")
        .withIndex("by_organization_id", (q) =>
          q.eq("organizationId", args.organizationId)
        )
        .filter((q) => q.eq(q.field("provider"), args.provider))
        .collect();

      for (const resource of resources) {
        await ctx.db.patch(resource._id, { status: "disconnected" });
      }
    }
  },
});
