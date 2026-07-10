export type SystemEvent =
  | { type: "MessageReceived"; payload: { unifiedMessageId?: string, unifiedMessage?: any } }
  | { type: "ConversationCreated"; payload: { conversationId: string } }
  | { type: "AIResponseGenerated"; payload: { outboxMessageId: string } }
  | { type: "MessageSent"; payload: { messageId: string } }
  | { type: "MessageDelivered"; payload: { messageId: string } }
  | { type: "EscalationRequested"; payload: { conversationId: string } };

export class EventBus {
  /**
   * Publishes an event asynchronously using Convex scheduler.
   * `ctx` can be either an ActionCtx or MutationCtx.
   */
  static async publish(ctx: any, event: SystemEvent) {
    // Dynamically require to avoid circular dependencies if used inside mutations
    // In Convex, we usually schedule internal actions/mutations directly, but 
    // wrapping it in this EventBus provides a unified interface.
    
    // We assume an internal mutation/action exists at internal.events.handlers.processEvent
    // Note: To make this strictly type-safe with Convex, you may need to pass the specific 
    // internal reference, e.g., EventBus.publish(ctx, internal.events.handlers.processEvent, event)
    
    // For now, we will expect callers to pass the scheduled function or we can import it.
    // However, importing `internal` here is standard in Convex.
    const { internal } = require("../_generated/api");
    await ctx.scheduler.runAfter(0, internal.events.handlers.processEvent, { event });
  }
}
