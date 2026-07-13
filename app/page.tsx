"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  Gauge,
  Radio,
  RefreshCw,
  Server,
  Users,
  Wifi,
} from "lucide-react";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  getDashboardSummary,
  getIncidents,
  getMetrics,
  getStreams,
  runScenario,
} from "@/services/api";

import type {
  DashboardSummary,
  Incident,
  Scenario,
  Stream,
  StreamMetric,
} from "@/types/dashboard";

const EMPTY_SUMMARY: DashboardSummary = {
  total_streams: 0,
  healthy_streams: 0,
  degraded_streams: 0,
  critical_streams: 0,
  active_incidents: 0,
  critical_incidents: 0,
  total_viewers: 0,
  average_latency: 0,
  average_buffer_ratio: 0,
  average_failure_rate: 0,
};

const SCENARIOS: Array<{
  label: string;
  value: Scenario;
  description: string;
}> = [
  {
    label: "Normal",
    value: "normal",
    description: "Generate healthy streaming metrics",
  },
  {
    label: "Traffic Spike",
    value: "traffic_spike",
    description: "Increase concurrent viewer load",
  },
  {
    label: "Buffering Spike",
    value: "buffering_spike",
    description: "Simulate playback buffering",
  },
  {
    label: "CDN Failure",
    value: "cdn_failure",
    description: "Simulate CDN latency and failures",
  },
  {
    label: "Regional Outage",
    value: "regional_outage",
    description: "Simulate a regional disruption",
  },
];

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getStatusClass(status: Stream["status"]): string {
  if (status === "healthy") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "degraded") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-red-200 bg-red-50 text-red-700";
}

function getSeverityClass(
  severity: Incident["severity"],
): string {
  if (severity === "critical") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (severity === "high") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  if (severity === "medium") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-blue-200 bg-blue-50 text-blue-700";
}

function normalizeListResponse<T>(
  data: T[] | { results?: T[] },
): T[] {
  if (Array.isArray(data)) {
    return data;
  }

  return data.results ?? [];
}

export default function Home() {
  const [summary, setSummary] =
    useState<DashboardSummary>(EMPTY_SUMMARY);

  const [streams, setStreams] = useState<Stream[]>([]);
  const [metrics, setMetrics] = useState<StreamMetric[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [runningScenario, setRunningScenario] =
    useState<Scenario | null>(null);

  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null);

  const loadDashboard = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        }

        setError("");

        const [
          dashboardData,
          streamsData,
          metricsData,
          incidentsData,
        ] = await Promise.all([
          getDashboardSummary(),
          getStreams(),
          getMetrics(),
          getIncidents(),
        ]);

        setSummary(dashboardData);

        setStreams(
          normalizeListResponse(
            streamsData as Stream[] | { results?: Stream[] },
          ),
        );

        setMetrics(
          normalizeListResponse(
            metricsData as
              | StreamMetric[]
              | { results?: StreamMetric[] },
          ),
        );

        setIncidents(
          normalizeListResponse(
            incidentsData as
              | Incident[]
              | { results?: Incident[] },
          ),
        );

        setLastUpdated(new Date());
      } catch (requestError) {
        console.error(requestError);

        setError(
          "Could not connect to the Django backend. Make sure it is running on port 8000.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadDashboard();

    const intervalId = window.setInterval(() => {
      void loadDashboard();
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [loadDashboard]);

  async function handleScenario(scenario: Scenario) {
    try {
      setRunningScenario(scenario);
      setError("");

      await runScenario(scenario, 5);
      await loadDashboard(true);
    } catch (requestError) {
      console.error(requestError);
      setError("Simulation failed. Check the backend terminal.");
    } finally {
      setRunningScenario(null);
    }
  }

  const sortedMetrics = useMemo(() => {
    return [...metrics].sort(
      (first, second) =>
        new Date(first.timestamp).getTime() -
        new Date(second.timestamp).getTime(),
    );
  }, [metrics]);

  const chartData = useMemo(() => {
    return sortedMetrics.slice(-30).map((metric) => ({
      id: metric.id,
      time: new Date(metric.timestamp).toLocaleTimeString(
        [],
        {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        },
      ),
      viewers: metric.concurrent_viewers,
      latency: metric.cdn_latency_ms,
      buffer: metric.buffer_ratio,
      failure: metric.failure_rate,
    }));
  }, [sortedMetrics]);

  const latestMetricsByStream = useMemo(() => {
    const map = new Map<number, StreamMetric>();

    for (const metric of sortedMetrics) {
      map.set(metric.stream, metric);
    }

    return map;
  }, [sortedMetrics]);

  const sortedIncidents = useMemo(() => {
    return [...incidents].sort(
      (first, second) =>
        new Date(second.created_at).getTime() -
        new Date(first.created_at).getTime(),
    );
  }, [incidents]);

  const kpis = [
    {
      label: "Total viewers",
      value: formatNumber(summary.total_viewers),
      helper: "Current concurrent audience",
      icon: Users,
      iconClass: "bg-sky-50 text-sky-600",
    },
    {
      label: "Average latency",
      value: `${summary.average_latency.toFixed(0)} ms`,
      helper: "Average CDN response time",
      icon: Gauge,
      iconClass: "bg-violet-50 text-violet-600",
    },
    {
      label: "Buffer ratio",
      value: `${summary.average_buffer_ratio.toFixed(1)}%`,
      helper: "Average playback buffering",
      icon: Wifi,
      iconClass: "bg-cyan-50 text-cyan-600",
    },
    {
      label: "Failure rate",
      value: `${summary.average_failure_rate.toFixed(1)}%`,
      helper: "Average playback failures",
      icon: BarChart3,
      iconClass: "bg-orange-50 text-orange-600",
    },
    {
      label: "Active incidents",
      value: summary.active_incidents,
      helper: `${summary.critical_incidents} critical incidents`,
      icon: AlertTriangle,
      iconClass: "bg-red-50 text-red-600",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
        <header className="mb-6 rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm sm:px-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-cyan-600 p-3 text-white shadow-sm">
                <Radio className="h-7 w-7" />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  StreamShield AI
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Intelligent live-streaming monitoring and
                  incident intelligence
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                Live monitoring
              </div>

              {lastUpdated ? (
                <span className="text-xs text-slate-500">
                  Updated{" "}
                  {lastUpdated.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
              ) : null}

              <button
                type="button"
                onClick={() => void loadDashboard(true)}
                disabled={refreshing}
                className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                aria-label="Refresh dashboard"
              >
                <RefreshCw
                  className={`h-5 w-5 ${
                    refreshing ? "animate-spin" : ""
                  }`}
                />
              </button>
            </div>
          </div>
        </header>

        {error ? (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <p>{error}</p>
            </div>
          </div>
        ) : null}

        <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;

            return (
              <article
                key={kpi.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-5 flex items-center justify-between">
                  <div
                    className={`rounded-xl p-2.5 ${kpi.iconClass}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <Activity className="h-4 w-4 text-slate-300" />
                </div>

                <p className="text-sm font-medium text-slate-500">
                  {kpi.label}
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {loading ? "—" : kpi.value}
                </p>

                <p className="mt-2 text-xs text-slate-400">
                  {kpi.helper}
                </p>
              </article>
            );
          })}
        </section>

        <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <HealthCard
            label="Total streams"
            value={summary.total_streams}
            valueClass="text-slate-900"
          />

          <HealthCard
            label="Healthy"
            value={summary.healthy_streams}
            valueClass="text-emerald-600"
          />

          <HealthCard
            label="Degraded"
            value={summary.degraded_streams}
            valueClass="text-amber-600"
          />

          <HealthCard
            label="Critical"
            value={summary.critical_streams}
            valueClass="text-red-600"
          />
        </section>

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Simulation controls
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Generate scenarios and observe their impact on
              viewers, QoE metrics and incidents.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {SCENARIOS.map((scenario) => {
              const isRunning =
                runningScenario === scenario.value;

              return (
                <button
                  key={scenario.value}
                  type="button"
                  onClick={() =>
                    void handleScenario(scenario.value)
                  }
                  disabled={runningScenario !== null}
                  className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-left transition hover:border-cyan-300 hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="block text-sm font-semibold text-cyan-800">
                    {isRunning ? "Running..." : scenario.label}
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-slate-500">
                    {scenario.description}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mb-6 grid gap-6 xl:grid-cols-2">
          <MetricChart
            title="Concurrent viewers"
            description="Viewer load across recent metric samples"
            data={chartData}
            dataKey="viewers"
            unit=""
          />

          <MetricChart
            title="CDN latency"
            description="Recent CDN response time"
            data={chartData}
            dataKey="latency"
            unit=" ms"
          />

          <MetricChart
            title="Buffer ratio"
            description="Percentage of playback time spent buffering"
            data={chartData}
            dataKey="buffer"
            unit="%"
          />

          <MetricChart
            title="Failure rate"
            description="Recent playback and startup failures"
            data={chartData}
            dataKey="failure"
            unit="%"
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  Active streams
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Latest stream health and QoE metrics
                </p>
              </div>

              <Server className="h-5 w-5 text-slate-400" />
            </div>

            <div className="space-y-3">
              {loading && streams.length === 0 ? (
                <EmptyState text="Loading active streams..." />
              ) : streams.length === 0 ? (
                <EmptyState text="No streams found. Run a scenario to generate stream data." />
              ) : (
                streams.map((stream) => {
                  const metric =
                    latestMetricsByStream.get(stream.id);

                  return (
                    <article
                      key={stream.id}
                      className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"
                    >
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
                })
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold">
                Recent incidents
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Automatically generated from anomalous metrics
              </p>
            </div>

            <div className="max-h-[700px] space-y-3 overflow-y-auto pr-1">
              {loading && incidents.length === 0 ? (
                <EmptyState text="Loading recent incidents..." />
              ) : sortedIncidents.length === 0 ? (
                <EmptyState text="No incidents detected yet." />
              ) : (
                sortedIncidents.slice(0, 10).map((incident) => (
                  <article
                    key={incident.id}
                    className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {incident.title}
                        </h3>

                        <p className="mt-1 text-xs text-slate-400">
                          {incident.stream_name} · {incident.region}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${getSeverityClass(
                          incident.severity,
                        )}`}
                      >
                        {incident.severity}
                      </span>
                    </div>

                    <div className="mb-3 grid grid-cols-2 gap-3">
                      <MetricValue
                        label="Affected users"
                        value={formatNumber(
                          incident.affected_users,
                        )}
                      />

                      <MetricValue
                        label="Confidence"
                        value={`${(
                          incident.confidence_score * 100
                        ).toFixed(0)}%`}
                      />

                      <MetricValue
                        label="Status"
                        value={incident.status}
                      />

                      <MetricValue
                        label="Created"
                        value={formatDateTime(
                          incident.created_at,
                        )}
                      />
                    </div>

                    <div className="border-t border-slate-200 pt-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Probable root cause
                      </p>

                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {incident.probable_root_cause ||
                          "Root-cause analysis pending."}
                      </p>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

type MetricChartData = {
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
  data: MetricChartData[];
  dataKey: keyof Pick<
    MetricChartData,
    "viewers" | "latency" | "buffer" | "failure"
  >;
  unit: string;
};

function MetricChart({
  title,
  description,
  data,
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
            Run a scenario to generate chart data.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
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
                width={62}
              />

              <Tooltip
                contentStyle={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  color: "#0f172a",
                  boxShadow:
                    "0 10px 30px rgba(15, 23, 42, 0.08)",
                }}
                labelStyle={{
                  color: "#475569",
                }}
                itemStyle={{
                  color: "#0891b2",
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

function HealthCard({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: number;
  valueClass: string;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className={`mt-1 text-2xl font-bold ${valueClass}`}>
        {value}
      </p>
    </article>
  );
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
      <p className="text-xs text-slate-400">{label}</p>

      <p className="mt-1 font-medium capitalize text-slate-700">
        {value}
      </p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-400">
      {text}
    </div>
  );
}