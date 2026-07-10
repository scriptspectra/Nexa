import { internalAction, internalMutation, internalQuery } from "../../_generated/server";
import { v } from "convex/values";
import { internal } from "../../_generated/api";
import { ChannelRegistry } from "./registry";
import { OutboundMessage } from "./types";

export const processOutbox = internalAction({
  handler: async (ctx) => {
    // 1. Fetch pending outbox messages
    const pendingMessages = await ctx.runQuery(internal.channels.base.outbox.getPendingMessages);
    
    if (pendingMessages.length === 0) return;

    console.log(`[Outbox] Processing ${pendingMessages.length} pending messages`);

    // 2. Process each message
    for (const outboxMsg of pendingMessages) {
      try {
        // Mark as processing
        await ctx.runMutation(internal.channels.base.outbox.updateStatus, {
          outboxMessageId: outboxMsg._id,
          status: "processing",
        });

        // Get full message details
        const msgDetails = await ctx.runQuery(internal.channels.base.outbox.getMessageDetails, {
          messageId: outboxMsg.messageId,
        });

        if (!msgDetails) {
          throw new Error("Message details not found");
        }

        const { message, conversation, contactIdentity, integration } = msgDetails;

        if (message.direction !== "outbound") {
          throw new Error("Cannot dispatch an inbound message");
        }

        // Get Adapter
        const adapter = ChannelRegistry.getAdapter(conversation.channel || "widget");

        // Format OutboundMessage
        const outboundPayload: OutboundMessage = {
          organizationId: conversation.organizationId,
          contactIdentity: {
            provider: contactIdentity.provider,
            externalId: contactIdentity.externalId,
          },
          content: message.content,
          type: message.type,
          threadId: conversation.threadId,
        };

        // Get Credentials (would normally decrypt here)
        const credentials = {
          accessToken: integration?.accessToken,
          phoneNumberId: "MOCK_PHONE_ID", // In reality, fetch from channelAssets
        };

        // Send via Adapter
        const result = await adapter.sendMessage(outboundPayload, credentials);

        if (result.success) {
          await ctx.runMutation(internal.channels.base.outbox.markSuccess, {
            outboxMessageId: outboxMsg._id,
            messageId: outboxMsg.messageId,
            externalMessageId: result.externalMessageId,
          });
        } else {
          throw new Error(result.error || "Delivery failed");
        }

      } catch (error: any) {
        console.error(`[Outbox] Failed to send message ${outboxMsg._id}:`, error);
        await ctx.runMutation(internal.channels.base.outbox.markFailed, {
          outboxMessageId: outboxMsg._id,
          error: error.message,
        });
      }
    }
  },
});

export const getPendingMessages = internalQuery({
  handler: async (ctx) => {
    return await ctx.db
      .query("outboxMessages")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .take(50); // Batch size
  },
});

export const getMessageDetails = internalQuery({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) return null;

    const conversation = await ctx.db.get(message.conversationId);
    if (!conversation) return null;
    if (!conversation.contactId) throw new Error("Conversation lacks contactId");

    // Get the identity for the channel the conversation is on
    const contactIdentity = await ctx.db
      .query("contactIdentities")
      .withIndex("by_contact_id", (q) => q.eq("contactId", conversation.contactId!))
      .filter((q) => q.eq(q.field("provider"), conversation.channel))
      .first();

    if (!contactIdentity) throw new Error("No contact identity for channel " + conversation.channel);

    let integration = null;
    if (message.integrationId) {
      integration = await ctx.db.get(message.integrationId);
    }

    return { message, conversation, contactIdentity, integration };
  },
});

export const updateStatus = internalMutation({
  args: {
    outboxMessageId: v.id("outboxMessages"),
    status: v.union(v.literal("pending"), v.literal("processing"), v.literal("failed")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.outboxMessageId, {
      status: args.status,
      lastAttemptAt: Date.now(),
    });
  },
});

export const markSuccess = internalMutation({
  args: {
    outboxMessageId: v.id("outboxMessages"),
    messageId: v.id("messages"),
    externalMessageId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Delete from outbox once sent successfully
    await ctx.db.delete(args.outboxMessageId);
    
    // Update message status
    await ctx.db.patch(args.messageId, {
      deliveryStatus: "sent",
      externalMessageId: args.externalMessageId,
    });
  },
});

export const markFailed = internalMutation({
  args: {
    outboxMessageId: v.id("outboxMessages"),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    const outboxMsg = await ctx.db.get(args.outboxMessageId);
    if (!outboxMsg) return;

    const retryCount = (outboxMsg.retryCount || 0) + 1;
    const status = retryCount > 5 ? "failed" : "pending"; // Simple backoff logic placeholder

    await ctx.db.patch(args.outboxMessageId, {
      status,
      error: args.error,
      retryCount,
      lastAttemptAt: Date.now(),
    });

    if (status === "failed") {
      await ctx.db.patch(outboxMsg.messageId, {
        deliveryStatus: "failed",
      });
    }
  },
});
