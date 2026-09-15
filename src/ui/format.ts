import type { HealthReport, HealthStatus } from '../types';

export type Tone = 'healthy' | 'degraded' | 'unhealthy' | 'error' | 'unknown';

export function esc(value: unknown): string {
  return String(value ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  );
}

export function toneOf(status: HealthStatus | undefined): Tone {
  switch (String(status ?? '').toLowerCase()) {
    case 'healthy':
      return 'healthy';
    case 'degraded':
      return 'degraded';
    case 'unhealthy':
      return 'unhealthy';
    default:
      return 'unknown';
  }
}

/** ".NET TimeSpan" style durations (00:00:01.2345678) rendered as seconds. */
export function formatDuration(duration: string | undefined): string {
  if (!duration) return '';
  const match = duration.match(/(\d+):(\d+)\.(\d+)/);
  return match ? `${match[2]}.${match[3].slice(0, 2)}s` : '';
}

export function checkCounts(report: HealthReport): { healthy: number; total: number } {
  const checks = Object.values(report.healthChecks ?? {});
  const healthy = checks.filter((c) => toneOf(c.status) === 'healthy').length;
  return { healthy, total: checks.length };
}

export function exceptionMessage(exception: unknown): string {
  if (!exception) return '';
  if (typeof exception === 'string') return exception;
  if (typeof exception === 'object' && 'message' in (exception as object)) {
    return String((exception as { message?: unknown }).message ?? '');
  }
  return '';
}

export function relativeTime(timestamp: number): string {
  const seconds = Math.round((Date.now() - timestamp) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.round(minutes / 60)}h ago`;
}
