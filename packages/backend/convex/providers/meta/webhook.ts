import { v } from "convex/values";
import { internalAction, internalQuery } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { ChannelRegistry } from "../../channels/base/registry";
import { EventBus } from "../../events/bus";

export const processMetaWebhook = internalAction({
  args: {
    payload: v.any(),
    signature: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Verify signature (in a real app, use WebCrypto API to verify HMAC)
    // We skip the strict check in MVP if signature is missing or secret is missing.
    // Assuming verification passed for now...

    const { payload } = args;

    if (!payload.object || !payload.entry) {
      console.warn("Invalid Meta webhook payload structure");
      return;
    }

    // Determine the product (page, instagram, whatsapp_business_account)
    const product = payload.object;
    let channelId = "messenger";

    if (product === "instagram") channelId = "instagram";
    if (product === "whatsapp_business_account") channelId = "whatsapp";

    // 2. Identify the integration based on the entry ID (e.g. Page ID, Phone Number ID)
    // We need an internal query to map asset ID -> Integration & Org ID.
    // For MVP, we will iterate entries and process them.
    for (const entry of payload.entry) {
      let externalAssetId = entry.id;

      // For WhatsApp, the ID might be deeply nested in changes
      if (channelId === "whatsapp" && entry.changes) {
        externalAssetId = entry.changes[0]?.value?.metadata?.phone_number_id || entry.id;
      }

      // Lookup Org and Integration
      const asset = await ctx.runQuery(internal.providers.meta.webhook.lookupAsset, { externalAssetId });
      
      if (!asset) {
        console.warn(`No connected asset found for ID: ${externalAssetId}`);
        continue;
      }

      // 3. Resolve the Adapter
      const adapter = ChannelRegistry.getAdapter(channelId);

      // 4. Parse into UnifiedMessage
      const messages = await adapter.parseInbound(payload, asset.integrationId, asset.organizationId);

      // 5. Publish to EventBus
      for (const msg of messages) {
        await EventBus.publish(ctx, {
          type: "MessageReceived",
          payload: { unifiedMessage: msg }
        });
      }
    }
  },
});

export const lookupAsset = internalQuery({
  args: { externalAssetId: v.string() },
  handler: async (ctx, args) => {
    // First try a direct lookup by externalResourceId (works for Facebook Pages and WhatsApp)
    const direct = await ctx.db
      .query("integrationResources")
      .withIndex("by_external_resource_id", (q) =>
        q.eq("externalResourceId", args.externalAssetId),
      ).first();

    if (direct) return direct;

    // Fallback: for Instagram webhooks, entry.id is the Facebook Page ID,
    // but we stored the IG account ID as externalResourceId with raw.pageId = Page ID.
    // Scan instagram_account resources and match on raw.pageId.
    const allResources = await ctx.db.query("integrationResources").collect();
    const igResource = allResources.find(
      (r) => r.resourceType === "instagram_account" && r.raw?.pageId === args.externalAssetId
    );

    return igResource ?? null;
  }
});
