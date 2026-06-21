import { internalMutation, internalQuery } from "../_generated/server";
import { ConvexError, v } from "convex/values";
import { PLAN_LIMITS } from "./planLimits"; // I need to create this file

export const incrementAndCheckUsage = internalMutation({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    // Determine current month
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // 1. Get the org's active subscription status
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_organization_id", (q) => q.eq("organizationId", args.organizationId))
      .first();

    const planName = sub?.status === "active" ? (sub.productName || "Pro") : "Free";
    
    const limit = planName === "Free" ? PLAN_LIMITS.Free.aiResponsesCount : PLAN_LIMITS.Pro.aiResponsesCount;

    // 2. Get or create current month usage
    let usage = await ctx.db
      .query("usageCounters")
      .withIndex("by_organization_and_month", (q) =>
        q.eq("organizationId", args.organizationId).eq("month", month)
      )
      .first();

    if (!usage) {
      const newUsageId = await ctx.db.insert("usageCounters", {
        organizationId: args.organizationId,
        month,
        aiResponsesCount: 0,
      });
      usage = await ctx.db.get(newUsageId);
    }

    if (!usage) throw new ConvexError("Failed to track usage");

    // 3. Check limit
    if (usage.aiResponsesCount >= limit) {
      return { allowed: false, current: usage.aiResponsesCount, limit };
    }

    // 4. Increment
    await ctx.db.patch(usage._id, {
      aiResponsesCount: usage.aiResponsesCount + 1,
    });

    return { allowed: true, current: usage.aiResponsesCount + 1, limit };
  },
});

export const getCurrentUsage = internalQuery({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_organization_id", (q) => q.eq("organizationId", args.organizationId))
      .first();

    const planName = sub?.status === "active" ? (sub.productName || "Pro") : "Free";
    const limit = planName === "Free" ? PLAN_LIMITS.Free.aiResponsesCount : PLAN_LIMITS.Pro.aiResponsesCount;

    const usage = await ctx.db
      .query("usageCounters")
      .withIndex("by_organization_and_month", (q) =>
        q.eq("organizationId", args.organizationId).eq("month", month)
      )
      .first();

    return {
      aiResponsesCount: usage?.aiResponsesCount || 0,
      limit,
      planName,
    };
  },
});
