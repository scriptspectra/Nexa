import { createTool } from "@convex-dev/agent";
import z from "zod";
import { internal } from "../../../_generated/api";
import { supportAgent } from "../agents/supportAgent";
import { getSecretValue, parseSecretString } from "../../lib/secrets";
import { fetchShopifyOrderByName } from "../../lib/shopify";

export const lookupShopifyOrder = createTool({
  description: "Look up a Shopify order by its order number or name (e.g. #1001) to find its status, tracking info, and line items.",
  args: z.object({
    orderName: z
      .string()
      .describe("The order number or name to search for (e.g. 1001 or #1001)")
  }),
  handler: async (ctx, args) => {
    if (!ctx.threadId) {
      return "Missing thread ID. Cannot lookup orders outside of a conversation thread.";
    }

    const conversation = await ctx.runQuery(
      internal.system.conversations.getByThreadId,
      { threadId: ctx.threadId },
    );

    if (!conversation) {
      return "Conversation not found";
    }

    const orgId = conversation.organizationId;

    // Check if Shopify is connected
    const plugin = await ctx.runQuery(
      internal.system.plugins.getByOrganizationIdAndService,
      { organizationId: orgId, service: "shopify" }
    );

    if (!plugin) {
      return "Shopify is not connected for this organization. Please inform the user that they need to connect Shopify first.";
    }

    try {
      const secret = await getSecretValue(plugin.secretName);
      const secretData = parseSecretString<{ shopDomain: string; adminApiKey: string }>(secret);
      
      if (!secretData) {
        return "Invalid Shopify configuration. Unable to retrieve credentials.";
      }

      const order = await fetchShopifyOrderByName(
        secretData.shopDomain,
        secretData.adminApiKey,
        args.orderName
      );

      if (!order) {
        const notFoundMsg = `Order ${args.orderName} could not be found in Shopify. Ask the user if they have the correct order number.`;
        
        await supportAgent.saveMessage(ctx, {
          threadId: ctx.threadId,
          message: { role: "assistant", content: notFoundMsg },
        });
        
        return notFoundMsg;
      }

      // Format the order data into a human-readable string for the LLM
      const lineItems = order.line_items?.map((item: any) => 
        `- ${item.quantity}x ${item.title} ($${item.price})`
      ).join("\n") || "No items";

      const fulfillments = order.fulfillments?.map((f: any) => 
        `Status: ${f.status}, Tracking: ${f.tracking_company} ${f.tracking_number} (URL: ${f.tracking_url})`
      ).join("\n") || "Not fulfilled yet";

      const orderSummary = `
Order ${order.name} details:
Status: ${order.financial_status} / ${order.fulfillment_status || "unfulfilled"}
Total: $${order.total_price} ${order.currency}
Customer: ${order.customer?.first_name} ${order.customer?.last_name} (${order.customer?.email})

Items:
${lineItems}

Fulfillment Info:
${fulfillments}

Notes: ${order.note || "None"}
      `.trim();

      await supportAgent.saveMessage(ctx, {
        threadId: ctx.threadId,
        message: {
          role: "assistant",
          content: `I found the order in Shopify: ${order.name}.`,
        },
      });

      return orderSummary;

    } catch (error: any) {
      console.error("Shopify Order Lookup Error:", error);
      return `Failed to look up order: ${error.message}`;
    }
  },
});
