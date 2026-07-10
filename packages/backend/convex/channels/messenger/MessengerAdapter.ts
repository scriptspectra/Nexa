import { ChannelCapabilities, DeliveryResult, IChannelAdapter, OutboundMessage, UnifiedMessage } from "../base/types";
import { MetaWebhookPayload } from "../../providers/meta/types";

export class MessengerAdapter implements IChannelAdapter {
  
  public async parseInbound(payload: MetaWebhookPayload, integrationId: string, orgId: string): Promise<UnifiedMessage[]> {
    const messages: UnifiedMessage[] = [];
    
    for (const entry of payload.entry) {
      if (entry.messaging) {
        for (const msgEvent of entry.messaging) {
          if (msgEvent.message) {
            messages.push({
              organizationId: orgId,
              contactIdentity: {
                provider: "messenger",
                externalId: msgEvent.sender.id,
              },
              content: msgEvent.message.text || "",
              type: msgEvent.message.attachments ? "image" : "text",
              source: {
                integrationId,
                channel: "messenger",
              },
              externalMessageId: msgEvent.message.mid,
            });
          }
        }
      }
    }
    
    return messages;
  }

  public async sendMessage(message: OutboundMessage, credentials: Record<string, any>): Promise<DeliveryResult> {
    // Send message using Meta Graph API via fetch
    const response = await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${credentials.accessToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: message.contactIdentity.externalId },
        message: { text: message.content }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error?.message || "Failed to send message" };
    }

    return { success: true, externalMessageId: data.message_id };
  }

  public async verifyWebhook(request: Request, webhookSecret: string): Promise<boolean> {
    // Handled centrally by WebhookVerifier
    return true;
  }

  public getCapabilities(): ChannelCapabilities {
    return {
      supportsMedia: true,
      supportsTypingIndicators: true,
      supportsReadReceipts: true,
      supportsTemplates: true,
      replyWindowPolicy: "24_hours",
    };
  }
}
