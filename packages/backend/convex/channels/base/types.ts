export interface ChannelCapabilities {
  supportsMedia: boolean;
  supportsTypingIndicators: boolean;
  supportsReadReceipts: boolean;
  supportsTemplates: boolean;
  replyWindowPolicy: "unlimited" | "24_hours" | "session";
}

export interface UnifiedMessage {
  organizationId: string;
  contactIdentity: {
    provider: string; // e.g. 'whatsapp', 'widget', 'email'
    externalId: string; // e.g. '+1234567890'
  };
  content: string; // Standardized string or block JSON
  type: "text" | "image" | "file" | "audio";
  source: {
    integrationId: string; // DB ID of the integration
    channel: string;       // e.g. 'whatsapp'
  };
  externalMessageId?: string;
}

export interface OutboundMessage {
  organizationId: string;
  integrationId: string;
  toExternalId: string;
  content: string;
  type: "text" | "image" | "file" | "audio";
  replyToExternalMessageId?: string;
}

export interface DeliveryResult {
  success: boolean;
  externalMessageId?: string;
  error?: string;
}

export interface IChannelAdapter {
  /**
   * Parse an incoming webhook payload into a normalized UnifiedMessage.
   */
  parseInbound(payload: unknown, integrationId: string, orgId: string): Promise<UnifiedMessage[]>;

  /**
   * Send an outbound message to the external provider.
   */
  sendMessage(message: OutboundMessage, credentials: Record<string, any>): Promise<DeliveryResult>;

  /**
   * Verify the incoming webhook request signature.
   */
  verifyWebhook(request: Request, webhookSecret: string): Promise<boolean>;

  /**
   * Return the static capabilities of this channel.
   */
  getCapabilities(): ChannelCapabilities;
}
