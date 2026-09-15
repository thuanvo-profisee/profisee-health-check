import type { App } from '../app';
import { on } from '../app';
import { healthUrl } from '../health';
import type { HealthCheck, View } from '../types';
import { checkCounts, esc, exceptionMessage, formatDuration, relativeTime, toneOf } from './format';

function checkMarkup(name: string, check: HealthCheck): string {
  const tone = toneOf(check.status);
  const tag = check.tags?.[0] ?? '';
  const note = check.description || exceptionMessage(check.exception);
  const showNote = note && tone !== 'healthy';

  return `
    <div class="service-card">
      <span class="status-dot ${tone}"></span>
      <span class="name" title="${esc(name)}">${esc(name)}</span>
      ${tag ? `<span class="tag">${esc(tag)}</span>` : ''}
      <span class="duration">${formatDuration(check.duration)}</span>
    </div>
    ${showNote ? `<div class="service-note">${esc(note)}</div>` : ''}
  `;
}

export function renderDetail(app: App, view: Extract<View, { name: 'detail' }>): void {
  const server = app.serverById(view.serverId);
  if (!server) return app.go({ name: 'list' });

  const result = app.resultFor(server.id);
  const busy = !result || result.state === 'loading';

  app.header.innerHTML = `
    <button class="btn icon" id="back" title="Back to all servers">&lsaquo;</button>
    <span class="title">${esc(server.name)}<span class="subtitle">${esc(healthUrl(server.url))}</span></span>
    <button class="btn icon" id="edit" title="Edit server">&#9998;</button>
    <button class="btn" id="refresh" ${busy ? 'disabled' : ''}>${busy ? '&hellip;' : 'Refresh'}</button>
  `;

  if (busy) {
    app.content.innerHTML = `
      <div class="overall-status">
        <span class="status-dot loading"></span>
        <span class="status-text">Checking&hellip;</span>
      </div>
    `;
  } else if (result.state === 'error') {
    app.content.innerHTML = `
      <div class="overall-status error">
        <span class="status-dot error"></span>
        <span class="status-text">Unreachable</span>
        <span class="duration">${esc(relativeTime(result.fetchedAt))}</span>
      </div>
      <div class="error">${esc(result.message)}</div>
    `;
  } else {
    const { report, fetchedAt } = result;
    const tone = toneOf(report.status);
    const { healthy, total } = checkCounts(report);
    const cards = Object.entries(report.healthChecks ?? {})
      .map(([name, check]) => checkMarkup(name, check))
      .join('');

    app.content.innerHTML = `
      <div class="overall-status ${tone}">
        <span class="status-dot ${tone}"></span>
        <span class="status-text">${esc(report.status)}</span>
        <span class="duration">${healthy}/${total} &middot; ${esc(formatDuration(report.totalDuration))}</span>
      </div>
      <div class="services-grid">${cards || '<div class="empty">No health checks reported.</div>'}</div>
      <div class="checked-at">Checked ${esc(relativeTime(fetchedAt))}</div>
    `;
  }

  on(app.header, 'back', 'click', () => app.go({ name: 'list' }));
  on(app.header, 'refresh', 'click', () => void app.refresh(server));
  on(app.header, 'edit', 'click', () => app.go({ name: 'form', serverId: server.id }));
}
