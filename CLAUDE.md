# CLAUDE.md

Guidance for AI coding agents working in this repository.

## What this is

`ev-charging-frontend` — the **Next.js 14 dashboard** for the watchborne EV
charge-point platform. It renders a marketing site and an authenticated app that
shows charge points and sites in real time, backed by `charge-points-server`.

Stack: **Next.js 14 (App Router)**, React 18, TypeScript (strict),
**Tailwind + shadcn/ui** (Radix primitives), `react-hook-form` + `zod`,
`next-intl` for i18n. Dev server runs on **port 3001**. Domain types come from
`@watchborne/charge-points-types`.

## Layout

```
app/
  (marketing)/          # public site (route group): home, pricing, contact
  app/                  # authenticated dashboard
    dashboard/ charge-points/ sites/   # pages
    components/         # feature + common + layout components
    hooks/              # useChargePoints, useSites, useWebSocket, useWebSocketContext
    ws/ws-manager.ts    # singleton WebSocket manager (see below)
  api/                  # Next route handlers that PROXY to the backend
  login/                # login page
  proxy.ts              # host-based rewrite (app.* -> /app)
components/ui/          # shadcn/ui primitives (generated; edit via components.json)
lib/                    # http-client, api, api-*, proxy-request, constants
types/                  # thin re-exports of @watchborne/charge-points-types
i18n/request.ts         # next-intl config (locale from NEXT_LOCALE cookie)
messages/{fr,en}.json   # translations
```

## Core patterns — follow these

### Backend calls go through the Next.js API proxy

The browser never calls `charge-points-server` directly. It calls same-origin
`/api/*` route handlers (`app/api/**`), which forward to the backend via
`lib/proxy-request.ts`. That proxy injects the `x-api-key` header from
`API_SECRET_KEY` — a **server-side-only** secret.

- `API_SECRET_KEY` must **never** get a `NEXT_PUBLIC_` prefix, or it leaks into
  the client bundle.
- To add a backend-backed endpoint: create `app/api/<resource>/route.ts` that
  calls `proxyToBackend(request, "/api/<resource>")`, then add a client method in
  `lib/api-*.ts` that hits the local `/api/...` path through `httpClient`.

### Data access layers

- `lib/http-client.ts` — thin `fetch` wrapper (`get/post/patch/delete`), throws on
  non-2xx.
- `lib/api-charge-points.ts`, `lib/api-sites.ts` — typed API methods, aggregated
  in `lib/api.ts` as `api.ChargePoints` / `api.Sites`.
- `lib/constants.ts` — `API_URL` / `WS_URL` from `NEXT_PUBLIC_*` env, with
  localhost fallbacks.

### Real-time WebSocket

`app/app/ws/ws-manager.ts` is a **per-URL singleton** (`getWebSocketManager`)
that owns the connection: reference counting, a disconnect grace period, and
exponential-backoff auto-reconnect. Components consume it through the
`useWebSocket(url)` hook — do not construct `new WebSocket` directly in
components. Prefer `useWebSocketContext` for shared dashboard state.

### UI

Use the existing `components/ui/*` shadcn primitives and `lib` helpers
(`cn`, etc.). shadcn config is in `components.json`; regenerate primitives with
the shadcn CLI rather than hand-editing generated files. Style with Tailwind and
the tokens in `app/design-system/tokens.css`.

### i18n

All user-facing strings go through `next-intl`. Default locale is **`fr`**;
supported locales are `fr` and `en`, selected via the `NEXT_LOCALE` cookie
(`i18n/request.ts`). Add keys to **both** `messages/fr.json` and
`messages/en.json`.

## Commands

```bash
export NPM_TOKEN=<token>   # required to install @watchborne/* from the GH registry
npm install
npm run dev        # next dev on http://localhost:3001
npm run build
npm run lint       # next lint
npm run typecheck  # tsc --noEmit
npm test           # vitest run (test:watch to iterate)
npm run format     # prettier --write .
```

CI (`.github/workflows/build-test-pull-request.yml`) runs lint/format,
typecheck, build, and unit tests — keep them green. A Husky pre-commit hook runs
`npm test` then `lint-staged`.

## Environment

```
NEXT_PUBLIC_API_URL=http://localhost:3000   # backend base URL
NEXT_PUBLIC_WS_URL=ws://localhost:3000/ws    # dashboard WebSocket
API_SECRET_KEY=<shared secret>               # SERVER-SIDE ONLY (x-api-key)
```

`NEXT_PUBLIC_*` values are exposed to the browser; anything secret (like
`API_SECRET_KEY`) must stay unprefixed. See `.env.example`.

## Conventions

- TypeScript strict; path alias `@/*` maps to the repo root.
- Import domain types from `@watchborne/charge-points-types` (re-exported via
  `types/`), never redefine `ChargePoint` / `Site` shapes locally.
- Tests live in `__tests__/` folders (vitest + Testing Library) and are excluded
  from the tsconfig build.
