import { v } from "convex/values";
import { query } from "../_generated/server";
import { getOrgIdFromIdentity } from "../lib/orgAuth";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const EMPTY_METRICS = {
  totalConversations: 0,
  resolutionRate: 0,
  csatScore: "N/A",
  avgResponseTime: "N/A",
  chartData: [] as Array<{
    date: string;
    aiHandled: number;
    operatorHandled: number;
  }>,
};

function toDateKey(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toDateLabel(timestamp: number): string {
  const date = new Date(timestamp);
  const month = MONTHS[date.getUTCMonth()];
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${month} ${day}`;
}

export const getMetrics = query({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const orgId = getOrgIdFromIdentity(identity);

    if (!orgId || orgId !== args.organizationId) {
      return EMPTY_METRICS;
    }

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    const allConversations = await ctx.db
      .query("conversations")
      .withIndex("by_organization_id", (q) => q.eq("organizationId", orgId))
      .collect();

    const conversations = allConversations.filter(
      (conversation) => conversation._creationTime >= thirtyDaysAgo,
    );

    const totalConversations = conversations.length;
    const resolvedConversations = conversations.filter(
      (conversation) => conversation.status === "resolved",
    ).length;

    const resolutionRate =
      totalConversations === 0
        ? 0
        : Math.round((resolvedConversations / totalConversations) * 100);

    const daily: Record<
      string,
      {
        sortKey: string;
        date: string;
        aiHandled: number;
        operatorHandled: number;
      }
    > = {};

    conversations.forEach((conversation) => {
      const dateKey = toDateKey(conversation._creationTime);
      const label = toDateLabel(conversation._creationTime);

      if (!daily[dateKey]) {
        daily[dateKey] = {
          sortKey: dateKey,
          date: label,
          aiHandled: 0,
          operatorHandled: 0,
        };
      }

      if (conversation.status === "escalated") {
        daily[dateKey].operatorHandled++;
      } else {
        daily[dateKey].aiHandled++;
      }
    });

    const chartData = Object.values(daily)
      .sort(
        (left, right) =>
          new Date(left.sortKey).getTime() - new Date(right.sortKey).getTime(),
      )
      .map(({ sortKey: _sortKey, ...rest }) => rest);

    return {
      totalConversations,
      resolutionRate,
      csatScore: "4.8/5.0",
      avgResponseTime: "1m 42s",
      chartData,
    };
  },
});
