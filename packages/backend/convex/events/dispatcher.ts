import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";
import { UnifiedMessage } from "../channels/base/types";
import { supportAgent } from "../system/ai/agents/supportAgent";

export const dispatchInboundMessage = internalAction({
  args: {
    unifiedMessage: v.any(), // UnifiedMessage type
  },
  handler: async (ctx, args) => {
    const msg = args.unifiedMessage as UnifiedMessage;
    
    // 1. Resolve Identity and Conversation
    const { conversationId } = await ctx.runMutation(internal.events.dispatcher.resolveIdentityAndConversation, {
      organizationId: msg.organizationId,
      provider: msg.contactIdentity.provider,
      externalId: msg.contactIdentity.externalId,
      channel: msg.source.channel,
    });

    // 2. Save Message to Database
    await ctx.runMutation(internal.private.messages.saveInboundMessage, {
      conversationId: conversationId,
      content: msg.content,
      type: msg.type as any,
      channel: msg.source.channel,
      externalMessageId: msg.externalMessageId,
    });

    // 3. Save message to agent thread & trigger AI response
    const conversation = await ctx.runQuery(internal.events.dispatcher.getConversationThreadId, { conversationId });
    if (conversation) {
      // Save user message to the agent's thread
      await supportAgent.saveMessage(ctx, {
        threadId: conversation.threadId,
        message: { role: "user", content: msg.content },
      });

      // Schedule AI response via the dedicated action
      await ctx.scheduler.runAfter(0, internal.events.dispatcher.triggerAIResponse, {
        threadId: conversation.threadId,
        conversationId,
      });
    }
  },
});

export const triggerAIResponse = internalAction({
  args: {
    threadId: v.string(),
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    await supportAgent.generateResponse(ctx, {
      threadId: args.threadId,
      promptContext: {},
    });
  },
});

export const getConversationThreadId = internalQuery({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.conversationId);
  }
});

export const resolveIdentityAndConversation = internalMutation({
  args: {
    organizationId: v.string(),
    provider: v.string(),
    externalId: v.string(),
    channel: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Find or create ContactIdentity
    let contactIdentity = await ctx.db
      .query("contactIdentities")
      .withIndex("by_external_id", (q) => q.eq("externalId", args.externalId).eq("provider", args.provider))
      .first();

    let contactId;

    if (contactIdentity) {
      contactId = contactIdentity.contactId;
    } else {
      // Create new contact
      contactId = await ctx.db.insert("contacts", {
        organizationId: args.organizationId,
        createdAt: Date.now(),
      });

      // Create identity link
      await ctx.db.insert("contactIdentities", {
        contactId,
        provider: args.provider,
        externalId: args.externalId,
      });
    }

    // 2. Find active conversation
    let conversation = await ctx.db
      .query("conversations")
      .withIndex("by_contact_id", (q) => q.eq("contactId", contactId))
      .filter((q) => q.eq(q.field("status"), "unresolved"))
      .first();

    let conversationId;

    if (conversation) {
      conversationId = conversation._id;
    } else {
      // Create new conversation
      const threadId = "thread_" + Math.random().toString(36).substring(2, 15);
      conversationId = await ctx.db.insert("conversations", {
        organizationId: args.organizationId,
        contactId,
        threadId,
        status: "unresolved",
        channel: args.channel as any,
      });
    }

    return { conversationId, contactId };
  },
});
