"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import type { StreamMetric } from "@/types/dashboard";

type RegionalData = {
  region: string;
  viewers: number;
};

type Props = {
  data?: RegionalData[];
  metrics?: StreamMetric[];
};

export default function RegionalChart({
  data,
  metrics,
}: Props) {
  // If data isn't passed, build it from metrics
  const regionalData: RegionalData[] =
    data ??
    (() => {
      const regionMap = new Map<string, number>();

      (metrics ?? []).forEach((metric) => {
        regionMap.set(
          metric.region,
          (regionMap.get(metric.region) ?? 0) +
            metric.concurrent_viewers,
        );
      });

      return Array.from(regionMap.entries()).map(
        ([region, viewers]) => ({
          region,
          viewers,
        }),
      );
    })();

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">
          Viewers by Region
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
            <BarChart data={regionalData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e2e8f0"
              />

              <XAxis
                dataKey="region"
                tick={{ fontSize: 12 }}
              />

              <YAxis
                tick={{ fontSize: 12 }}
              />

              <Tooltip />

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