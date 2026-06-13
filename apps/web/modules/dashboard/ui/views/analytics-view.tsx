"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "@workspace/backend/_generated/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

export const AnalyticsView = () => {
  // ✅ FIXED: proper typed query call
  const metrics = useQuery(api.private.analytics.getMetrics);

  if (metrics === undefined) {
    return (
      <div className="flex-1 flex items-center justify-center p-xl bg-background">
        <p className="text-on-surface-variant text-label-md font-label-md">
          Loading analytics...
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-xl custom-scrollbar bg-black">
      <div className="max-w-6xl mx-auto space-y-md">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-xl">
          <div>
            <h1 className="text-headline-lg font-bold text-white mb-xs">
              Conversation Analytics
            </h1>
            <p className="text-body-sm text-on-surface-variant">
              Detailed performance metrics for the current billing cycle.
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

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md mb-xl">
          <div className="bg-[#111111] border border-outline-variant p-md flex flex-col justify-between h-[120px]">
            <h3 className="text-[10px] font-label-sm uppercase tracking-widest text-on-surface-variant">
              Total Conversations
            </h3>
            <div className="flex items-end justify-between">
              <span className="text-headline-lg font-bold text-white">
                {metrics.totalConversations.toLocaleString()}
              </span>
              <span className="text-label-sm font-bold text-[#4ade80] flex items-center">
                <span className="material-symbols-outlined text-[14px]">
                  trending_up
                </span>{" "}
                12%
              </span>
            </div>
          </div>

          <div className="bg-[#111111] border border-outline-variant p-md flex flex-col justify-between h-[120px]">
            <h3 className="text-[10px] font-label-sm uppercase tracking-widest text-on-surface-variant">
              Avg. Response Time
            </h3>
            <div className="flex items-end justify-between">
              <span className="text-headline-lg font-bold text-white">
                {metrics.avgResponseTime}
              </span>
              <span className="text-label-sm font-bold text-[#4ade80] flex items-center">
                <span className="material-symbols-outlined text-[14px]">
                  trending_down
                </span>{" "}
                -5%
              </span>
            </div>
          </div>

          <div className="bg-[#111111] border border-outline-variant p-md flex flex-col justify-between h-[120px]">
            <h3 className="text-[10px] font-label-sm uppercase tracking-widest text-on-surface-variant">
              CSAT Score
            </h3>
            <div className="flex items-end justify-between">
              <span className="text-headline-lg font-bold text-white">
                {metrics.csatScore}
              </span>
              <span className="text-[10px] font-label-sm uppercase tracking-widest text-on-surface-variant">
                stable
              </span>
            </div>
          </div>

          <div className="bg-[#111111] border border-outline-variant p-md flex flex-col justify-between h-[120px]">
            <h3 className="text-[10px] font-label-sm uppercase tracking-widest text-on-surface-variant">
              Resolution Rate
            </h3>
            <div className="flex items-end justify-between">
              <span className="text-headline-lg font-bold text-white">
                {metrics.resolutionRate}%
              </span>
              <span className="text-label-sm font-bold text-[#4ade80] flex items-center">
                <span className="material-symbols-outlined text-[14px]">
                  trending_up
                </span>{" "}
                2%
              </span>
            </div>
          </div>
        </div>

        {/* Chart Area */}
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

          <div className="h-[400px] w-full">
            {metrics.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip />
                  <Legend />
                  <Line dataKey="aiHandled" stroke="#fff" />
                  <Line dataKey="operatorHandled" stroke="#666" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                Not enough data to display charts.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};