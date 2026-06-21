import { mutation, query } from "../_generated/server";
import { ConvexError, v } from "convex/values";
import { getOrgIdFromIdentity } from "../lib/orgAuth";
import { paginationOptsValidator } from "convex/server";

/** List all macros for the org (shared + own private) */
export const list = query({
  args: {
    organizationId: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const orgId = getOrgIdFromIdentity(identity);

    if (!orgId || orgId !== args.organizationId) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    return await ctx.db
      .query("macros")
      .withIndex("by_organization_id", (q) => q.eq("organizationId", orgId))
      .order("asc")
      .paginate(args.paginationOpts);
  },
});

/** List all macros for the org (no pagination) */
export const listAll = query({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const orgId = getOrgIdFromIdentity(identity);

    if (!orgId || orgId !== args.organizationId) {
      return [];
    }

    return await ctx.db
      .query("macros")
      .withIndex("by_organization_id", (q) => q.eq("organizationId", orgId))
      .order("asc")
      .collect();
  },
});

/** Create a new macro (admin or agent) */
export const create = mutation({
  args: {
    organizationId: v.string(),
    title: v.string(),
    content: v.string(),
    shortcut: v.optional(v.string()),
    isShared: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const orgId = getOrgIdFromIdentity(identity);

    if (!orgId || orgId !== args.organizationId) {
      throw new ConvexError({ code: "UNAUTHORIZED", message: "Not authorized" });
    }

    if (!args.title.trim() || !args.content.trim()) {
      throw new ConvexError({ code: "BAD_REQUEST", message: "Title and content are required" });
    }

    await ctx.db.insert("macros", {
      organizationId: orgId,
      title: args.title.trim(),
      content: args.content.trim(),
      shortcut: args.shortcut?.trim() || undefined,
      isShared: args.isShared,
      createdByUserId: identity!.tokenIdentifier,
    });
  },
});

/** Update an existing macro */
export const update = mutation({
  args: {
    macroId: v.id("macros"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    shortcut: v.optional(v.string()),
    isShared: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const orgId = getOrgIdFromIdentity(identity);

    if (!orgId) {
      throw new ConvexError({ code: "UNAUTHORIZED", message: "Not authenticated" });
    }

    const macro = await ctx.db.get(args.macroId);
    if (!macro || macro.organizationId !== orgId) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Macro not found" });
    }

    const patch: Partial<typeof macro> = {};
    if (args.title !== undefined) patch.title = args.title.trim();
    if (args.content !== undefined) patch.content = args.content.trim();
    if (args.shortcut !== undefined) patch.shortcut = args.shortcut.trim() || undefined;
    if (args.isShared !== undefined) patch.isShared = args.isShared;

    await ctx.db.patch(args.macroId, patch);
  },
});

/** Delete a macro */
export const remove = mutation({
  args: {
    macroId: v.id("macros"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const orgId = getOrgIdFromIdentity(identity);

    if (!orgId) {
      throw new ConvexError({ code: "UNAUTHORIZED", message: "Not authenticated" });
    }

    const macro = await ctx.db.get(args.macroId);
    if (!macro || macro.organizationId !== orgId) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Macro not found" });
    }

    await ctx.db.delete(args.macroId);
  },
});
