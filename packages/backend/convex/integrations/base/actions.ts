import { internalAction, internalMutation, internalQuery } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { v } from "convex/values";

export const syncAllIntegrations = internalAction({
  args: {},
  handler: async (ctx) => {
    // Note: In a real system you'd paginate this
    const integrations = await ctx.runQuery(internal.integrations.base.actions.getAllActiveIntegrations);

    for (const integration of integrations) {
      if (!integration.accessToken) continue;

      try {
        // We only have Meta implemented right now
        if (integration.provider === "meta") {
          // Health check & sync logic goes here
          // This would ideally map via a ProviderRegistry
          await ctx.runAction(internal.integrations.meta.actions.discoverMetaResources, {
            organizationId: integration.organizationId,
          });
        }
      } catch (e: any) {
        console.error(`Integration sync failed for ${integration._id}`, e);
        await ctx.runMutation(internal.integrations.base.actions.updateIntegrationState, {
          integrationId: integration._id,
          status: "reconnect_required",
          errorState: e.message,
        });
      }
    }
  },
});

export const getAllActiveIntegrations = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("integrations")
      .filter((q) => q.neq(q.field("status"), "disconnected"))
      .collect();
  },
});

export const updateIntegrationState = internalMutation({
  args: {
    integrationId: v.id("integrations"),
    status: v.string(),
    errorState: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.integrationId, {
      status: args.status as any,
      errorState: args.errorState,
      lastSyncedAt: Date.now(),
    });
  },
});
