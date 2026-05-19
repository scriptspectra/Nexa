import { query } from "../_generated/server";

export const listOrgs = query({
  args: {},
  handler: async (ctx) => {
    const conversations = await ctx.db.query("conversations").collect();
    const orgs = conversations.map((c) => c.organizationId);
    return [...new Set(orgs)];
  },
});
