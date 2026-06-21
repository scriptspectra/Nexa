import { mutation } from "../_generated/server";
import { ConvexError, v } from "convex/values";

/**
 * Submit a CSAT rating from the widget after a conversation is resolved.
 * Called by the public widget — no auth required, but validated via contactSessionId.
 */
export const submit = mutation({
  args: {
    conversationId: v.id("conversations"),
    contactSessionId: v.id("contactSessions"),
    score: v.number(),          // 1–5
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate score range
    if (args.score < 1 || args.score > 5) {
      throw new ConvexError({ code: "BAD_REQUEST", message: "Score must be between 1 and 5" });
    }

    // Verify the session owns this conversation
    const session = await ctx.db.get(args.contactSessionId);
    if (!session || session.expiresAt < Date.now()) {
      throw new ConvexError({ code: "UNAUTHORIZED", message: "Invalid session" });
    }

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Conversation not found" });
    }
    if (conversation.contactSessionId !== session._id) {
      throw new ConvexError({ code: "UNAUTHORIZED", message: "Session mismatch" });
    }

    // Prevent duplicate submissions
    const existing = await ctx.db
      .query("csatRatings")
      .withIndex("by_conversation_id", (q) => q.eq("conversationId", args.conversationId))
      .unique();

    if (existing) {
      throw new ConvexError({ code: "CONFLICT", message: "Rating already submitted for this conversation" });
    }

    await ctx.db.insert("csatRatings", {
      conversationId: args.conversationId,
      organizationId: conversation.organizationId,
      score: args.score,
      comment: args.comment,
      submittedAt: Date.now(),
    });
  },
});
