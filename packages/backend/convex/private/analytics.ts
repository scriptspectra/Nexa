import { v } from "convex/values";
import { query } from "../_generated/server";
import { getOrgIdFromIdentity } from "../lib/orgAuth";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const EMPTY_METRICS = {
  totalConversations: 0,
  totalConversationsDelta: null as number | null,
  resolutionRate: 0,
  csatScore: null as number | null,
  csatCount: 0,
  avgFirstResponseMs: null as number | null,
  avgFirstResponseLabel: "N/A",
  chartData: [] as Array<{
    date: string;
    aiHandled: number;
    operatorHandled: number;
  }>,
  hourlyDistribution: [] as Array<{ hour: number; count: number }>,
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

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
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

    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000;

    // ─── Current period conversations ───────────────────────────────────────
    const allConversations = await ctx.db
      .query("conversations")
      .withIndex("by_organization_id", (q) => q.eq("organizationId", orgId))
      .collect();

    const conversations = allConversations.filter(
      (c) => c._creationTime >= thirtyDaysAgo,
    );

    const prevConversations = allConversations.filter(
      (c) => c._creationTime >= sixtyDaysAgo && c._creationTime < thirtyDaysAgo,
    );

    const totalConversations = conversations.length;
    const prevTotal = prevConversations.length;
    const totalConversationsDelta =
      prevTotal === 0
        ? null
        : Math.round(((totalConversations - prevTotal) / prevTotal) * 100);

    // ─── Resolution rate ─────────────────────────────────────────────────────
    const resolvedConversations = conversations.filter(
      (c) => c.status === "resolved",
    ).length;

    const resolutionRate =
      totalConversations === 0
        ? 0
        : Math.round((resolvedConversations / totalConversations) * 100);

    // ─── Avg first response time ─────────────────────────────────────────────
    const responseTimes = conversations
      .filter((c) => c.firstResponseAt != null)
      .map((c) => c.firstResponseAt! - c._creationTime);

    const avgFirstResponseMs =
      responseTimes.length === 0
        ? null
        : Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length);

    const avgFirstResponseLabel =
      avgFirstResponseMs == null ? "N/A" : formatDuration(avgFirstResponseMs);

    // ─── CSAT ratings ────────────────────────────────────────────────────────
    const csatRatings = await ctx.db
      .query("csatRatings")
      .withIndex("by_organization_id", (q) => q.eq("organizationId", orgId))
      .collect();

    const recentRatings = csatRatings.filter(
      (r) => r.submittedAt >= thirtyDaysAgo,
    );

    const csatScore =
      recentRatings.length === 0
        ? null
        : Math.round(
            (recentRatings.reduce((sum, r) => sum + r.score, 0) /
              recentRatings.length) *
              10,
          ) / 10;

    // ─── Daily chart data ────────────────────────────────────────────────────
    const daily: Record<
      string,
      { sortKey: string; date: string; aiHandled: number; operatorHandled: number }
    > = {};

    conversations.forEach((c) => {
      const dateKey = toDateKey(c._creationTime);
      const label = toDateLabel(c._creationTime);
      if (!daily[dateKey]) {
        daily[dateKey] = { sortKey: dateKey, date: label, aiHandled: 0, operatorHandled: 0 };
      }
      if (c.status === "escalated") {
        daily[dateKey].operatorHandled++;
      } else {
        daily[dateKey].aiHandled++;
      }
    });

    const chartData = Object.values(daily)
      .sort((a, b) => new Date(a.sortKey).getTime() - new Date(b.sortKey).getTime())
      .map(({ sortKey: _sortKey, ...rest }) => rest);

    // ─── Hourly distribution heatmap ─────────────────────────────────────────
    const hourlyCounts: Record<number, number> = {};
    for (let h = 0; h < 24; h++) hourlyCounts[h] = 0;
    conversations.forEach((c) => {
      const hour = new Date(c._creationTime).getUTCHours();
      hourlyCounts[hour] = (hourlyCounts[hour] ?? 0) + 1;
    });
    const hourlyDistribution = Object.entries(hourlyCounts).map(([hour, count]) => ({
      hour: Number(hour),
      count,
    }));

    return {
      totalConversations,
      totalConversationsDelta,
      resolutionRate,
      csatScore,
      csatCount: recentRatings.length,
      avgFirstResponseMs,
      avgFirstResponseLabel,
      chartData,
      hourlyDistribution,
    };
  },
});
