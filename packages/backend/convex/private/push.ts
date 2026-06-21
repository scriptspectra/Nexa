import { internalMutation, internalQuery, mutation } from "../_generated/server";
import { ConvexError, v } from "convex/values";

export const subscribe = mutation({
  args: {
    endpoint: v.string(),
    keys: v.object({
      p256dh: v.string(),
      auth: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({ code: "UNAUTHORIZED", message: "Not logged in" });
    }

    const userId = identity.subject;

    // Check if subscription already exists for this endpoint
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("endpoint"), args.endpoint))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        keys: args.keys,
      });
    } else {
      await ctx.db.insert("pushSubscriptions", {
        userId,
        endpoint: args.endpoint,
        keys: args.keys,
      });
    }
  },
});

export const getSubscriptions = internalQuery({
  args: {
    userIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const subs = [];
    for (const userId of args.userIds) {
      const userSubs = await ctx.db
        .query("pushSubscriptions")
        .withIndex("by_user_id", (q) => q.eq("userId", userId))
        .collect();
      subs.push(...userSubs);
    }
    return subs;
  },
});

export const removeSubscription = internalMutation({
  args: {
    id: v.id("pushSubscriptions"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
