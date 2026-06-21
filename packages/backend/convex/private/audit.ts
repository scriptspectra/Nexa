import { internalMutation, query } from "../_generated/server";
import { ConvexError, v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

export const logAction = internalMutation({
  args: {
    organizationId: v.string(),
    actorUserId: v.string(),
    actorName: v.string(),
    action: v.string(),
    resourceType: v.string(),
    resourceId: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("auditLog", {
      organizationId: args.organizationId,
      actorUserId: args.actorUserId,
      actorName: args.actorName,
      action: args.action,
      resourceType: args.resourceType,
      resourceId: args.resourceId,
      metadata: args.metadata,
    });
  },
});

export const listLogs = query({
  args: {
    paginationOpts: paginationOptsValidator,
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

    return await ctx.db
      .query("auditLog")
      .withIndex("by_organization_id", (q) => q.eq("organizationId", orgId))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});
