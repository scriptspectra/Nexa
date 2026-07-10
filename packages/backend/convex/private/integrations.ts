import { internalAction, internalMutation, internalQuery, query } from "../_generated/server";
import { v } from "convex/values";

export const getIntegrationStatus = query({
  args: {
    organizationId: v.string(),
    provider: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("integrations")
      .withIndex("by_organization_id", (q) => q.eq("organizationId", args.organizationId))
      .filter((q) => q.eq(q.field("provider"), args.provider))
      .first();
  },
});
