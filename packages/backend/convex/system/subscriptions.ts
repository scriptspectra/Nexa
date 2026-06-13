import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";

const subscriptionDetailsValidator = {
  organizationId: v.string(),
  status: v.string(),
  lemonSqueezySubscriptionId: v.optional(v.string()),
  lemonSqueezyCustomerId: v.optional(v.string()),
  productName: v.optional(v.string()),
  variantName: v.optional(v.string()),
  statusFormatted: v.optional(v.string()),
  cardBrand: v.optional(v.string()),
  cardLastFour: v.optional(v.string()),
  renewsAt: v.optional(v.number()),
  endsAt: v.optional(v.number()),
  updatePaymentMethodUrl: v.optional(v.string()),
  customerPortalUrl: v.optional(v.string()),
  updatedAt: v.optional(v.number()),
};

export const upsert = internalMutation({
  args: subscriptionDetailsValidator,
  handler: async (ctx, args) => {
    const existingSubscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_organization_id", (q) =>
        q.eq("organizationId", args.organizationId),
      )
      .unique();

    if (existingSubscription) {
      await ctx.db.patch(existingSubscription._id, args);
      return existingSubscription._id;
    }

    return await ctx.db.insert("subscriptions", args);
  },
});

export const getByOrganizationId = internalQuery({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_organization_id", (q) =>
        q.eq("organizationId", args.organizationId),
      )
      .unique();
  },
});

export const getByLemonSubscriptionId = internalQuery({
  args: {
    lemonSqueezySubscriptionId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_lemon_subscription_id", (q) =>
        q.eq("lemonSqueezySubscriptionId", args.lemonSqueezySubscriptionId),
      )
      .unique();
  },
});
