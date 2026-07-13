"use client";

import type {
  Stream,
  StreamMetric,
} from "@/types/dashboard";

type StreamCardProps = {
  stream: Stream;
  metric?: StreamMetric | null;
};

function getStatusClass(
  status: Stream["status"],
): string {
  if (status === "healthy") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "degraded") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-red-200 bg-red-50 text-red-700";
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function MetricValue({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <p className="text-xs text-slate-400">
        {label}
      </p>

      <p className="mt-1 font-medium text-slate-700">
        {value}
      </p>
    </div>
  );
}

export default function StreamCard({
  stream,
  metric = null,
}: StreamCardProps) {
  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-slate-900">
                {stream.name}
              </h3>

              <span
                className={`rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${getStatusClass(
                  stream.status,
                )}`}
              >
                {stream.status}
              </span>
            </div>

            <p className="text-sm text-slate-600">
              {stream.event_name}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              {stream.region}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-7 gap-y-3 sm:grid-cols-4">
            <MetricValue
              label="Viewers"
              value={
                metric
                  ? formatNumber(
                      metric.concurrent_viewers,
                    )
                  : "—"
              }
            />

            <MetricValue
              label="Latency"
              value={
                metric
                  ? `${metric.cdn_latency_ms.toFixed(
                      0,
                    )} ms`
                  : "—"
              }
            />

            <MetricValue
              label="Buffer"
              value={
                metric
                  ? `${metric.buffer_ratio.toFixed(
                      1,
                    )}%`
                  : "—"
              }
            />

            <MetricValue
              label="Failures"
              value={
                metric
                  ? `${metric.failure_rate.toFixed(
                      1,
                    )}%`
                  : "—"
              }
            />
          </div>
        </div>

        {metric ? (
          <div className="grid gap-3 border-t border-slate-200 pt-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricValue
              label="Bitrate"
              value={`${metric.bitrate_kbps.toFixed(
                0,
              )} kbps`}
            />

            <MetricValue
              label="Startup time"
              value={`${metric.startup_time_ms.toFixed(
                0,
              )} ms`}
            />

            <MetricValue
              label="Packet loss"
              value={`${metric.packet_loss.toFixed(
                2,
              )}%`}
            />

            <MetricValue
              label="FPS"
              value={metric.fps.toFixed(0)}
            />
          </div>
        ) : null}
      </div>
    </article>
  );
}