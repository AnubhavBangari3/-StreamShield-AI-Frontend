"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type MetricChartData = {
  id: number;
  time: string;
  viewers: number;
  latency: number;
  buffer: number;
  failure: number;
};

type MetricChartProps = {
  title: string;
  description: string;
  data?: MetricChartData[];
  dataKey: "viewers" | "latency" | "buffer" | "failure";
  unit: string;
};

export default function MetricChart({
  title,
  description,
  data = [],
  dataKey,
  unit,
}: MetricChartProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="font-semibold text-slate-900">
          {title}
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {description}
        </p>
      </div>

      <div className="h-64">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
            No metric data available.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 5,
                right: 10,
                left: 0,
                bottom: 0,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e2e8f0"
              />

              <XAxis
                dataKey="time"
                tick={{
                  fill: "#64748b",
                  fontSize: 11,
                }}
                axisLine={false}
                tickLine={false}
                minTickGap={28}
              />

              <YAxis
                tick={{
                  fill: "#64748b",
                  fontSize: 11,
                }}
                axisLine={false}
                tickLine={false}
                width={65}
              />

              <Tooltip
                contentStyle={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  color: "#0f172a",
                  boxShadow:
                    "0 10px 30px rgba(15,23,42,0.08)",
                }}
                labelStyle={{
                  color: "#475569",
                }}
                formatter={(value) => [
                  `${Number(value).toLocaleString()}${unit}`,
                  title,
                ]}
              />

              <Line
                type="monotone"
                dataKey={dataKey}
                stroke="#0891b2"
                strokeWidth={2.5}
                dot={false}
                activeDot={{
                  r: 5,
                  fill: "#0891b2",
                  stroke: "#ffffff",
                  strokeWidth: 2,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </article>
  );
}