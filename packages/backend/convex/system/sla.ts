import { internalMutation } from "../_generated/server";

export const checkSlas = internalMutation({
  args: {},
  handler: async (ctx) => {
    // 1. Fetch all SLA configs
    const configs = await ctx.db.query("slaConfig").collect();
    
    // For each config, check unresolved conversations
    for (const config of configs) {
      const { organizationId, firstResponseTargetMs, resolutionTargetMs } = config;
      
      const unresolvedConversations = await ctx.db
        .query("conversations")
        .withIndex("by_status_and_organization_id", (q) => 
          q.eq("status", "unresolved").eq("organizationId", organizationId)
        )
        .collect();

      const escalatedConversations = await ctx.db
        .query("conversations")
        .withIndex("by_status_and_organization_id", (q) => 
          q.eq("status", "escalated").eq("organizationId", organizationId)
        )
        .collect();

      const activeConversations = [...unresolvedConversations, ...escalatedConversations];

      const now = Date.now();

      for (const conv of activeConversations) {
        let isBreached = false;
        
        // 1. First Response Breach
        if (!conv.firstResponseAt && firstResponseTargetMs > 0) {
          if (now - conv._creationTime > firstResponseTargetMs) {
            isBreached = true;
          }
        }
        
        // 2. Resolution Breach
        if (resolutionTargetMs > 0) {
          if (now - conv._creationTime > resolutionTargetMs) {
            isBreached = true;
          }
        }

        const newStatus = isBreached ? "breached" : "ok";
        if (conv.slaStatus !== newStatus) {
          await ctx.db.patch(conv._id, {
            slaStatus: newStatus,
          });
        }
      }
    }
  },
});
