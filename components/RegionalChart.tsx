"use client";

import { useMemo } from "react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { StreamMetric } from "@/types/dashboard";

type RegionalData = {
  region: string;
  viewers: number;
};

type RegionalChartProps = {
  data?: RegionalData[];
  metrics?: StreamMetric[];
};

export default function RegionalChart({
  data,
  metrics = [],
}: RegionalChartProps) {
  const regionalData = useMemo<RegionalData[]>(() => {
    if (data) {
      return data;
    }

    const latestByStream = new Map<number, StreamMetric>();

    for (const metric of metrics) {
      const existing = latestByStream.get(metric.stream);

      if (
        !existing ||
        new Date(metric.timestamp).getTime() >
          new Date(existing.timestamp).getTime()
      ) {
        latestByStream.set(metric.stream, metric);
      }
    }

    const regionMap = new Map<string, number>();

    for (const metric of latestByStream.values()) {
      const region = metric.region || "Unknown";

      regionMap.set(
        region,
        (regionMap.get(region) ?? 0) +
          (metric.concurrent_viewers ?? 0),
      );
    }

    return Array.from(regionMap.entries())
      .map(([region, viewers]) => ({
        region,
        viewers,
      }))
      .sort((first, second) => second.viewers - first.viewers);
  }, [data, metrics]);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">
          Viewers by region
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Current audience distribution
        </p>
      </div>

      <div className="h-72">
        {regionalData.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
            No regional data available.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={regionalData}
              margin={{
                top: 5,
                right: 10,
                left: 5,
                bottom: 25,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e2e8f0"
              />

              <XAxis
                dataKey="region"
                angle={-20}
                textAnchor="end"
                height={60}
                interval={0}
                tick={{
                  fill: "#64748b",
                  fontSize: 11,
                }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                tick={{
                  fill: "#64748b",
                  fontSize: 11,
                }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) =>
                  new Intl.NumberFormat("en", {
                    notation: "compact",
                    maximumFractionDigits: 1,
                  }).format(Number(value))
                }
              />

              <Tooltip
                formatter={(value) => [
                  Number(value).toLocaleString(),
                  "Viewers",
                ]}
                contentStyle={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                }}
              />

              <Bar
                dataKey="viewers"
                fill="#0891b2"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </article>
  );
}