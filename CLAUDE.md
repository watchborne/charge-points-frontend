# CLAUDE.md

Guidance for AI coding agents working in this repository.

## What this is

`ev-charging-frontend` — the **Next.js 16 dashboard** for the watchborne EV
charge-point platform. It renders a marketing site and an authenticated app that
shows charge points and sites in real time, backed by `charge-points-server`.

Stack: **Next.js 16 (App Router)**, React 18, TypeScript (strict),
**Tailwind + shadcn/ui** (Radix primitives), `react-hook-form` + `zod`,
`next-intl` for i18n, `sonner` for toast notifications. Dev server runs on
**port 3001**. Domain types come from `@watchborne/charge-points-types`.
Production builds run with `next build --webpack` (see Commands below) — a
Turbopack/Netlify tracing bug forces webpack for `next build` specifically;
`next dev` still uses Turbopack.

## Layout

```
app/
  (marketing)/          # public site (route group): home, pricing, contact, features
  app/                  # authenticated dashboard
    dashboard/ sites/    # pages (no local components/ subfolder)
    configuration/       # page + its own components/ (CommissioningTokenPanel:
                         #   installer self-service OCPP commissioning token)
    charge-points/       # page + its own components/ (commissioning dialog/queue/
                         #   checklist, fleet panel, config dialog, trigger message)
    sites/components/    # page-scoped components: SiteFormDialog, SiteCard,
                         #   SiteGrid, SiteGridSkeleton, SiteDeletionDialog
    components/         # shared feature + common + layout components
                        #   (common/Callout.tsx: default/info/error/warning/success)
    404/                 # dashboard-scoped not-found page
    hooks/              # useChargePoints, useSites, useWebSocket, useWebSocketContext
    ws/ws-manager.ts    # singleton WebSocket manager (see below)
  components/layout/Navbar.tsx  # shared Navbar used by both the marketing
                                 #   Navbar and the dashboard Header
  components/ToastNotification/  # stackable toast system (wraps sonner's Toaster;
                                  #   bottom-center, 15s, dismissible, richColors)
  404/                   # top-level not-found page
  api/                   # Next route handlers that PROXY to the backend
  login/                 # login page (magic-link sign-in)
  signup/                # alpha access-request page (gated, admin-approved)
  auth/callback/         # Supabase magic-link code-exchange handler
  auth/components/       # LogoutButton, shared by Header and marketing Navbar
  auth/dev-login/        # local-dev-only magic-link shortcut route
  design-system/         # tokens.css (Tailwind design tokens)
  assets/                # static assets used by app/ components
proxy.ts                # Supabase session refresh, locale resolution
                        # (?lang= > cookie > host), and auth guard for
                        # /app, /api, /login, /signup (Next's renamed
                        # middleware.ts file convention as of Next 16)
components/ui/          # shadcn/ui primitives (generated; edit via components.json)
lib/                    # http-client, api, api-*, proxy-request, constants
types/                  # thin re-exports of @watchborne/charge-points-types
i18n/locale.ts          # Locale type, defaultLocale, localeForHost (edge-safe)
i18n/request.ts         # next-intl config (locale from NEXT_LOCALE cookie)
messages/{fr,en}.json   # translations
emails/templates/       # Supabase auth email templates (magic-link.html, signup.html)
```

## Core patterns — follow these

### Backend calls go through the Next.js API proxy

The browser never calls `charge-points-server` directly. It calls same-origin
`/api/*` route handlers (`app/api/**`), which forward to the backend via
`lib/proxy-request.ts`. That proxy injects the `x-api-key` header from
`API_SECRET_KEY` — a **server-side-only** secret — and, when a Supabase session
exists, also forwards the caller's access token as `Authorization: Bearer
<token>` (via `(await createClient()).auth.getSession()`) so the backend can
resolve the caller's per-user `AccessScope` (see `charge-points-server`'s ADR
0002). Routes exempted from the session gate (e.g. `/api/access-requests`, see
`PUBLIC_API_PATHS` in `proxy.ts`) simply have no token to attach.

- `API_SECRET_KEY` must **never** get a `NEXT_PUBLIC_` prefix, or it leaks into
  the client bundle.
- To add a backend-backed endpoint: create `app/api/<resource>/route.ts` that
  calls `proxyToBackend(request, "/api/<resource>")`, then add a client method in
  `lib/api-*.ts` that hits the local `/api/...` path through `httpClient`.

### Data access layers

- `lib/http-client.ts` — thin `fetch` wrapper (`get/post/patch/delete`), throws on
  non-2xx.
- `lib/api-charge-points.ts`, `lib/api-sites.ts` — typed API methods, aggregated
  in `lib/api.ts` as `api.ChargePoints` / `api.Sites`. `lib/api-me.ts`
  (`api.Me.getMe()`) fetches the caller's own scoped charge points via
  `GET /api/me`; `lib/api-access-requests.ts` (`api.AccessRequests.requestAccess`)
  posts an alpha access request from `/signup` (see Authentication below).
  `lib/api-commissioning-token.ts` (`api.CommissioningToken`) proxies
  `GET`/`POST` `/api/me/commissioning-token` for the installer
  self-service commissioning-token flow on `/app/configuration`
  (`CommissioningTokenPanel`) — the plaintext token is only ever returned
  once, on issue, and is never persisted client-side.
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
- `proxy.ts` (Next's renamed `middleware.ts` file convention as of Next 16)
  runs on every request: it redirects the retired `watch-borne.fr` host
  permanently to `watch-borne.com` (forcing the `fr` locale via `?lang=`),
  refreshes the Supabase session via `lib/supabase/middleware.ts` (that
  helper's filename is unrelated to the file-convention rename), then gates
  `/app/*` and `/api/*` behind a valid
  session (redirecting to `/login`, or returning 401 for `/api/*`) — except the
  paths listed in `PUBLIC_API_PATHS` (currently just `/api/access-requests`,
  reachable by unauthenticated visitors from `/signup`). The Supabase session
  lookup (`getUser()`, a network round trip) only runs for the authenticated
  surface (`/api`, `/app`, `/login`, `/signup`); public marketing pages skip it
  and get locale resolution only. There is no `app.*` subdomain routing —
  `/app/*` is served at that path on the main host in every environment.
- `lib/supabase/{client,server,middleware}.ts` are the only places that should
  construct a Supabase client — use the one matching your context (browser,
  server component, middleware). `lib/supabase/admin.ts` is the one exception:
  a service-role client used only by the local-dev sign-in shortcut below.
- Log out via the shared `LogoutButton` (`app/auth/components/LogoutButton.tsx`), used
  by both the app `Header` and the marketing `Navbar`, which calls
  `supabase.auth.signOut()` then redirects to the marketing homepage (`/`).
- `app/auth/dev-login/route.ts` is a **local-dev-only** shortcut that mints a
  magic link through the Supabase admin API and verifies its `token_hash`
  server-side (`supabase.auth.verifyOtp`), skipping the email round-trip;
  `app/login/components/DevLoginShortcut.tsx` renders its form on `/login`,
  only when `NODE_ENV !== "production"`. The route itself re-checks
  `NODE_ENV`, requires the explicit opt-in flag `ENABLE_DEV_LOGIN=true`, and
  requires `SUPABASE_SERVICE_ROLE_KEY` to be set — never set either outside
  a local `.env`. The extra flag exists so a preview/staging environment
  that accidentally has the service-role key set still can't be used to sign
  in as an arbitrary email. It deliberately does **not** go through
  `/auth/callback`: a real magic link works because the browser's own
  `signInWithOtp` call stores a PKCE code_verifier before the link is
  clicked, which an admin-generated link never has, so `exchangeCodeForSession`
  can't consume it. Verifying the `token_hash` directly is the dev-only
  route's own, separate mechanism — it doesn't touch or duplicate the
  callback's code-exchange-only contract for real magic links.
- `app/signup/` is a public alpha-access-request page alongside `/login`; like
  `/login`, an already-authenticated visitor is redirected to `/app/dashboard`.
  It does **not** create a Supabase user directly — it POSTs the visitor's
  email via `api.AccessRequests.requestAccess` to the public, unauthenticated
  `app/api/access-requests/route.ts` proxy (idempotent on email backend-side).
  Approval happens out-of-band: an admin invites the email from the Supabase
  dashboard, which is what actually creates the auth user — `/login`'s
  `shouldCreateUser: false` then naturally admits only invited users.

### UI

Use the existing `components/ui/*` shadcn primitives and `lib` helpers
(`cn`, etc.). shadcn config is in `components.json`; regenerate primitives with
the shadcn CLI rather than hand-editing generated files. Style with Tailwind and
the tokens in `app/design-system/tokens.css`.

- `app/components/ToastNotification/` wraps `sonner`'s `Toaster` into the
  dashboard-wide stackable toast system (bottom-center, 15s, dismissible,
  `richColors`) — use it instead of adding another notification mechanism.
- `app/app/components/common/Callout.tsx` is the shared inline-message
  component (`default` / `info` / `error` / `warning` / `success` variants),
  used both in the dashboard and on `/login` (e.g. `AuthErrorCallout`).

### i18n

All user-facing strings go through `next-intl`. Default locale is **`fr`**;
supported locales are `fr` and `en`. `proxy.ts`'s `resolveLocale` picks the
active locale with this precedence: an explicit `?lang=` query param (the
footer's `LocaleSwitcher` component and shared links use this to force a
locale) > the persisted `NEXT_LOCALE` cookie > the host's TLD on a first-time
visit (`localeForHost`: `.fr` -> fr, `.com` -> en, else the default). In
practice `watch-borne.fr` is retired and permanently redirected to
`watch-borne.com?lang=fr` by `proxy.ts` before locale resolution runs (see
the Authentication section above), so the TLD branch only still matters for
`.com`/other hosts. The resolved locale is written back to the cookie on every
request. Add keys to **both** `messages/fr.json` and `messages/en.json`.

**Translation usage pattern:**

- **Single call per component:** always use `const t = useTranslations("")` (root
  namespace) — never use `useTranslations("some.namespace")`.
- **Full paths:** reference translations with the complete path from root,
  e.g. `t("loginPage.form.email")` not `t("form.email")`.
- **No arrays in translations:** translate lists as objects with key-value pairs.
  For example, instead of `"features": ["item1", "item2"]`, use
  `"features": { "ocpp": "item1", "multisite": "item2" }`. Iterate over them
  with `Object.entries(t.raw("path.to.features"))` in components.

## Commands

```bash
export NPM_TOKEN=<token>   # required to install @watchborne/* from the GH registry
npm install
npm run dev        # next dev on http://localhost:3001
npm run build       # next build --webpack (forced webpack: Turbopack has a
                    #   Netlify tracing bug on this project, see #199)
npm run start      # next start (serves the production build)
npm run lint       # eslint . (lint:fix to autofix)
npm run typecheck  # tsc --noEmit
npm test           # vitest run (test:watch to iterate)
npm run test:ci    # vitest run
npm run format     # prettier --write . (format:check to verify only)
npm run all-checks # scripts/all-checks.sh - runs the full CI suite locally
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
NEXT_PUBLIC_API_URL=http://localhost:3000        # backend base URL
NEXT_PUBLIC_WS_URL=ws://localhost:3000/ws         # dashboard WebSocket
NEXT_PUBLIC_OCPP_SERVER_URL=ws://localhost:9000/ocpp  # public OCPP endpoint (Configuration page)
API_SECRET_KEY=<shared secret>                    # SERVER-SIDE ONLY (x-api-key)
NEXT_PUBLIC_SUPABASE_URL=<project url>            # Supabase Auth (public)
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>          # Supabase Auth (public)
ENABLE_DEV_LOGIN=                                 # optional, LOCAL DEV ONLY (dev-login shortcut opt-in)
SUPABASE_SERVICE_ROLE_KEY=                        # optional, LOCAL DEV ONLY (dev-login shortcut)
```

`NEXT_PUBLIC_*` values are exposed to the browser; anything secret (like
`API_SECRET_KEY` and `SUPABASE_SERVICE_ROLE_KEY`) must stay unprefixed. The
Supabase anon key is public by design (Row Level Security governs access), so
it is `NEXT_PUBLIC_`. `NEXT_PUBLIC_OCPP_SERVER_URL` and the Supabase values are
centralized in `lib/constants.ts` and consumed only through
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
