import { mutation, query } from "../_generated/server";
import { ConvexError, v } from "convex/values";
import { getOrgIdFromIdentity } from "../lib/orgAuth";

/** Add a tag to a conversation */
export const addTag = mutation({
  args: {
    conversationId: v.id("conversations"),
    tag: v.string(),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const orgId = getOrgIdFromIdentity(identity);

    if (!orgId) {
      throw new ConvexError({ code: "UNAUTHORIZED", message: "Not authenticated" });
    }

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.organizationId !== orgId) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Conversation not found" });
    }

    // Prevent duplicate tags on the same conversation
    const existing = await ctx.db
      .query("conversationTags")
      .withIndex("by_conversation_id", (q) => q.eq("conversationId", args.conversationId))
      .collect();

    const lowerTag = args.tag.trim().toLowerCase();
    if (existing.some((t) => t.tag.toLowerCase() === lowerTag)) {
      return; // already tagged
    }

    await ctx.db.insert("conversationTags", {
      conversationId: args.conversationId,
      organizationId: orgId,
      tag: args.tag.trim(),
      color: args.color,
      createdByUserId: identity!.tokenIdentifier,
    });
  },
});

/** Remove a tag from a conversation */
export const removeTag = mutation({
  args: {
    tagId: v.id("conversationTags"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const orgId = getOrgIdFromIdentity(identity);

    if (!orgId) {
      throw new ConvexError({ code: "UNAUTHORIZED", message: "Not authenticated" });
    }

    const tag = await ctx.db.get(args.tagId);
    if (!tag || tag.organizationId !== orgId) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Tag not found" });
    }

    await ctx.db.delete(args.tagId);
  },
});

/** List all tags on a specific conversation */
export const listTagsForConversation = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const orgId = getOrgIdFromIdentity(identity);

    if (!orgId) {
      return [];
    }

    return await ctx.db
      .query("conversationTags")
      .withIndex("by_conversation_id", (q) => q.eq("conversationId", args.conversationId))
      .collect();
  },
});

/** List all distinct tags used within an org (for autocomplete) */
export const listTagsForOrg = query({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const orgId = getOrgIdFromIdentity(identity);

    if (!orgId || orgId !== args.organizationId) {
      return [] as string[];
    }

    const tags = await ctx.db
      .query("conversationTags")
      .withIndex("by_organization_and_tag", (q) => q.eq("organizationId", orgId))
      .take(200);

    // Return unique tag names
    const unique = [...new Set(tags.map((t) => t.tag))].sort();
    return unique;
  },
});
