# Profisee Health Check

Chrome extension (MV3) that polls the Profisee health endpoint on one or more
servers and shows the results in the toolbar popup.

- **Server list** — one row per configured VM with a status dot, overall status
  and a healthy/total count.
- **Server detail** — click a row for the per-check breakdown (status, tag,
  duration, and the failure description when a check is not healthy).
- **Add / edit / delete** servers; they are stored in `chrome.storage.local`, so
  the list follows the Chrome profile.

Each server is stored as a base URL (e.g. `https://corpltr50.corp.profisee.com`)
and `/profisee/rest/health` is appended automatically, unless the URL already
ends in `/health`.

## Install

Prebuilt packages are produced by GitHub Actions — no local build needed.

**From a release (recommended)**

1. Go to [Releases](https://github.com/thuanvo-profisee/profisee-health-check/releases)
   and download `profisee-health-check-v<version>.zip` from the latest release.
2. Unzip it.
3. Open `chrome://extensions`, turn on **Developer mode** (top right).
4. Click **Load unpacked** and select the unzipped folder.

**From the latest build on `main`**

Open the [Build Extension workflow](https://github.com/thuanvo-profisee/profisee-health-check/actions/workflows/build-extension.yml),
click the most recent successful run, and download the artifact at the bottom of
the page. GitHub serves artifacts as a zip — unzip it and load it the same way.

To cut a release, tag a commit and push the tag:

```bash
git tag v1.1.0
git push origin v1.1.0
```

## Development

```bash
npm install
npm run build     # type-check + build into dist/
npm run dev       # rebuild dist/ on every change
npm run typecheck
```

Load the extension from `chrome://extensions` → *Developer mode* → *Load
unpacked* → select the **`dist`** folder. After `npm run dev` rebuilds, hit the
reload icon on the extension card to pick up the changes.

## Layout

```
popup.html          popup entry (Vite HTML input)
public/             copied verbatim into dist/ — manifest.json, icons
src/
  main.ts           bootstraps the app
  app.ts            state, fetching, view dispatch
  health.ts         URL normalization + health endpoint fetch
  storage.ts        chrome.storage.local persistence
  types.ts          shared types
  styles.css        all styling
  ui/
    list.ts         server list view
    detail.ts       single-server detail view
    form.ts         add/edit server form
    format.ts       escaping, durations, status tone helpers
dist/               build output (git-ignored) — load this as unpacked
```

## Notes

`host_permissions` is `http://*/*` + `https://*/*` because the servers are
user-configured at runtime and cannot be listed in the manifest ahead of time.

A health endpoint returning HTTP 503 with a valid JSON body is rendered as
unhealthy, not as a connection error — only a non-JSON response or a failed
connection shows up as "unreachable".
# profisee-health-check
