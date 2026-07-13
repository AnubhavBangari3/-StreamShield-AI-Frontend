"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Search,
} from "lucide-react";

import type { Incident } from "@/types/dashboard";

type IncidentTimelineProps = {
  incidents?: Incident[];
};

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

function getStatusIcon(status: Incident["status"]) {
  if (status === "resolved") {
    return (
      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
    );
  }

  if (status === "investigating") {
    return (
      <Search className="h-4 w-4 text-amber-600" />
    );
  }

  return (
    <AlertTriangle className="h-4 w-4 text-red-600" />
  );
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function IncidentTimeline({
  incidents = [],
}: IncidentTimelineProps) {
  const recentIncidents = incidents.slice(0, 8);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Incident timeline
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Recent incident activity and status changes
          </p>
        </div>

        <Clock3 className="h-5 w-5 text-slate-400" />
      </div>

      {recentIncidents.length === 0 ? (
        <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
          No incident timeline available.
        </div>
      ) : (
        <div className="max-h-72 space-y-4 overflow-y-auto pr-2">
          {recentIncidents.map((incident, index) => (
            <div
              key={incident.id}
              className="relative flex gap-4"
            >
              <div className="flex flex-col items-center">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
                  {getStatusIcon(incident.status)}
                </div>

                {index < recentIncidents.length - 1 ? (
                  <div className="mt-2 h-full w-px bg-slate-200" />
                ) : null}
              </div>

              <div className="min-w-0 flex-1 pb-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-medium text-slate-900">
                      {incident.title}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      {incident.stream_name} · {incident.region}
                    </p>
                  </div>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${getSeverityClass(
                      incident.severity,
                    )}`}
                  >
                    {incident.severity}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span className="capitalize">
                    {incident.status}
                  </span>

                  <span>•</span>

                  <span>
                    {formatDate(incident.created_at)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}