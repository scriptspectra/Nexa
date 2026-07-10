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
      .withIndex("by_organization_id_and_provider", (q) =>
        q.eq("organizationId", args.organizationId).eq("provider", args.provider)
      )
      .first();
  },
});

export const getById = internalQuery({
  args: { integrationId: v.id("integrations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.integrationId);
  },
});
