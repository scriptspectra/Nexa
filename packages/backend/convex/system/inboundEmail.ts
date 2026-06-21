import { internalAction, internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { supportAgent } from "./ai/agents/supportAgent";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";

export const handleInboundEmail = internalMutation({
  args: {
    orgId: v.string(),
    fromEmail: v.string(),
    fromName: v.string(),
    subject: v.string(),
    textBody: v.string(),
    messageId: v.string(), // The Message-ID from the email to prevent duplicates or thread correctly
  },
  handler: async (ctx, args) => {
    // 1. Find or create contact session
    let contactSession = await ctx.db
      .query("contactSessions")
      .withIndex("by_organization_id", (q) => q.eq("organizationId", args.orgId))
      .filter((q) => q.eq(q.field("email"), args.fromEmail))
      .first();

    if (!contactSession) {
      const contactSessionId = await ctx.db.insert("contactSessions", {
        organizationId: args.orgId,
        name: args.fromName || args.fromEmail.split("@")[0] || "Unknown",
        email: args.fromEmail,
        expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 365, // 1 year
      });
      contactSession = await ctx.db.get(contactSessionId);
    }

    if (!contactSession) return;

    // 2. Find if there's an existing active conversation for this email thread
    // We could match by externalId (which we can store the root Message-ID in)
    // Or just find the latest unresolved conversation for this contact
    let conversation = await ctx.db
      .query("conversations")
      .withIndex("by_contact_session_id", (q) => q.eq("contactSessionId", contactSession!._id))
      .filter((q) => q.eq(q.field("status"), "unresolved"))
      .first();

    let threadId: string;

    if (!conversation) {
      // Create new conversation
      threadId = "thread_" + Math.random().toString(36).substring(2, 15);
      await ctx.db.insert("conversations", {
        organizationId: args.orgId,
        contactSessionId: contactSession._id,
        threadId,
        status: "unresolved",
        channel: "email",
        externalId: args.subject, // Store subject as externalId for display or threading
      });
    } else {
      threadId = conversation.threadId;
    }

    // Return the threadId and body so the Action can append the message via AI agent
    return {
      threadId,
      body: `Subject: ${args.subject}\n\n${args.textBody}`,
    };
  },
});

export const processInboundEmailAction = internalAction({
  args: {
    orgId: v.string(),
    fromEmail: v.string(),
    fromName: v.string(),
    subject: v.string(),
    textBody: v.string(),
    messageId: v.string(),
  },
  handler: async (ctx, args) => {
    const result = await ctx.runMutation(internal.system.inboundEmail.handleInboundEmail, args);
    if (!result) return;

    // Append message to thread
    await supportAgent.saveMessage(ctx, {
      threadId: result.threadId,
      message: {
        role: "user",
        content: result.body,
      },
    });

    // We can also trigger the AI to respond, but for email we might just leave it for human agents
    // If we wanted auto-reply:
    // await ctx.scheduler.runAfter(0, internal.system.ai.agents.supportAgent.generateResponse, { ... })
  },
});

export const getConversationDetails = internalQuery({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return null;
    const contactSession = await ctx.db.get(conversation.contactSessionId);
    if (!contactSession) return null;
    return { conversation, contactSession };
  },
});

export const appendAgentMessage = internalMutation({
  args: {
    threadId: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    await supportAgent.saveMessage(ctx, {
      threadId: args.threadId,
      message: {
        role: "assistant",
        content: args.content,
      },
    });
  },
});
