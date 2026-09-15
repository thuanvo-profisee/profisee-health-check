export interface Server {
  id: string;
  name: string;
  /** Base URL, e.g. https://corpltr50.corp.profisee.com */
  url: string;
}

export type HealthStatus = 'Healthy' | 'Degraded' | 'Unhealthy' | string;

export interface HealthCheck {
  status: HealthStatus;
  description?: string | null;
  duration?: string;
  tags?: string[];
  exception?: { message?: string } | string | null;
  data?: Record<string, unknown>;
}

export interface HealthReport {
  status: HealthStatus;
  totalDuration?: string;
  healthChecks?: Record<string, HealthCheck>;
}

export type Result =
  | { state: 'loading' }
  | { state: 'ok'; report: HealthReport; fetchedAt: number }
  | { state: 'error'; message: string; fetchedAt: number };

export type View =
  | { name: 'list' }
  | { name: 'detail'; serverId: string }
  | { name: 'form'; serverId: string | null; error?: string };
