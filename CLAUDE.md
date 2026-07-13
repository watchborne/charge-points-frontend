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
  login/                # login page (magic-link sign-in)
  signup/               # alpha signup page
  auth/callback/        # Supabase magic-link code-exchange handler
middleware.ts           # Supabase session refresh, locale resolution
                        # (?lang= > cookie > host), app.* subdomain rewrite,
                        # and auth guard for /app, /api, /login, /signup
components/ui/          # shadcn/ui primitives (generated; edit via components.json)
lib/                    # http-client, api, api-*, proxy-request, constants
types/                  # thin re-exports of @watchborne/charge-points-types
i18n/locale.ts          # Locale type, defaultLocale, localeForHost (edge-safe)
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

### Authentication (Supabase magic link)

- Sign-in is passwordless: `/login` calls `supabase.auth.signInWithOtp` to email
  a magic link; there is no password flow.
- The link points at `app/auth/callback/route.ts`, which exchanges the auth
  code for a session (`exchangeCodeForSession`) and redirects into
  `/app/dashboard`. Do not use the old `verifyOtp`/token-hash approach — the
  callback contract is code-exchange only.
- `middleware.ts` runs on every request: it refreshes the Supabase session via
  `lib/supabase/middleware.ts`, then gates `/app/*` and `/api/*` behind a valid
  session (redirecting to `/login`, or returning 401 for `/api/*`). It also
  rewrites `app.*` production hosts into the `/app` route tree — `/app`, `/api`,
  `/login`, `/signup`, and `/auth` are excluded from that rewrite since they
  don't live under `app/app/`.
- `lib/supabase/{client,server,middleware}.ts` are the only places that should
  construct a Supabase client — use the one matching your context (browser,
  server component, middleware).
- Log out via the header's logout button (`app/app/components/layout/Header.tsx`),
  which calls `supabase.auth.signOut()` then redirects to `/login`.
- `app/signup/` is a public alpha-signup page alongside `/login`; like `/login`,
  an already-authenticated visitor is redirected to `/app/dashboard`.

### UI

Use the existing `components/ui/*` shadcn primitives and `lib` helpers
(`cn`, etc.). shadcn config is in `components.json`; regenerate primitives with
the shadcn CLI rather than hand-editing generated files. Style with Tailwind and
the tokens in `app/design-system/tokens.css`.

### i18n

All user-facing strings go through `next-intl`. Default locale is **`fr`**;
supported locales are `fr` and `en`. `middleware.ts`'s `resolveLocale` picks the
active locale with this precedence: an explicit `?lang=` query param (the
footer's `LocaleSwitcher` component and shared links use this to force a
locale) > the persisted `NEXT_LOCALE` cookie > the host's TLD on a first-time
visit (`localeForHost`: `.fr` -> fr, `.com` -> en, else the default), so
`watch-borne.fr` and `watch-borne.com` load the right language by default. The
resolved locale is written back to the cookie on every request. Add keys to
**both** `messages/fr.json` and `messages/en.json`.

## Commands

```bash
export NPM_TOKEN=<token>   # required to install @watchborne/* from the GH registry
npm install
npm run dev        # next dev on http://localhost:3001
npm run build
npm run lint       # eslint .
npm run typecheck  # tsc --noEmit
npm test           # vitest run (test:watch to iterate)
npm run format     # prettier --write .
```

CI (`.github/workflows/build-test-pull-request.yml`) runs lint/format,
typecheck, build, and unit tests — keep them green. A Husky pre-commit hook runs
`lint-staged`, which applies Prettier to staged files and, for staged
`.ts/.tsx/.js/.jsx` files, ESLint (`--fix`) followed by `vitest related --run`
(only the tests affected by the staged files, not the full suite).

`.github/workflows/update-types-dependency.yml` listens for a `types-released`
`repository_dispatch` event from `charge-points-types` and opens an automated PR
bumping the `@watchborne/charge-points-types` version in `package.json`.

## Environment

```
NEXT_PUBLIC_API_URL=http://localhost:3000   # backend base URL
NEXT_PUBLIC_WS_URL=ws://localhost:3000/ws    # dashboard WebSocket
API_SECRET_KEY=<shared secret>               # SERVER-SIDE ONLY (x-api-key)
NEXT_PUBLIC_SUPABASE_URL=<project url>       # Supabase Auth (public)
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>     # Supabase Auth (public)
```

`NEXT_PUBLIC_*` values are exposed to the browser; anything secret (like
`API_SECRET_KEY`) must stay unprefixed. The Supabase anon key is public by
design (Row Level Security governs access), so it is `NEXT_PUBLIC_`. Both
Supabase values are centralized in `lib/constants.ts` and consumed only through
`lib/supabase/{client,server,middleware}.ts`. See `.env.example`.

## Coding conventions

### Generic

- Import domain types from `@watchborne/charge-points-types` (re-exported via
  `types/`), never redefine `ChargePoint` / `Site` shapes locally.

### React

- Prefer arrow function component, like:

```typescript
export const MyComponent = () => {
  // ...
};
```

### Tests

- Tests live in `__tests__/` folders (vitest + Testing Library) and are excluded
  from the tsconfig build.
- Prefer readable syntax with it SHOULD ... WHEN ..., like:

```typescript
describe("...", () => {
  it("SHOULD ... WHEN ...", () => {
    // ...
  });
});
```

### Typescript

- TypeScript strict; path alias `@/*` maps to the repo root.
