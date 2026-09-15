import type { HealthReport, Server } from './types';

export const HEALTH_PATH = '/profisee/rest/health';

const REQUEST_TIMEOUT_MS = 15_000;

/** Adds a scheme when missing and trims trailing slashes. */
export function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return withScheme.replace(/\/+$/, '');
}

/** The URL actually polled: the base plus the health path, unless one was given. */
export function healthUrl(baseUrl: string): string {
  const base = normalizeUrl(baseUrl);
  if (!base) return '';
  return /\/health\/?$/i.test(base) ? base : base + HEALTH_PATH;
}

export function hostOf(baseUrl: string): string {
  try {
    return new URL(normalizeUrl(baseUrl)).host;
  } catch {
    return baseUrl;
  }
}

export function isValidUrl(raw: string): boolean {
  try {
    const url = new URL(normalizeUrl(raw));
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Fetches a server's health report. The endpoint answers 503 with a full body
 * when something is unhealthy, so a non-OK status is not treated as a failure
 * as long as the body parses.
 */
export async function fetchHealth(server: Server): Promise<HealthReport> {
  const response = await fetch(healthUrl(server.url), {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  const text = await response.text();
  try {
    return JSON.parse(text) as HealthReport;
  } catch {
    throw new Error(`HTTP ${response.status} ${response.statusText || ''}`.trim() + ' - response was not JSON');
  }
}
