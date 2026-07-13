"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  AlertTriangle,
  BarChart3,
  Gauge,
  Radio,
  RefreshCw,
  Server,
  Users,
  Wifi,
} from "lucide-react";

import EmptyState from "@/components/EmptyState";
import HealthCard from "@/components/HealthCard";
import IncidentCard from "@/components/IncidentCard";
import IncidentTimeline from "@/components/IncidentTimeline";
import KPICard from "@/components/KPICard";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import MetricChart from "@/components/MetricChart";
import RegionalChart from "@/components/RegionalChart";
import StreamCard from "@/components/StreamCard";

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

type PaginatedResponse<T> = {
  results?: T[];
};

type ChartDataPoint = {
  id: number;
  time: string;
  viewers: number;
  latency: number;
  buffer: number;
  failure: number;
};

function normalizeListResponse<T>(
  data: T[] | PaginatedResponse<T>,
): T[] {
  if (Array.isArray(data)) {
    return data;
  }

  return data.results ?? [];
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
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
    async (showRefreshIndicator = false) => {
      try {
        if (showRefreshIndicator) {
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
            streamsData as
              | Stream[]
              | PaginatedResponse<Stream>,
          ),
        );

        setMetrics(
          normalizeListResponse(
            metricsData as
              | StreamMetric[]
              | PaginatedResponse<StreamMetric>,
          ),
        );

        setIncidents(
          normalizeListResponse(
            incidentsData as
              | Incident[]
              | PaginatedResponse<Incident>,
          ),
        );

        setLastUpdated(new Date());
      } catch (requestError) {
        console.error(
          "Dashboard loading failed:",
          requestError,
        );

        setError(
          "Could not connect to the Django backend. Make sure it is running on port 8000 and CORS is configured.",
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

  async function handleScenario(
    scenario: Scenario,
  ): Promise<void> {
    try {
      setRunningScenario(scenario);
      setError("");

      await runScenario(scenario, 5);
      await loadDashboard(true);
    } catch (requestError) {
      console.error(
        "Scenario simulation failed:",
        requestError,
      );

      setError(
        "Simulation failed. Check the Django backend terminal and simulator endpoint.",
      );
    } finally {
      setRunningScenario(null);
    }
  }

  const sortedMetrics = useMemo(() => {
    return [...metrics].sort(
      (firstMetric, secondMetric) =>
        new Date(firstMetric.timestamp).getTime() -
        new Date(secondMetric.timestamp).getTime(),
    );
  }, [metrics]);

  const chartData = useMemo<ChartDataPoint[]>(() => {
    return sortedMetrics.slice(-30).map((metric) => ({
      id: metric.id,

      time: new Date(
        metric.timestamp,
      ).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),

      viewers: metric.concurrent_viewers,
      latency: metric.cdn_latency_ms,
      buffer: metric.buffer_ratio,
      failure: metric.failure_rate,
    }));
  }, [sortedMetrics]);

  const latestMetricsByStream = useMemo(() => {
    const latestMetricMap =
      new Map<number, StreamMetric>();

    for (const metric of sortedMetrics) {
      latestMetricMap.set(metric.stream, metric);
    }

    return latestMetricMap;
  }, [sortedMetrics]);

  const sortedIncidents = useMemo(() => {
    return [...incidents].sort(
      (firstIncident, secondIncident) =>
        new Date(secondIncident.created_at).getTime() -
        new Date(firstIncident.created_at).getTime(),
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
                onClick={() =>
                  void loadDashboard(true)
                }
                disabled={refreshing}
                aria-label="Refresh dashboard"
                title="Refresh dashboard"
                className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
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
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />

              <div>
                <p className="font-semibold">
                  Backend connection error
                </p>

                <p className="mt-1">{error}</p>
              </div>
            </div>
          </div>
        ) : null}

        {loading &&
        streams.length === 0 &&
        metrics.length === 0 ? (
          <LoadingSkeleton />
        ) : (
          <>
            <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {kpis.map((kpi) => (
                <KPICard
                  key={kpi.label}
                  label={kpi.label}
                  value={kpi.value}
                  helper={kpi.helper}
                  icon={kpi.icon}
                  iconClass={kpi.iconClass}
                  loading={loading}
                />
              ))}
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
                  Generate scenarios and observe their
                  impact on viewers, QoE metrics and
                  incidents.
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
                        void handleScenario(
                          scenario.value,
                        )
                      }
                      disabled={
                        runningScenario !== null
                      }
                      className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-left transition hover:border-cyan-300 hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span className="block text-sm font-semibold text-cyan-800">
                        {isRunning
                          ? "Running..."
                          : scenario.label}
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

            <section className="mb-6 grid gap-6 xl:grid-cols-2">
              <RegionalChart metrics={metrics} />

              <IncidentTimeline
                incidents={sortedIncidents}
              />
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Active streams
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Latest stream health and QoE metrics
                    </p>
                  </div>

                  <Server className="h-5 w-5 text-slate-400" />
                </div>

                <div className="space-y-3">
                  {streams.length === 0 ? (
                    <EmptyState text="No streams found. Run a scenario to generate stream data." />
                  ) : (
                    streams.map((stream) => (
                      <StreamCard
                        key={stream.id}
                        stream={stream}
                        metric={
                          latestMetricsByStream.get(
                            stream.id,
                          ) ?? null
                        }
                      />
                    ))
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Recent incidents
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Automatically generated from anomalous
                    metrics
                  </p>
                </div>

                <div className="max-h-[700px] space-y-3 overflow-y-auto pr-1">
                  {sortedIncidents.length === 0 ? (
                    <EmptyState text="No incidents detected yet." />
                  ) : (
                    sortedIncidents
                      .slice(0, 10)
                      .map((incident) => (
                        <IncidentCard
                          key={incident.id}
                          incident={incident}
                        />
                      ))
                  )}
                </div>
              </section>
            </section>
          </>
        )}
      </div>
    </main>
  );
}