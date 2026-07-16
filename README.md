## Drag and Drop Framework ([https://loopar.build/Doc](https://loopar.build/Doc))

Loopar is a multi-tenant, drag-and-drop web framework built on Node.js, React (SSR + hydration), Vite 8 (Rolldown) and pm2. Full documentation lives in the `loopar-webpage` app and at [loopar.build/Doc](https://loopar.build/Doc).

# Prerequisites

> 1. Node JS 22.12+
> 2. Yarn 4+ (required)

# Installation

## Automatic Installation

### With NPX

```shell
npx loopar-install project-name --port 8080
```

> Your server will start automatically in the dev environment.



## Manual Installation

### Clone from Git

```shell
git clone https://github.com/alphabit-technology/loopar-framework.git project-name
cd project-name
```



##### Install with yarn

```shell
yarn install
yarn start
```

`yarn start` opens the TUI (interactive tenant manager). On a fresh install — a single stopped `dev` tenant — it starts it automatically; press `o` (or click its URL) to open `http://localhost:3000` in your browser.

> [!IMPORTANT]
> Loopar uses a workspace-based monorepo structure. **Yarn 4+ is required** — other package managers (npm, pnpm) are not supported and may cause dependency resolution errors.

> If you don't have Yarn 4, enable it via Corepack (included with Node.js 16.9+):
>
> ```shell
> corepack enable
> yarn set version stable
> ```

When the process is completed, navigate to your browser. The system will show a wizard installation where you can define your database type and connection data, then your project data. Once completed, you can start designing your projects.

# Commands

All commands run through the project-local pm2 daemon (isolated `PM2_HOME`). Use `yarn <command>` or `node bin/cli/index.js <command>`.

There is no separate dev command: prod/dev is a **per-tenant** switch (`sites/<site>/.env`, toggled from the Tenant Manager UI), and `start` simply runs each tenant in whatever mode it is set to.

## Lifecycle


| Command               | Description                                                                                                     |
| --------------------- | --------------------------------------------------------------------------------------------------------------- |
| `yarn start`          | Open the TUI — the interactive tenant manager (same as `yarn tui`)                                              |
| `yarn start all`      | Start every **production** tenant in `sites/` (headless-safe, for servers/scripts)                              |
| `yarn start <site>`   | Start one tenant with its config from `sites/<site>/.env`, whatever its `NODE_ENV`                              |
| `yarn stop [site]`    | Stop one tenant, or everything running in the project namespace                                                 |
| `yarn restart [site]` | With a site: delete + fresh start (picks up `.env` changes). No argument: in-place restart of running processes |
| `yarn delete [site]`  | Remove processes from the pm2 registry                                                                          |
| `yarn kill`           | Kill processes AND the daemon (clean slate)                                                                     |
| `yarn startup`        | Register a reboot-safe boot hook (run once after first deploy)                                                  |


Tenants are resolved the same way the Tenant Manager UI does (`tenant-builder`): process name = tenant id, config built from the tenant's `.env`. The CLI and the UI manage the same processes interchangeably.

## Interactive TUI

```shell
yarn start      # or: yarn tui
```

A full tenant manager in your terminal, with mouse support (click rows and buttons, scroll with the wheel) and keyboard shortcuts. It shows every tenant in `sites/` with live pm2 status and offers per-tenant actions:

- **Start / Stop / Restart** — stop and restart ask for confirmation; starting a tenant with a `DOMAIN` also registers its Caddy route, exactly like the Desk UI.
- **Open** — launch the selected tenant's URL in your browser (key `o`, click the URL cell, or double-click the row). Tenant names are OSC 8 hyperlinks (Cmd/Ctrl+click) in terminals that support them. When Caddy routes the domain, the URL drops the port (`http://dev.localhost`); otherwise it targets the tenant port directly.
- **Logs** — key `l` / Tab switches to a full-screen realtime log stream of the selected tenant: recent history from the pm2 log files, then live lines via the pm2 event bus (the same mechanism `pm2 logs` uses) with timestamps, stderr in red. Arrows/wheel scroll (pauses following), `f` resumes.
- **Prod/dev** — key `p` switches the tenant's `NODE_ENV` (with confirmation) and restarts it if it's running, so cluster/fork mode and asset serving actually apply.
- **New** — guided wizard: name, auto-allocated free port, domain — with optional immediate start.
- **Unregister** — remove from the pm2 registry (files stay on disk).
- **Destroy** — full teardown (pm2 + Caddy route + `sites/<name>/`); requires typing the tenant name to confirm.

First-boot fast path: when there is exactly one tenant and it's stopped (the state right after a fresh install), the TUI starts it automatically on open — `yarn install && yarn start` lands on a running site with zero decisions. With several tenants it never starts anything on its own.

The TUI, the CLI and the Tenant Manager UI all share the same underlying layer (`tenant-builder` + `tenant-service`), so they manage the same processes interchangeably. It runs in "bare mode" — no tenant, Entity or database needed — which makes it the rescue tool of choice when a tenant won't boot. Use `node bin/tui/index.js --list` for a JSON dump in scripts.

## Inspection


| Command            | Description                                                       |
| ------------------ | ----------------------------------------------------------------- |
| `yarn tui`         | Interactive tenant manager: statuses, start/stop, create, destroy |
| `yarn logs [site]` | Tail logs for all sites or one                                    |




## Dependencies


| Command     | Description                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------ |
| `yarn deps` | Install dependencies (`yarn install --immutable`). Decoupled from `build` so a deploy never triggers an implicit install |




## Build & Deploy

Two paths to production, both ending in an atomic release swap:


| Command         | Description                                                                                                                                                                                  |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `yarn build`    | Full build: prepare release → Vite client + server bundles (compressed) → activate                                                                                                           |
| `yarn watch`    | Warm watcher under pm2 (`build-watch` process): incremental rebuilds (~1s) of `apps/**/client/**` into `build/staging/`. Start it when preparing releases; stop with `yarn stop build-watch` |
| `yarn activate` | Snapshot `build/staging/` into a new release and activate it (fast deploy)                                                                                                                   |


Dev tenants serve through Vite middleware (HMR) and do **not** need the watcher — it exists only to keep `build/staging/` fresh for fast deploys.

From the Tenant Manager UI, the **Deploy** split-button maps to the same flows: click = deploy from staging (fast), dropdown = full rebuild & deploy. **Install** runs `yarn deps`.

### Release layout

```
dist -> build/releases/<tag>   # symlink; what the server actually serves
build/
  releases/<tag>/              # versioned, immutable releases (last 2 kept)
  staging/                     # mutable watcher output; snapshot source for fast deploys
```

Activation swaps the `dist` symlink atomically and `pm2 reload`s production tenants — no downtime window. Rollback is one command:

```shell
ln -sfn build/releases/<previous-tag> dist && yarn restart
```



### Build environment variables


| Variable               | Default  | Description                                            |
| ---------------------- | -------- | ------------------------------------------------------ |
| `BUILD_COMPRESS`       | `brotli` | Asset compression: `brotli` | `gzip` | `both` | `none` |
| `BUILD_BROTLI_QUALITY` | `9`      | Brotli quality (0–11)                                  |
| `BUILD_GZIP_LEVEL`     | `6`      | Gzip level (1–9)                                       |




# Project structure

```
apps/<app>/modules/...        # your applications (entities, controllers, client views)
packages/loopar/              # framework core (server, ORM, React components)
packages/vite-env/            # shared Vite config (client/server/watch builds)
sites/<tenant>/               # per-tenant config and SQLite data
bin/                          # cli/, tui/, build/, setup/
```

