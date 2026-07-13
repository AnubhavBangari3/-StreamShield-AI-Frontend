"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Search,
  Users,
} from "lucide-react";

import type { Incident } from "@/types/dashboard";

type IncidentCardProps = {
  incident: Incident;
};

function getSeverityClass(
  severity: Incident["severity"],
): string {
  switch (severity) {
    case "critical":
      return "border-red-200 bg-red-50 text-red-700";

    case "high":
      return "border-orange-200 bg-orange-50 text-orange-700";

    case "medium":
      return "border-amber-200 bg-amber-50 text-amber-700";

    default:
      return "border-blue-200 bg-blue-50 text-blue-700";
  }
}

function getStatusClass(status: Incident["status"]): string {
  switch (status) {
    case "resolved":
      return "text-emerald-700";

    case "investigating":
      return "text-amber-700";

    default:
      return "text-red-700";
  }
}

function getStatusIcon(status: Incident["status"]) {
  if (status === "resolved") {
    return (
      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
    );
  }

  if (status === "investigating") {
    return <Search className="h-4 w-4 text-amber-600" />;
  }

  return <AlertTriangle className="h-4 w-4 text-red-600" />;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value ?? 0);
}

function formatDate(value?: string): string {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatConfidence(value?: number): string {
  if (value === undefined || value === null) {
    return "—";
  }

  const percentage = value <= 1 ? value * 100 : value;

  return `${percentage.toFixed(0)}%`;
}

export default function IncidentCard({
  incident,
}: IncidentCardProps) {
  const actions =
    incident.recommended_actions?.length > 0
      ? incident.recommended_actions
      : incident.recommendations?.map(
          (recommendation) => recommendation.action,
        ) ?? [];

  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 transition hover:border-slate-300 hover:shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-900">
            {incident.title || "Untitled incident"}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            {incident.stream_name || "Unknown stream"}
            {" · "}
            {incident.region || "Unknown region"}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getSeverityClass(
            incident.severity,
          )}`}
        >
          {incident.severity}
        </span>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div>
          <p className="text-xs text-slate-400">
            Status
          </p>

          <div
            className={`mt-1 flex items-center gap-1.5 text-sm font-medium capitalize ${getStatusClass(
              incident.status,
            )}`}
          >
            {getStatusIcon(incident.status)}
            {incident.status}
          </div>
        </div>

        <div>
          <p className="text-xs text-slate-400">
            Affected users
          </p>

          <div className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-700">
            <Users className="h-4 w-4 text-slate-400" />
            {formatNumber(incident.affected_users)}
          </div>
        </div>

        <div>
          <p className="text-xs text-slate-400">
            Confidence
          </p>

          <p className="mt-1 text-sm font-medium text-slate-700">
            {formatConfidence(incident.confidence_score)}
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-400">
            Created
          </p>

          <div className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-700">
            <Clock3 className="h-4 w-4 text-slate-400" />
            {formatDate(incident.created_at)}
          </div>
        </div>
      </div>

      <div className="space-y-4 border-t border-slate-200 pt-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Probable root cause
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            {incident.probable_root_cause ||
              "Root-cause analysis is pending."}
          </p>
        </div>

        {incident.ai_summary ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              AI summary
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {incident.ai_summary}
            </p>
          </div>
        ) : null}

        {actions.length > 0 ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Recommended actions
            </p>

            <ul className="mt-2 space-y-2">
              {actions.slice(0, 4).map((action, index) => (
                <li
                  key={`${incident.id}-${index}`}
                  className="flex gap-2 text-sm leading-6 text-slate-600"
                >
                  <span className="font-bold text-cyan-600">
                    •
                  </span>

                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </article>
  );
}