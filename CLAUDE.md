# CLAUDE.md

Guidance for AI coding agents working in this repository.

## What this is

`charge-points-frontend` — the **Next.js 16 dashboard** for the watchborne EV
charge-point platform. It renders a marketing site and an authenticated app that
shows charge points and sites in real time, backed by `charge-points-server`.

Stack: **Next.js 16 (App Router)**, React 18, TypeScript (strict),
**Tailwind + shadcn/ui** (Radix primitives), `react-hook-form` + `zod`,
`next-intl` for i18n, `sonner` for toast notifications, `recharts` for charts. Dev server runs on
**port 3001**. Domain types come from `@watchborne/charge-points-types`.
Production builds run with `next build --webpack` (see Commands below) — a
Turbopack/Netlify tracing bug forces webpack for `next build` specifically;
`next dev` still uses Turbopack.

## Layout

```
app/
  [locale]/              # every page lives under this segment — locale is part
                         #   of the URL now (fr unprefixed/default, /en/... for
                         #   English), which is what lets Next.js statically
                         #   generate and CDN-cache these routes (see i18n/
                         #   routing.ts). Each root layout below still calls
                         #   generateStaticParams + setRequestLocale, and every
                         #   page under (marketing) also calls setRequestLocale
                         #   itself (required per-segment, not just the layout)
                         #   with getTranslations (not useTranslations, which
                         #   can't be called in an async Server Component).
    (marketing)/          # public site (route group): home, pricing, contact, features
    app/                  # authenticated dashboard
      dashboard/ sites/    # pages (no local components/ subfolder)
      configuration/       # page + its own components/ (CommissioningTokenPanel:
                           #   installer self-service OCPP commissioning token)
      charge-points/       # page + its own components/ (commissioning dialog/queue/
                           #   checklist, fleet panel, config dialog, trigger message).
                           #   The page itself wraps its useSearchParams() usage in
                           #   Suspense — required for static rendering.
      sites/components/    # page-scoped components: SiteFormDialog, SiteCard,
                           #   SiteGrid, SiteGridSkeleton, SiteDeletionDialog
      components/         # shared feature + common + layout components
                          #   (common/: ConnectorStatusIcon, WsStatusBadge —
                          #   app-specific, tied to domain types/state; the
                          #   generic display primitives that used to live here
                          #   moved to @watchborne/electrons)
      404/                 # dashboard-scoped not-found page
      hooks/              # useChargePoints, useSites, useWebSocket, useWebSocketContext
      ws/ws-manager.ts    # singleton WebSocket manager (see below)
    404/                   # top-level not-found page
    login/                 # login page (magic-link sign-in)
    signup/                # alpha access-request page (gated, admin-approved)
  components/layout/Navbar.tsx  # shared Navbar used by both the marketing
                                 #   Navbar and the dashboard Header — imports
                                 #   Link/usePathname from i18n/navigation.ts,
                                 #   not next/link or next/navigation
  components/ToastNotification/  # stackable toast system (wraps sonner's Toaster;
                                  #   bottom-center, 15s, dismissible, richColors)
  api/                   # Next route handlers that PROXY to the backend — outside
                         #   [locale] (no locale prefix; not user-facing pages)
  auth/callback/         # Supabase magic-link code-exchange handler — also
                         #   outside [locale]; builds its own locale-prefixed
                         #   redirect target from the NEXT_LOCALE cookie
                         #   (i18n/locale.ts's localizedPath) since it has no
                         #   [locale] route param to read
  auth/components/       # LogoutButton, shared by Header and marketing Navbar
  auth/dev-login/        # local-dev-only OTP-code shortcut route
  assets/                # static assets used by app/ components
proxy.ts                # Supabase session refresh, next-intl URL-based locale
                        # routing (via next-intl/middleware), and auth guard for
                        # /app, /api, /login, /signup (Next's renamed
                        # middleware.ts file convention as of Next 16). /api and
                        # /auth skip next-intl's routing entirely (they're
                        # outside [locale]); everything else goes through
                        # next-intl's middleware first, and a redirect from
                        # that (URL normalization) short-circuits immediately
                        # before the auth gate runs.
components/ui/          # shadcn/ui primitives not yet promoted to
                        #   @watchborne/electrons (generated; edit via
                        #   components.json) — Dialog, AlertDialog, Popover,
                        #   DropdownMenu, Select, Command, Calendar,
                        #   Datepicker, Form
lib/                    # http-client, api, api-*, proxy-request, constants
types/                  # thin re-exports of @watchborne/charge-points-types
i18n/locale.ts          # Locale type, defaultLocale, isLocale, localizedPath (edge-safe)
i18n/routing.ts         # next-intl defineRouting: locales, defaultLocale,
                        #   localePrefix: "as-needed" (fr unprefixed, /en/... prefixed),
                        #   localeDetection: false (see i18n/routing.ts's own
                        #   comment for why — SEO, not Accept-Language guessing)
i18n/navigation.ts      # next-intl createNavigation: locale-aware Link, redirect,
                        #   usePathname, useRouter — use these, not next/link or
                        #   next/navigation, for any in-app navigation under [locale]
i18n/request.ts         # next-intl config: locale from the [locale] route param
                        #   (via requestLocale), not a cookie — that's what makes
                        #   these routes static-generation-eligible again
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
  `lib/api-metering.ts` (`api.Metering`) reads the metering history —
  `getMeterSamples` (the raw time series) and `getConsumption` (the window reduced
  per connector/measurand/unit). Its response types are declared locally, like
  `Me`: the backend keeps `MeterSample` server-local (its ADR 0004), so these
  response contracts are the shared surface.
- `lib/constants.ts` — `API_URL` / `WS_URL` from `NEXT_PUBLIC_*` env, with
  localhost fallbacks.
- `lib/proxy-request.ts` **appends** query parameters rather than setting them, so
  a repeated one survives the hop (`?measurand=A&measurand=B` is how the metering
  reads ask for two series). Keep it that way.

### Real-time WebSocket

`app/[locale]/app/ws/ws-manager.ts` is a **per-URL singleton** (`getWebSocketManager`)
that owns the connection: reference counting, a disconnect grace period, and
exponential-backoff auto-reconnect. Components consume it through the
`useWebSocket(url)` hook — do not construct `new WebSocket` directly in
components. Prefer `useWebSocketContext` for shared dashboard state.

### Authentication (Supabase OTP)

- Sign-in is passwordless: `/login` calls `supabase.auth.signInWithOtp` to
  email a 6-digit code; there is no password flow and no magic link.
  `LoginForm` sends the code; once that succeeds, `app/login/page.tsx` renders
  `VerifyOtpForm`, which verifies it client-side
  (`supabase.auth.verifyOtp({ email, token, type: "email" })`) and
  hard-redirects to `/app/dashboard` on success — a full-page navigation, not
  a router push, for the same reason as `LogoutButton` below (session state
  elsewhere is resolved once on mount, so a hard reload is what reliably
  picks it up). See `charge-points-server`'s ADR 0005 for why this replaced
  an earlier magic-link flow: a magic link's PKCE exchange only works in the
  browser that requested it, which broke whenever the link was opened in a
  different browser, device, or in-app mail browser. An OTP code has no such
  dependency, and there is no `/auth/callback` route anymore — sign-in never
  redirects through Supabase's hosted domain.
- `proxy.ts` (Next's renamed `middleware.ts` file convention as of Next 16)
  runs on every request: it redirects the retired `watch-borne.fr` host
  permanently to `watch-borne.com` (an unprefixed path there already means fr,
  the default locale — see i18n/routing.ts), refreshes the Supabase session via
  `lib/supabase/middleware.ts` (that helper's filename is unrelated to the
  file-convention rename), then gates `/app/*` and `/api/*` behind a valid
  session (redirecting to `/login`, or returning 401 for `/api/*`) — except the
  paths listed in `PUBLIC_API_PATHS` (currently just `/api/access-requests`,
  reachable by unauthenticated visitors from `/signup`). The Supabase session
  lookup (`getUser()`, a network round trip) only runs for the authenticated
  surface (`/api`, `/app`, `/login`, `/signup`); public marketing pages skip it
  entirely. There is no `app.*` subdomain routing — `/app/*` is served at that
  path (under the active locale prefix) on the main host in every environment.
- `lib/supabase/{client,server,middleware}.ts` are the only places that should
  construct a Supabase client — use the one matching your context (browser,
  server component, middleware). `lib/supabase/admin.ts` is the one exception:
  a service-role client used only by the local-dev sign-in shortcut below.
- Log out via the shared `LogoutButton` (`app/auth/components/LogoutButton.tsx`), used
  by both the app `Header` and the marketing `Navbar`, which calls
  `supabase.auth.signOut()` then redirects to the marketing homepage (`/`).
- `app/auth/dev-login/route.ts` is a **local-dev-only** shortcut that mints an
  OTP code through the Supabase admin API (`generateLink`'s
  `properties.email_otp`) and returns it as JSON, skipping the email
  round-trip; `app/login/components/DevLoginShortcut.tsx` fetches it and
  passes it to `VerifyOtpForm` as `initialCode`, which auto-submits on mount.
  Local dev still signs in in one click, but by running the exact same
  client-side `verifyOtp` call a real user's browser would, not a
  server-side shortcut around it — unlike the magic-link-era version of this
  route, which had to verify a `token_hash` server-side, because a real
  magic link's PKCE exchange can only be driven by the browser that
  requested it (see ADR 0005 above). `DevLoginShortcut` renders on `/login`
  only when `NODE_ENV !== "production"`. The route itself re-checks
  `NODE_ENV`, requires the explicit opt-in flag `ENABLE_DEV_LOGIN=true`, and
  requires `SUPABASE_SERVICE_ROLE_KEY` to be set — never set either outside
  a local `.env`. The extra flag exists so a preview/staging environment
  that accidentally has the service-role key set still can't be used to
  fetch a code for an arbitrary email.
- `app/signup/` is a public alpha-access-request page alongside `/login`; like
  `/login`, an already-authenticated visitor is redirected to `/app/dashboard`.
  It does **not** create a Supabase user directly — it POSTs the visitor's
  email via `api.AccessRequests.requestAccess` to the public, unauthenticated
  `app/api/access-requests/route.ts` proxy (idempotent on email backend-side).
  Approval happens out-of-band: an admin invites the email from the Supabase
  dashboard, which is what actually creates the auth user — `/login`'s
  `shouldCreateUser: false` then naturally admits only invited users.

### UI

Most UI primitives (`Button`, `Badge`, `Input`, `Label`, `Switch`, `Tabs`,
`Table`, `Collapsible`, `Callout`, `Tag`, `Loader`, `Skeleton`, `StatCard`)
come from `@watchborne/electrons`, the shared watchborne component library —
import them from there rather than redefining or re-copying them locally.
The remaining, more composite or app-specific shadcn primitives
(`Dialog`, `AlertDialog`, `Popover`, `DropdownMenu`, `Select`, `Command`,
`Calendar`, `Datepicker`, `Form`) still live in `components/ui/*`; shadcn
config is in `components.json`, regenerate with the shadcn CLI rather than
hand-editing generated files. Style with Tailwind and the tokens from
`@watchborne/electrons/tokens.css` (imported once in `app/globals.css`) and
`@watchborne/electrons/tailwind-preset` (plugged into `tailwind.config.js`
via `presets`). Use `lib` helpers (`cn`, etc.) alongside them.

### Charts

Charts are **recharts**, and the categorical series colours are the
`--series-1..3` custom properties defined in `app/globals.css` (not in
`@watchborne/electrons/tokens.css`: that package ships semantic UI, brand and
_status_ tones, and status tones are reserved — reusing one as "series 2" would
tell a reader a connector is faulted because it is third in a legend).

Rules that are not stylistic preferences:

- **Never a second y-axis.** Two measures of different scale (Wh and W) get two
  charts or a selector that shows one at a time — aligning two scales on one plot
  invents a correlation the data does not contain.
  `ChargePointConsumptionPanel` is the worked example: a measurand selector, built
  from what the station actually reported, keeps the plot to one unit.
- **Three series maximum.** Overlaid lines can sit beside any other line, so the
  palette must clear the colour-blindness floors on _every_ pair, and past three
  hues no ordering does. Beyond three, say what was left out (see
  `CHARTABLE_CONNECTORS`) — never silently truncate.
- **Text never wears the series colour.** Legends, axis ticks, tooltip labels and
  values use ink tokens; a line key or dot beside them carries identity. Recharts
  colours legend text by series by default — override it with `formatter`.
- **Ship the hover layer and a table view.** A crosshair tooltip listing every
  series at that x, and a table of the same values, so nothing is reachable only
  by hovering.
- Changing a series colour means re-running the palette validator for **both**
  modes and all pairs, not eyeballing it.

- `app/components/ToastNotification/` wraps `sonner`'s `Toaster` into the
  dashboard-wide stackable toast system (bottom-center, 15s, dismissible,
  `richColors`) — use it instead of adding another notification mechanism.
- `Callout` (from `@watchborne/electrons`) is the shared inline-message
  component (`default` / `info` / `error` / `warning` / `success` variants),
  used both in the dashboard and on `/login` (e.g. `VerifyOtpForm`'s inline
  error state).

### i18n

All user-facing strings go through `next-intl`. Default locale is **`fr`**;
supported locales are `fr` and `en`. **Locale is part of the URL**, not a
cookie: `i18n/routing.ts` configures `localePrefix: "as-needed"`, so `fr`
(the default) stays unprefixed (`/pricing`) and `en` gets a `/en/...` prefix
(`/en/pricing`). This is a deliberate architecture choice, not incidental —
an earlier cookie-based version of this (`i18n/request.ts` reading a
`NEXT_LOCALE` cookie via `cookies()`) forced every single route to render
dynamically on every request (a Next.js "dynamic API" opts the whole app out
of static generation), which was the direct cause of slow production
navigations. URL-based locale lets Next.js statically generate and CDN-cache
every route again (`generateStaticParams` returning `["fr", "en"]` in every
root layout, plus `setRequestLocale` — called in each layout **and** in every
Server Component page directly under it, since static-render eligibility is
per-segment, not inherited from the layout alone).

`proxy.ts` combines next-intl's own routing middleware (`next-intl/middleware`)
with the Supabase auth gate: `/api/*` and `/auth/*` sit outside `[locale]`
(no prefix) and skip next-intl's routing entirely; everything else goes
through it first, and a redirect from that (URL normalization, e.g. stripping
a redundant `/fr/` prefix) short-circuits immediately, before the auth gate
runs. `localeDetection` is deliberately `false` (see `i18n/routing.ts`'s
comment) — no Accept-Language-based redirect-on-first-visit, since that's bad
for SEO (crawlers don't send a consistent Accept-Language, and redirect-based
content negotiation reads as cloaking). The retired `watch-borne.fr` host is
still redirected (308) to `watch-borne.com` by `proxy.ts`, unprefixed (an
unprefixed path there already means fr, the default locale — no `?lang=`
trick needed any more). The footer's `LocaleSwitcher` switches locale via
next-intl's own navigation APIs (`i18n/navigation.ts`'s `useRouter().replace(
pathname, {locale})`), not a query param. Add keys to **both**
`messages/fr.json` and `messages/en.json`.

**Navigation:** use `Link`, `redirect`, `usePathname`, `useRouter` from
`@/i18n/navigation` (not `next/link` / `next/navigation`) for anything that
links to or navigates another in-app route — they add/strip the locale prefix
automatically. `useSearchParams` is the one exception, still from
`next/navigation` (not locale-related); a page using it needs a `<Suspense>`
boundary around that part to stay statically renderable (see
`app/[locale]/app/charge-points/page.tsx`).

**Translation usage pattern:**

- **Single call per component:** always use `const t = useTranslations("")` (root
  namespace) — never use `useTranslations("some.namespace")`. **Exception:**
  in an `async` Server Component (a page under `(marketing)` that calls
  `setRequestLocale` — see above), use `const t = await getTranslations("")`
  from `next-intl/server` instead — `useTranslations` cannot be called there
  and fails at build time (only in a _sync_ Server/Client Component).
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

Those four checks are packed into **two jobs** — `static-checks` (lint +
`format:check` + typecheck) and `build-and-test` (unit tests + build) — and
those two names are the contexts `main`'s branch protection requires. The
packing is deliberate: **Actions bills per job, rounded up to the whole
minute**, and each check is only seconds of real work behind the same ~15s
`npm ci`, so four jobs billed 5 minutes for 3m18s of compute. Don't split them
back apart for wall clock; two roughly equal halves already keep the run near
its old duration. There is also **no `push: main` trigger** — a `pull_request`
run tests the merge ref, and no deploy chains off main (production is
`workflow_dispatch`, previews are comment-triggered), so it depends on branch
protection's "Require branches to be up to date before merging" staying ON.

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
