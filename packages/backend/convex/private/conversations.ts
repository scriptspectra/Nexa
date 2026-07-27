import { action, mutation, query, internalQuery } from "../_generated/server";
import { ConvexError, v } from "convex/values";
import { supportAgent } from "../system/ai/agents/supportAgent";
import { MessageDoc } from "@convex-dev/agent";
import { paginationOptsValidator, PaginationResult } from "convex/server";
import { internal, api } from "../_generated/api";
import { Doc } from "../_generated/dataModel";
import { sendEmail, sendEscalationEmail } from "../lib/email";

export const updateStatus = mutation({
  args: {
    conversationId: v.id("conversations"),
    status: v.union(
      v.literal("unresolved"),
      v.literal("escalated"),
      v.literal("resolved")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (identity === null) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Identity not found",
      });
    }

    const orgId = (identity.orgId || (identity as any).org_id) as string;

    if (!orgId) {
      console.log("CONVERSATIONS_DEBUG: Missing Org in updateStatus");
      return;
    }

    const conversation = await ctx.db.get(args.conversationId);

    if (!conversation) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Conversation not found"
      });
    }

    if (conversation.organizationId !== orgId) {
      throw new ConvexError({
        code: "UNAUTHORZIED",
        message: "Invalid Organization ID",
      });
    }

    await ctx.db.patch(args.conversationId, {
      status: args.status,
    });

    await ctx.runMutation(internal.private.audit.logAction, {
      organizationId: orgId,
      actorUserId: identity.subject,
      actorName: identity.name || "Unknown Agent",
      action: `Status changed to ${args.status}`,
      resourceType: "conversation",
      resourceId: args.conversationId,
    });

    await ctx.scheduler.runAfter(0, internal.private.webhooks.dispatchEventAction, {
      organizationId: orgId,
      eventType: "conversation.updated",
      payload: {
        conversationId: args.conversationId,
        status: args.status,
      },
    });

    // ── Send escalation email to the end-user ─────────────────────────────────
    if (args.status === "escalated" && conversation.contactSessionId) {
      const contactSession = await ctx.db.get(conversation.contactSessionId);
      if (contactSession?.email) {
        // Fire-and-forget — don't let email failure break the status update
        sendEscalationEmail({
          contactEmail: contactSession.email,
          contactName: contactSession.name,
          organizationName: orgId,
          conversationId: args.conversationId,
        }).catch((err) => console.error("ESCALATION_EMAIL_ERROR:", err));
      }
    }
  },
});


export const getOne = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (identity === null) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Identity not found",
      });
    }

    const orgId = (identity.orgId || (identity as any).org_id) as string;

    if (!orgId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Organization not found",
      });
    }

    const conversation = await ctx.db.get(args.conversationId);

    if (!conversation) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Conversation not found"
      });
    }

    if (conversation.organizationId !== orgId) {
      throw new ConvexError({
        code: "UNAUTHORZIED",
        message: "Invalid Organization ID",
      });
    }

    if (!conversation.contactSessionId) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Contact Session not found"
      });
    }

    const contactSession = await ctx.db.get(conversation.contactSessionId);

    if (!contactSession) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Contact Session not found"
      });
    }

    return {
      ...conversation,
      contactSession,
    };
  },
});

export const getMany = query({
  args: {
    paginationOpts: paginationOptsValidator,
    status: v.optional(
      v.union(
        v.literal("unresolved"),
        v.literal("escalated"),
        v.literal("resolved")
      )
    ),
    assignedToUserId: v.optional(v.string()),
    tag: v.optional(v.string()),
    channel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (identity === null) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Identity not found",
      });
    }

    const orgId = (identity.orgId || (identity as any).org_id) as string;

    if (!orgId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Organization not found",
      });
    }

    let conversations: PaginationResult<Doc<"conversations">>;

    if (args.assignedToUserId) {
      conversations = await ctx.db
        .query("conversations")
        .withIndex("by_assigned_user", (q) =>
          q
            .eq("assignedToUserId", args.assignedToUserId as string)
            .eq("organizationId", orgId)
        )
        // If status filter is also present, we must filter in-memory or by index scan
        // Convex indexes must be matched exactly from left to right.
        .filter((q) => {
          const statusCondition = args.status
            ? q.eq(q.field("status"), args.status)
            : q.neq(q.field("status"), "never-match-this-status");
          
          if (args.channel) {
            return q.and(statusCondition, q.eq(q.field("channel"), args.channel));
          }
          return statusCondition;
        })
        .order("desc")
        .paginate(args.paginationOpts);
    } else if (args.status) {
      conversations = await ctx.db
        .query("conversations")
        .withIndex("by_status_and_organization_id", (q) =>
          q
            .eq(
              "status",
              args.status as Doc<"conversations">["status"],
            )
            .eq("organizationId", orgId)
        )
        .filter((q) => 
          args.channel ? q.eq(q.field("channel"), args.channel) : q.neq(q.field("status"), "never-match-this-status")
        )
        .order("desc")
        .paginate(args.paginationOpts)
    } else {
      conversations = await ctx.db
        .query("conversations")
        .withIndex("by_organization_id", (q) => q.eq("organizationId", orgId))
        .filter((q) => 
          args.channel ? q.eq(q.field("channel"), args.channel) : q.neq(q.field("status"), "never-match-this-status")
        )
        .order("desc")
        .paginate(args.paginationOpts)
    }

    const conversationsWithAdditionalData = await Promise.all(
      conversations.page.map(async (conversation: any) => {
        let lastMessage: MessageDoc | null = null;

        if (!conversation.contactSessionId) {
          return null;
        }

        const contactSession = await ctx.db.get(conversation.contactSessionId);

        if (!contactSession) {
          return null;
        }

        const messages = await supportAgent.listMessages(ctx, {
          threadId: conversation.threadId,
          paginationOpts: { numItems: 1, cursor: null },
        });

        if (messages.page.length > 0) {
          lastMessage = messages.page[0] ?? null;
        }

        return {
          ...conversation,
          lastMessage,
          contactSession,
        };
      })
    );

    let validConversations = conversationsWithAdditionalData.filter(
      (conv): conv is NonNullable<typeof conv> => conv !== null,
    );

    // Apply tag filter in-memory if requested (since tags are in a separate table)
    if (args.tag) {
      const filtered = [];
      for (const conv of validConversations) {
        const tags = await ctx.db
          .query("conversationTags")
          .withIndex("by_conversation_id", (q) => q.eq("conversationId", conv._id))
          .collect();
        
        if (tags.some((t) => t.tag.toLowerCase() === args.tag!.toLowerCase())) {
          filtered.push(conv);
        }
      }
      validConversations = filtered;
    }

    return {
      ...conversations,
      page: validConversations,
    };
  },
});

export const assign = mutation({
  args: {
    conversationId: v.id("conversations"),
    assignedToUserId: v.optional(v.string()), // undefined means unassign
    assignedToName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (identity === null) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Identity not found",
      });
    }

    const orgId = (identity.orgId || (identity as any).org_id) as string;

    if (!orgId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Organization not found",
      });
    }

    const conversation = await ctx.db.get(args.conversationId);

    if (!conversation) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Conversation not found",
      });
    }

    if (conversation.organizationId !== orgId) {
      throw new ConvexError({
        code: "UNAUTHORZIED",
        message: "Invalid Organization ID",
      });
    }

    await ctx.db.patch(args.conversationId, {
      assignedToUserId: args.assignedToUserId,
      assignedToName: args.assignedToName,
      assignedAt: args.assignedToUserId ? Date.now() : undefined,
    });

    await ctx.runMutation(internal.private.audit.logAction, {
      organizationId: orgId,
      actorUserId: identity.subject,
      actorName: identity.name || "Unknown Agent",
      action: args.assignedToUserId ? `Assigned to ${args.assignedToName}` : "Unassigned",
      resourceType: "conversation",
      resourceId: args.conversationId,
    });

    await ctx.scheduler.runAfter(0, internal.private.webhooks.dispatchEventAction, {
      organizationId: orgId,
      eventType: "conversation.updated",
      payload: {
        conversationId: args.conversationId,
        assignedToUserId: args.assignedToUserId,
        assignedToName: args.assignedToName,
      },
    });

    if (args.assignedToUserId) {
      await ctx.scheduler.runAfter(0, internal.private.pushAction.sendNotificationAction, {
        userIds: [args.assignedToUserId],
        title: "Conversation Assigned",
        body: `You have been assigned conversation ${args.conversationId}`,
        url: `/conversations/${args.conversationId}`,
      });
    }
  },
});

export const sendEmailReply = action({
  args: {
    conversationId: v.id("conversations"),
    subject: v.string(),
    textBody: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const orgId = (identity.orgId || (identity as any).org_id) as string;
    if (!orgId) throw new ConvexError("Organization not found");

    // Fetch conversation & contact via a query or internalQuery
    // Note: actions can only run queries, we need to create an internalQuery or fetch via mutation
    const data = await ctx.runQuery(internal.system.inboundEmail.getConversationDetails, {
      conversationId: args.conversationId,
    });

    if (!data || data.conversation.organizationId !== orgId) {
      throw new ConvexError("Invalid conversation");
    }

    const { conversation, contactSession } = data;

    if (!contactSession.email) {
      throw new ConvexError("Contact does not have an email address");
    }

    // Format HTML body simply
    const htmlBody = `<div style="font-family: sans-serif; font-size: 14px;">${args.textBody.replace(/\n/g, "<br/>")}</div>`;

    const success = await sendEmail({
      to: contactSession.email,
      subject: args.subject || "Re: Your Support Request",
      html: htmlBody,
    });

    if (!success) {
      throw new ConvexError("Failed to send email via Resend");
    }

    // Append to conversation
    await ctx.runMutation(internal.system.inboundEmail.appendAgentMessage, {
      threadId: conversation.threadId,
      content: args.textBody,
    });
  },
});

export const listByOrgId = internalQuery({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("conversations")
      .withIndex("by_organization_id", (q) => q.eq("organizationId", args.organizationId))
      .collect();
  },
});
