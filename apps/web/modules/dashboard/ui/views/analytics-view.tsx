"use client";

import dynamic from "next/dynamic";
import { useOrganization } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@workspace/backend/_generated/api";

const AnalyticsChart = dynamic(
  () =>
    import("../components/analytics-chart").then((module) => module.AnalyticsChart),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center text-gray-400">
        Loading chart...
      </div>
    ),
  },
);

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta == null) return null;
  const positive = delta >= 0;
  return (
    <span
      className={`text-label-sm font-bold flex items-center gap-0.5 ${
        positive ? "text-[#4ade80]" : "text-[#f87171]"
      }`}
    >
      <span className="material-symbols-outlined text-[14px]">
        {positive ? "trending_up" : "trending_down"}
      </span>
      {positive ? "+" : ""}{delta}%
    </span>
  );
}

function HourlyHeatmap({ distribution }: { distribution: { hour: number; count: number }[] }) {
  const max = Math.max(...distribution.map((d) => d.count), 1);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-1">
        {distribution.map(({ hour, count }) => {
          const intensity = count / max;
          const bg = intensity === 0
            ? "bg-surface-container-low"
            : intensity < 0.33
            ? "bg-blue-900/50"
            : intensity < 0.66
            ? "bg-blue-700/60"
            : "bg-blue-500/80";
          return (
            <div
              key={hour}
              className={`flex-1 h-8 rounded-sm ${bg} cursor-default group relative`}
              title={`${String(hour).padStart(2, "0")}:00 — ${count} conversation${count !== 1 ? "s" : ""}`}
            />
          );
        })}
      </div>
      <div className="flex gap-1">
        {[0, 6, 12, 18, 23].map((h) => (
          <div
            key={h}
            className="text-[9px] text-on-surface-variant uppercase tracking-wider"
            style={{ flex: "0 0 auto", width: `${(1 / 24) * 100}%` }}
          >
            {String(h).padStart(2, "0")}h
          </div>
        ))}
      </div>
    </div>
  );
}

export const AnalyticsView = () => {
  const { organization, isLoaded } = useOrganization();
  const metrics = useQuery(
    api.private.analytics.getMetrics,
    organization?.id ? { organizationId: organization.id } : "skip",
  );

  if (!isLoaded || (organization?.id && metrics === undefined)) {
    return (
      <div className="flex-1 flex items-center justify-center p-xl bg-background">
        <p className="text-on-surface-variant text-label-md font-label-md">
          Loading analytics...
        </p>
      </div>
    );
  }

  if (!organization?.id || !metrics) {
    return (
      <div className="flex-1 flex items-center justify-center p-xl bg-background">
        <p className="text-on-surface-variant text-label-md font-label-md">
          Select an organization to view analytics.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-xl custom-scrollbar bg-black">
      <div className="max-w-6xl mx-auto space-y-md">
        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-xl">
          <div>
            <h1 className="text-headline-lg font-bold text-white mb-xs">
              Conversation Analytics
            </h1>
            <p className="text-body-sm text-on-surface-variant">
              Detailed performance metrics for the last 30 days.
            </p>
          </div>
          <div className="flex items-center gap-md">
            <div className="flex items-center gap-2 border border-outline-variant bg-surface-container-low px-sm py-xs cursor-pointer hover:border-primary transition-colors">
              <span className="material-symbols-outlined text-[16px] text-white">
                calendar_today
              </span>
              <span className="text-label-sm font-label-sm text-white uppercase tracking-wider">
                Last 30 Days
              </span>
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                expand_more
              </span>
            </div>
            <button className="bg-white text-black px-md py-xs text-label-sm font-label-sm font-bold uppercase tracking-widest hover:bg-neutral-200 transition-colors">
              Export PDF
            </button>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md mb-xl">
          {/* Total Conversations */}
          <div className="bg-[#111111] border border-outline-variant p-md flex flex-col justify-between h-[120px]">
            <h3 className="text-[10px] font-label-sm uppercase tracking-widest text-on-surface-variant">
              Total Conversations
            </h3>
            <div className="flex items-end justify-between">
              <span className="text-headline-lg font-bold text-white">
                {metrics.totalConversations.toLocaleString()}
              </span>
              <DeltaBadge delta={metrics.totalConversationsDelta} />
            </div>
          </div>

          {/* Avg Response Time */}
          <div className="bg-[#111111] border border-outline-variant p-md flex flex-col justify-between h-[120px]">
            <h3 className="text-[10px] font-label-sm uppercase tracking-widest text-on-surface-variant">
              Avg. First Response
            </h3>
            <div className="flex items-end justify-between">
              <span className="text-headline-lg font-bold text-white">
                {metrics.avgFirstResponseLabel}
              </span>
              {metrics.avgFirstResponseMs == null && (
                <span className="text-[9px] font-label-sm uppercase tracking-wider text-on-surface-variant border border-outline-variant px-1 py-0.5">
                  no data yet
                </span>
              )}
            </div>
          </div>

          {/* CSAT Score */}
          <div className="bg-[#111111] border border-outline-variant p-md flex flex-col justify-between h-[120px]">
            <h3 className="text-[10px] font-label-sm uppercase tracking-widest text-on-surface-variant">
              CSAT Score
            </h3>
            <div className="flex items-end justify-between">
              <span className="text-headline-lg font-bold text-white">
                {metrics.csatScore != null
                  ? `${metrics.csatScore} / 5`
                  : "—"}
              </span>
              {metrics.csatScore == null ? (
                <span className="text-[9px] font-label-sm uppercase tracking-wider text-on-surface-variant border border-outline-variant px-1 py-0.5">
                  no ratings yet
                </span>
              ) : (
                <span className="text-[9px] font-label-sm text-on-surface-variant">
                  {metrics.csatCount} rating{metrics.csatCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>

          {/* Resolution Rate */}
          <div className="bg-[#111111] border border-outline-variant p-md flex flex-col justify-between h-[120px]">
            <h3 className="text-[10px] font-label-sm uppercase tracking-widest text-on-surface-variant">
              Resolution Rate
            </h3>
            <div className="flex items-end justify-between">
              <span className="text-headline-lg font-bold text-white">
                {metrics.resolutionRate}%
              </span>
              <span className="text-[9px] font-label-sm uppercase tracking-wider text-on-surface-variant">
                30-day avg
              </span>
            </div>
          </div>
        </div>

        {/* ── Conversation Volume Chart ── */}
        <div className="bg-[#111111] border border-outline-variant p-md">
          <div className="flex items-center justify-between mb-xl">
            <div>
              <h3 className="text-body-md font-bold text-white mb-1">
                Conversation Volume
              </h3>
              <p className="text-label-sm text-on-surface-variant">
                Daily distribution of AI vs. Human handling
              </p>
            </div>
          </div>
          <div className="h-[400px] w-full min-h-[400px]">
            <AnalyticsChart chartData={metrics.chartData} />
          </div>
        </div>

        {/* ── Peak Hours Heatmap ── */}
        <div className="bg-[#111111] border border-outline-variant p-md">
          <div className="mb-md">
            <h3 className="text-body-md font-bold text-white mb-1">
              Peak Hours
            </h3>
            <p className="text-label-sm text-on-surface-variant">
              Which hours of the day receive the most conversations (UTC)
            </p>
          </div>
          {metrics.hourlyDistribution.length > 0 ? (
            <HourlyHeatmap distribution={metrics.hourlyDistribution} />
          ) : (
            <p className="text-on-surface-variant text-label-sm">No data yet.</p>
          )}
        </div>

        {/* ── Agent Leaderboard ── */}
        <div className="bg-[#111111] border border-outline-variant p-md">
          <div className="mb-md">
            <h3 className="text-body-md font-bold text-white mb-1">
              Agent Leaderboard
            </h3>
            <p className="text-label-sm text-on-surface-variant">
              Top agents by conversations handled in the last 30 days
            </p>
          </div>
          {metrics.agentStats.length === 0 ? (
            <p className="text-on-surface-variant text-label-sm">No assigned conversations yet.</p>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-label-sm min-w-[500px]">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-on-surface-variant border-b border-outline-variant">
                    <th className="text-left py-2 font-bold">#</th>
                    <th className="text-left py-2 font-bold">Agent</th>
                    <th className="text-right py-2 font-bold text-green-400">Resolved</th>
                    <th className="text-right py-2 font-bold text-yellow-400">Escalated</th>
                    <th className="text-right py-2 font-bold text-white">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {metrics.agentStats.map((agent, i) => (
                    <tr key={agent.name} className="hover:bg-surface-container-low transition-colors">
                      <td className="py-2 text-on-surface-variant">{i + 1}</td>
                      <td className="py-2 text-white font-bold">{agent.name}</td>
                      <td className="py-2 text-right text-green-400">{agent.resolved}</td>
                      <td className="py-2 text-right text-yellow-400">{agent.escalated}</td>
                      <td className="py-2 text-right text-white font-bold">{agent.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

