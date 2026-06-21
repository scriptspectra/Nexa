import { mutation, query } from "../_generated/server";
import { ConvexError, v } from "convex/values";
import { getOrgIdFromIdentity } from "../lib/orgAuth";

export const get = query({
  args: { organizationId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const orgId = getOrgIdFromIdentity(identity);

    if (!orgId || orgId !== args.organizationId) {
      return null;
    }

    const progress = await ctx.db
      .query("onboardingProgress")
      .withIndex("by_organization_id", (q) => q.eq("organizationId", orgId))
      .unique();

    return progress;
  },
});

export const upsert = mutation({
  args: {
    organizationId: v.string(),
    connectedShopify: v.optional(v.boolean()),
    uploadedFile: v.optional(v.boolean()),
    customizedWidget: v.optional(v.boolean()),
    embeddedWidget: v.optional(v.boolean()),
    invitedTeamMember: v.optional(v.boolean()),
    dismissed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const orgId = getOrgIdFromIdentity(identity);

    if (!orgId || orgId !== args.organizationId) {
      throw new ConvexError({ code: "UNAUTHORIZED", message: "Not authorized" });
    }

    const existing = await ctx.db
      .query("onboardingProgress")
      .withIndex("by_organization_id", (q) => q.eq("organizationId", orgId))
      .unique();

    const patch = {
      connectedShopify: args.connectedShopify,
      uploadedFile: args.uploadedFile,
      customizedWidget: args.customizedWidget,
      embeddedWidget: args.embeddedWidget,
      invitedTeamMember: args.invitedTeamMember,
      dismissed: args.dismissed,
    };

    // Remove undefined keys so we don't clobber existing values
    const cleanPatch = Object.fromEntries(
      Object.entries(patch).filter(([, v]) => v !== undefined)
    ) as Partial<typeof patch>;

    if (existing) {
      await ctx.db.patch(existing._id, cleanPatch);
    } else {
      await ctx.db.insert("onboardingProgress", {
        organizationId: orgId,
        connectedShopify: args.connectedShopify ?? false,
        uploadedFile: args.uploadedFile ?? false,
        customizedWidget: args.customizedWidget ?? false,
        embeddedWidget: args.embeddedWidget ?? false,
        invitedTeamMember: args.invitedTeamMember ?? false,
        dismissed: args.dismissed ?? false,
      });
    }
  },
});
