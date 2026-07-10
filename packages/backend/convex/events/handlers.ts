import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";

export const processEvent = internalAction({
  args: {
    event: v.any(), // Accepts SystemEvent
  },
  handler: async (ctx, args) => {
    const { event } = args;
    console.log(`[EventBus] Processing event: ${event.type}`, event.payload);

    // Basic event routing
    switch (event.type) {
      case "MessageReceived":
        // Route to Workflow Engine or AI
        // await ctx.runAction(internal.core.workflows.evaluateMessage, { messageId: event.payload.unifiedMessageId });
        break;
      
      case "AIResponseGenerated":
        // Route to Dispatcher
        // await ctx.runAction(internal.core.messaging.dispatchOutboxMessage, { outboxMessageId: event.payload.outboxMessageId });
        break;
        
      default:
        console.log(`[EventBus] No handler registered for ${event.type}`);
    }
  },
});
