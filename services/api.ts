import axios from "axios";

import type {
  DashboardSummary,
  Incident,
  Scenario,
  Stream,
  StreamMetric,
} from "@/types/dashboard";

const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "http://127.0.0.1:8000/api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const response = await api.get<DashboardSummary>("/dashboard/");
  return response.data;
}

export async function getStreams(): Promise<Stream[]> {
  const response = await api.get<Stream[]>("/streams/");
  return response.data;
}

export async function getMetrics(): Promise<StreamMetric[]> {
  const response = await api.get<StreamMetric[]>("/metrics/");
  return response.data;
}

export async function getIncidents(): Promise<Incident[]> {
  const response = await api.get<Incident[]>("/incidents/");
  return response.data;
}

export async function runScenario(
  scenario: Scenario,
  points = 5,
): Promise<unknown> {
  const response = await api.post("/simulator/generate/", {
    scenario,
    points,
  });

  return response.data;
}

export default api;