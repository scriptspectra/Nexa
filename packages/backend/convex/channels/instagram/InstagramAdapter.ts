import { ChannelCapabilities, DeliveryResult, IChannelAdapter, OutboundMessage, UnifiedMessage } from "../base/types";
import { MetaWebhookPayload } from "../../providers/meta/types";

export class InstagramAdapter implements IChannelAdapter {
  
  public async parseInbound(payload: MetaWebhookPayload, integrationId: string, orgId: string): Promise<UnifiedMessage[]> {
    const messages: UnifiedMessage[] = [];
    
    // Instagram Direct uses the same webhook structure as Messenger but with "instagram" product tags
    for (const entry of payload.entry) {
      if (entry.messaging) {
        for (const msgEvent of entry.messaging) {
          if (msgEvent.message) {
            messages.push({
              organizationId: orgId,
              contactIdentity: {
                provider: "instagram",
                externalId: msgEvent.sender.id, // Instagram Scoped ID (IGSID)
              },
              content: msgEvent.message.text || "",
              type: msgEvent.message.attachments ? "image" : "text",
              source: {
                integrationId,
                channel: "instagram",
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
    // Instagram messaging uses the same `/me/messages` endpoint as Messenger but requires IG token/page linked
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
      return { success: false, error: data.error?.message || "Failed to send Instagram message" };
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
      supportsTypingIndicators: false, // Not fully supported by all IG endpoints
      supportsReadReceipts: true,
      supportsTemplates: false, // IG does not use WA templates
      replyWindowPolicy: "24_hours",
    };
  }
}
