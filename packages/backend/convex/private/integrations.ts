import { query, internalQuery } from "../_generated/server";
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
      .withIndex("by_organization_id", (q) => q.eq("organizationId", args.organizationId))
      .first();
  },
});

export const getById = internalQuery({
  args: { integrationId: v.id("integrations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.integrationId);
  },
});
