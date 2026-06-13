"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ChartPoint = {
  date: string;
  aiHandled: number;
  operatorHandled: number;
};

type AnalyticsChartProps = {
  chartData: ChartPoint[];
};

export const AnalyticsChart = ({ chartData }: AnalyticsChartProps) => {
  if (chartData.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-400">
        Not enough data to display charts.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis dataKey="date" stroke="#888" />
        <YAxis stroke="#888" />
        <Tooltip />
        <Legend />
        <Line dataKey="aiHandled" stroke="#fff" />
        <Line dataKey="operatorHandled" stroke="#666" />
      </LineChart>
    </ResponsiveContainer>
  );
};
