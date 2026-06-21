import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { ConvexError } from "convex/values";

export const getConfig = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const orgId = (identity.orgId || (identity as any).org_id) as string;
    if (!orgId) return null;

    return await ctx.db
      .query("slaConfig")
      .withIndex("by_organization_id", (q) => q.eq("organizationId", orgId))
      .unique();
  },
});

export const upsertConfig = mutation({
  args: {
    firstResponseTargetMs: v.number(),
    resolutionTargetMs: v.number(),
    businessHoursStart: v.number(),
    businessHoursEnd: v.number(),
    businessDays: v.array(v.number()),
    timezone: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({ code: "UNAUTHORIZED", message: "Not authenticated" });
    }

    const orgId = (identity.orgId || (identity as any).org_id) as string;
    if (!orgId) {
      throw new ConvexError({ code: "UNAUTHORIZED", message: "Organization not found" });
    }

    const existing = await ctx.db
      .query("slaConfig")
      .withIndex("by_organization_id", (q) => q.eq("organizationId", orgId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        firstResponseTargetMs: args.firstResponseTargetMs,
        resolutionTargetMs: args.resolutionTargetMs,
        businessHoursStart: args.businessHoursStart,
        businessHoursEnd: args.businessHoursEnd,
        businessDays: args.businessDays,
        timezone: args.timezone,
      });
    } else {
      await ctx.db.insert("slaConfig", {
        organizationId: orgId,
        firstResponseTargetMs: args.firstResponseTargetMs,
        resolutionTargetMs: args.resolutionTargetMs,
        businessHoursStart: args.businessHoursStart,
        businessHoursEnd: args.businessHoursEnd,
        businessDays: args.businessDays,
        timezone: args.timezone,
      });
    }
  },
});
