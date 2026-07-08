import { v } from "convex/values";
import { query } from "../_generated/server";
import { getTierFromSubscription } from "../system/pricing";

export const getSubscription = query({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_organization_id", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .unique();
      
    const tier = getTierFromSubscription(subscription);

    return {
      subscription,
      tier,
    };
  },
});
