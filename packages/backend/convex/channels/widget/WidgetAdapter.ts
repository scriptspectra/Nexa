import { ChannelCapabilities, DeliveryResult, IChannelAdapter, OutboundMessage, UnifiedMessage } from "../base/types";

/**
 * Adapter for the native Web Widget.
 * The Web Widget is unique because it uses Convex subscriptions rather than webhooks.
 */
export class WidgetAdapter implements IChannelAdapter {
  
  public async parseInbound(payload: any, integrationId: string, orgId: string): Promise<UnifiedMessage[]> {
    // For the widget, the payload is directly provided by the Convex mutation
    // Expected payload: { content: string, contactId: string }
    
    const message: UnifiedMessage = {
      organizationId: orgId,
      contactIdentity: {
        provider: "widget",
        externalId: payload.contactId, // Using Convex contact ID as external ID for widget
      },
      content: payload.content,
      type: "text",
      source: {
        integrationId,
        channel: "widget",
      },
      externalMessageId: payload.messageId || `widget-${Date.now()}`
    };

    return [message];
  }

  public async sendMessage(message: OutboundMessage, credentials: Record<string, any>): Promise<DeliveryResult> {
    // The Web Widget uses real-time Convex queries.
    // By the time `sendMessage` is called, the message is already saved in the unified `messages` table.
    // The React client automatically syncs it. Therefore, no external HTTP call is needed.
    return {
      success: true,
      externalMessageId: `widget-delivered-${Date.now()}`
    };
  }

  public async verifyWebhook(request: Request, webhookSecret: string): Promise<boolean> {
    // The widget does not use webhooks. Requests come through authenticated Convex mutations.
    return true;
  }

  public getCapabilities(): ChannelCapabilities {
    return {
      supportsMedia: true,
      supportsTypingIndicators: true, // Configurable in the frontend
      supportsReadReceipts: true,
      supportsTemplates: false, // Not required for proprietary widget
      replyWindowPolicy: "unlimited", // Owned channel, no 24h restrictions
    };
  }
}
