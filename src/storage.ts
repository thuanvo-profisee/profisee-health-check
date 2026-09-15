import type { Server } from "./types";

const STORAGE_KEY = "servers";

const DEFAULT_SERVERS: Server[] = [];

function isServer(value: unknown): value is Server {
  const s = value as Server;
  return (
    !!s &&
    typeof s.id === "string" &&
    typeof s.name === "string" &&
    typeof s.url === "string"
  );
}

/** Reads the saved servers, seeding the default list on first run. */
export async function loadServers(): Promise<Server[]> {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  const raw = stored[STORAGE_KEY];

  if (Array.isArray(raw)) return raw.filter(isServer);

  await saveServers(DEFAULT_SERVERS);
  return DEFAULT_SERVERS.slice();
}

export async function saveServers(servers: Server[]): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: servers });
}

export function newServerId(): string {
  return `srv_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
