import { mutation, query, action } from "./_generated/server";
import { createClerkClient } from "@clerk/backend";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY || "",
});

export const createTestOrg = action({
  args: {},
  handler: async () => {
    try {
      const org = await clerkClient.organizations.createOrganization({
        name: "Nexa Test Org",
      });
      return { success: true, orgId: org.id };
    } catch (error: any) {
      console.error("CREATE_ORG_ERROR:", error);
      return { success: false, error: error.message || error };
    }
  },
});

export const activatePlan = mutation({
  args: {},
  handler: async (ctx) => {
    const orgs = [
      "org_3DhyK9WTYHRNL13zsVcSvjLoamD",
      "org_3DhhFLWBuZNBaVeV74xPhcts63E",
      "org_3DhgvrIoHLWqhV0iwEi4E23wzIQ",
      "org_3DheqaeNRI4RAV8Fgu3EhsbFthC"
    ];

    for (const orgId of orgs) {
      const existingSubscription = await ctx.db
        .query("subscriptions")
        .withIndex("by_organization_id", (q) => 
          q.eq("organizationId", orgId),
        )
        .unique();

      if (existingSubscription) {
        await ctx.db.patch(existingSubscription._id, {
          status: "active",
        });
      } else {
        await ctx.db.insert("subscriptions", {
          organizationId: orgId,
          status: "active",
        });
      }
    }

    return { success: true, message: "All your organizations are now PRO!" };
  },
});

export const listOrgs = query({
  args: {},
  handler: async (ctx) => {
    const conversations = await ctx.db.query("conversations").collect();
    const orgs = conversations.map((c) => c.organizationId);
    return [...new Set(orgs)];
  },
});
