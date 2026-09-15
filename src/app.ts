import { fetchHealth } from './health';
import { loadServers, saveServers } from './storage';
import type { Result, Server, View } from './types';
import { renderDetail } from './ui/detail';
import { renderForm } from './ui/form';
import { renderList } from './ui/list';

export interface App {
  servers: Server[];
  results: Map<string, Result>;
  view: View;

  header: HTMLElement;
  content: HTMLElement;

  go(view: View): void;
  render(): void;
  serverById(id: string): Server | undefined;
  resultFor(id: string): Result | undefined;

  refresh(server: Server): Promise<void>;
  refreshAll(): void;
  upsertServer(server: Server): Promise<void>;
  removeServer(id: string): Promise<void>;
}

export function createApp(header: HTMLElement, content: HTMLElement): App {
  const app: App = {
    servers: [],
    results: new Map(),
    view: { name: 'list' },
    header,
    content,

    go(view) {
      app.view = view;
      app.render();
    },

    render() {
      switch (app.view.name) {
        case 'detail':
          return renderDetail(app, app.view);
        case 'form':
          return renderForm(app, app.view);
        default:
          return renderList(app);
      }
    },

    serverById: (id) => app.servers.find((s) => s.id === id),
    resultFor: (id) => app.results.get(id),

    async refresh(server) {
      app.results.set(server.id, { state: 'loading' });
      app.render();
      try {
        const report = await fetchHealth(server);
        app.results.set(server.id, { state: 'ok', report, fetchedAt: Date.now() });
      } catch (error) {
        app.results.set(server.id, {
          state: 'error',
          message: error instanceof Error ? error.message : String(error),
          fetchedAt: Date.now(),
        });
      }
      app.render();
    },

    refreshAll() {
      for (const server of app.servers) void app.refresh(server);
    },

    async upsertServer(server) {
      const index = app.servers.findIndex((s) => s.id === server.id);
      if (index === -1) app.servers.push(server);
      else app.servers[index] = server;
      await saveServers(app.servers);
    },

    async removeServer(id) {
      app.servers = app.servers.filter((s) => s.id !== id);
      app.results.delete(id);
      await saveServers(app.servers);
    },
  };

  return app;
}

export async function startApp(app: App): Promise<void> {
  app.servers = await loadServers();
  app.render();
  app.refreshAll();
}

/** Small helper so views can wire buttons by id after setting innerHTML. */
export function on(root: ParentNode, id: string, event: string, handler: () => void): void {
  root.querySelector(`#${id}`)?.addEventListener(event, handler);
}
