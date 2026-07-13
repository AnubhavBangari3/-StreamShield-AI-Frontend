export type DashboardSummary = {
  total_streams: number;
  healthy_streams: number;
  degraded_streams: number;
  critical_streams: number;
  active_incidents: number;
  critical_incidents: number;
  total_viewers: number;
  average_latency: number;
  average_buffer_ratio: number;
  average_failure_rate: number;
};

export type Stream = {
  id: number;
  name: string;
  event_name: string;
  stream_url: string;
  region: string;
  status: "healthy" | "degraded" | "critical";
  expected_viewers: number;
  created_at: string;
};

export type StreamMetric = {
  id: number;
  stream: number;
  stream_name: string;
  timestamp: string;
  region: string;
  concurrent_viewers: number;
  buffer_ratio: number;
  startup_time_ms: number;
  cdn_latency_ms: number;
  failure_rate: number;
  bitrate_kbps: number;
  packet_loss: number;
  fps: number;
  is_anomaly: boolean;
};

export type Recommendation = {
  id: number;
  action: string;
  priority: string;
  is_completed: boolean;
};

export type Incident = {
  id: number;
  stream: number;
  stream_name: string;
  title: string;
  incident_type: string;
  region: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "investigating" | "resolved";
  affected_users: number;
  probable_root_cause: string;
  ai_summary: string;
  recommended_actions: string[];
  confidence_score: number;
  recommendations: Recommendation[];
  created_at: string;
  resolved_at: string | null;
};

export type Scenario =
  | "normal"
  | "traffic_spike"
  | "buffering_spike"
  | "cdn_failure"
  | "regional_outage";