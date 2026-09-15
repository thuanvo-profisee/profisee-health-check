import type { App } from '../app';
import { on } from '../app';
import { hostOf } from '../health';
import type { Result, Server } from '../types';
import { checkCounts, esc, formatDuration, toneOf } from './format';

function rowMarkup(server: Server, result: Result | undefined): string {
  let tone = 'loading';
  let pill = '<span class="summary-pill">checking&hellip;</span>';
  let detail = '';

  if (result?.state === 'error') {
    tone = 'error';
    pill = '<span class="summary-pill error">unreachable</span>';
  } else if (result?.state === 'ok') {
    tone = toneOf(result.report.status);
    const { healthy, total } = checkCounts(result.report);
    pill = `<span class="summary-pill ${tone}">${esc(result.report.status)} &middot; ${healthy}/${total}</span>`;
    detail = formatDuration(result.report.totalDuration);
  }

  const meta = [hostOf(server.url), detail].filter(Boolean).join(' &middot; ');

  return `
    <button class="server-row" data-id="${esc(server.id)}">
      <span class="status-dot ${tone}"></span>
      <span class="info">
        <span class="name">${esc(server.name)}</span>
        <span class="meta">${meta}</span>
      </span>
      ${pill}
      <span class="chevron">&rsaquo;</span>
    </button>
  `;
}

export function renderList(app: App): void {
  const busy = app.servers.some((s) => app.resultFor(s.id)?.state === 'loading');

  app.header.innerHTML = `
    <span class="title">Profisee Health Check</span>
    <button class="btn" id="refreshAll" ${busy ? 'disabled' : ''}>${busy ? '&hellip;' : 'Refresh'}</button>
  `;

  const body = app.servers.length
    ? `<div class="server-list">${app.servers.map((s) => rowMarkup(s, app.resultFor(s.id))).join('')}</div>`
    : '<div class="empty">No servers yet.<br>Add one to start monitoring.</div>';

  app.content.innerHTML = `
    ${body}
    <div class="footer"><button class="btn primary" id="addServer">+ Add server</button></div>
  `;

  app.content.querySelectorAll<HTMLElement>('.server-row').forEach((row) => {
    row.addEventListener('click', () => {
      const serverId = row.dataset.id as string;
      app.go({ name: 'detail', serverId });
      const server = app.serverById(serverId);
      const result = app.resultFor(serverId);
      if (server && (!result || result.state === 'error')) void app.refresh(server);
    });
  });

  on(app.header, 'refreshAll', 'click', () => app.refreshAll());
  on(app.content, 'addServer', 'click', () => app.go({ name: 'form', serverId: null }));
}
