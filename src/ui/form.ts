import type { App } from '../app';
import { on } from '../app';
import { HEALTH_PATH, healthUrl, hostOf, isValidUrl, normalizeUrl } from '../health';
import { newServerId } from '../storage';
import type { View } from '../types';
import { esc } from './format';

export function renderForm(app: App, view: Extract<View, { name: 'form' }>): void {
  const existing = view.serverId ? app.serverById(view.serverId) : undefined;

  app.header.innerHTML = `
    <button class="btn icon" id="back" title="Cancel">&lsaquo;</button>
    <span class="title">${existing ? 'Edit server' : 'Add server'}</span>
  `;

  app.content.innerHTML = `
    <div class="form">
      <div>
        <label for="nameInput">Display name</label>
        <input id="nameInput" type="text" placeholder="corpltr50" value="${esc(existing?.name ?? '')}">
      </div>
      <div>
        <label for="urlInput">Server URL</label>
        <input id="urlInput" type="text" placeholder="https://corpltr50.corp.profisee.com"
               value="${esc(existing?.url ?? '')}" spellcheck="false">
        <div class="hint" id="urlHint"></div>
      </div>
      ${view.error ? `<div class="form-error">${esc(view.error)}</div>` : ''}
      <div class="form-actions">
        <button class="btn primary" id="save">Save</button>
        ${existing ? '<button class="btn danger" id="remove">Delete</button>' : ''}
      </div>
    </div>
  `;

  const nameInput = app.content.querySelector<HTMLInputElement>('#nameInput')!;
  const urlInput = app.content.querySelector<HTMLInputElement>('#urlInput')!;
  const hint = app.content.querySelector<HTMLElement>('#urlHint')!;

  const updateHint = () => {
    const value = urlInput.value.trim();
    hint.textContent = value
      ? `Checks ${healthUrl(value)}`
      : `${HEALTH_PATH} is appended unless the URL already ends in /health.`;
  };
  updateHint();
  urlInput.addEventListener('input', updateHint);

  const save = async () => {
    const url = normalizeUrl(urlInput.value);
    if (!url) return app.go({ ...view, error: 'Server URL is required.' });
    if (!isValidUrl(url)) return app.go({ ...view, error: 'That does not look like a valid URL.' });

    const server = {
      id: existing?.id ?? newServerId(),
      name: nameInput.value.trim() || hostOf(url),
      url,
    };
    const urlChanged = existing?.url !== url;

    await app.upsertServer(server);
    if (urlChanged) app.results.delete(server.id);

    app.go(existing ? { name: 'detail', serverId: server.id } : { name: 'list' });
    if (urlChanged) void app.refresh(server);
  };

  for (const input of [nameInput, urlInput]) {
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') void save();
    });
  }

  on(app.header, 'back', 'click', () =>
    app.go(existing ? { name: 'detail', serverId: existing.id } : { name: 'list' }),
  );
  on(app.content, 'save', 'click', () => void save());
  on(app.content, 'remove', 'click', async () => {
    if (!existing) return;
    await app.removeServer(existing.id);
    app.go({ name: 'list' });
  });

  nameInput.focus();
}
