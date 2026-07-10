import { ChannelCapabilities, DeliveryResult, IChannelAdapter, OutboundMessage, UnifiedMessage } from "../base/types";
import { MetaWebhookPayload } from "../../providers/meta/types";

export class WhatsAppAdapter implements IChannelAdapter {
  
  public async parseInbound(payload: MetaWebhookPayload, integrationId: string, orgId: string): Promise<UnifiedMessage[]> {
    const messages: UnifiedMessage[] = [];
    
    for (const entry of payload.entry) {
      if (entry.changes) {
        for (const change of entry.changes) {
          if (change.value && change.value.messages) {
            for (const msg of change.value.messages) {
              messages.push({
                organizationId: orgId,
                contactIdentity: {
                  provider: "whatsapp",
                  externalId: msg.from,
                },
                content: msg.text?.body || "",
                type: msg.type === "text" ? "text" : "image",
                source: {
                  integrationId,
                  channel: "whatsapp",
                },
                externalMessageId: msg.id,
              });
            }
          }
        }
      }
    }
    
    return messages;
  }

  public async sendMessage(message: OutboundMessage, credentials: Record<string, any>): Promise<DeliveryResult> {
    // WhatsApp Cloud API sends messages via the phone_number_id
    const response = await fetch(`https://graph.facebook.com/v19.0/${credentials.phoneNumberId}/messages`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${credentials.accessToken}`
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: message.contactIdentity.externalId,
        type: "text",
        text: { body: message.content }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error?.message || "Failed to send WhatsApp message" };
    }

    return { success: true, externalMessageId: data.messages?.[0]?.id };
  }

  public async verifyWebhook(request: Request, webhookSecret: string): Promise<boolean> {
    // Handled centrally by WebhookVerifier
    return true;
  }

  public getCapabilities(): ChannelCapabilities {
    return {
      supportsMedia: true,
      supportsTypingIndicators: false, // WhatsApp Cloud API does not support sending typing indicators yet
      supportsReadReceipts: true,
      supportsTemplates: true,
      replyWindowPolicy: "24_hours",
    };
  }
}
