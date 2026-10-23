# CLAUDE.md

Guidance for AI coding agents working in this repository.

## What this is

`charge-points-frontend` — the **Next.js 16 dashboard** for the watchborne EV
charge-point platform. It renders a marketing site and an authenticated app that
shows charge points and sites in real time, backed by `charge-points-server`.

Stack: **Next.js 16 (App Router)**, React 19, TypeScript (strict),
**Tailwind + shadcn/ui** (Radix primitives), `react-hook-form` + `zod`,
`@tanstack/react-query` for server-state, `next-intl` for i18n, `sonner` for
toast notifications, `recharts` for charts, `@sentry/nextjs` for error
tracking. Dev server runs on **port 3001**. Domain types come from
`@watchborne/charge-points-types`.
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
    (marketing)/          # public site (route group): home, pricing, contact, features (+ features/roadmap: delivered/upcoming timeline)
    app/                  # authenticated dashboard
      dashboard/ sites/    # pages (no local components/ subfolder); dashboard renders
                           #   components/dashboard/ (below)
      profile/             # user profile page: theme toggle (existing ThemeProvider/
                           #   useTheme, also used by the marketing Navbar); components/
                           #   NotificationPreferencesPanel: digest opt-in/out + digest
                           #   send hour (Europe/Paris hour, not converted) + email language (fr/en), GET/PATCH
                           #   /api/me/notification-preferences (charge-points-server
                           #   ADR 0018, 0022)
      configuration/       # page + its own components/ (CommissioningTokenPanel:
                           #   installer self-service OCPP commissioning token)
      firmware-campaigns/  # page + its own components/ (FirmwareCampaignsList,
                           #   FirmwareCampaignDetailModal, CreateFirmwareCampaignDialog,
                           #   FirmwareCampaignStatusBadge + skeleton): fleet-wide firmware
                           #   campaign management (dispatch UpdateFirmware to many charge
                           #   points, track per-station outcome). lib/api-firmware-campaigns.ts
                           #   (api.FirmwareCampaigns) is the client — FirmwareCampaign comes
                           #   from @watchborne/charge-points-types via Wire<> (see lib/wire.ts)
      charge-points/       # page + its own components/ (commissioning dialog/queue/
                           #   checklist, fleet panel — FleetBulkActionBar +
                           #   hooks/useBulkChargePointActions.ts add multi-select
                           #   bulk actions — config dialog, trigger message,
                           #   AlertsPanel: alert history + real-time-alerts opt-in,
                           #   StatusHistoryPanel: connection/connector status timeline,
                           #   SecurityEventsPanel: OCPP SecurityEventNotification history,
                           #   LogUploadPanel/StartLogUploadDialog: remote log/diagnostics
                           #   retrieval via GetLog/GetDiagnostics,
                           #   ChargingSessionsPanel: charging-session history (one row per
                           #   StartTransaction/StopTransaction or TransactionEvent lifecycle,
                           #   charge-points-server's ADR 0012) with a per-session
                           #   SessionConsumptionChart and a per-session estimated cost column
                           #   (ChargingSessionCost, from lib/api-charging-sessions.ts, fetched per
                           #   row and cached by ChargingSessionCostCell, with a
                           #   NO_TARIFF_CONFIGURED reason state when the site has no tariff —
                           #   charge-points-server ADR 0019/0020), on its own "Sessions" tab,
                           #   AlertsPanelContainer wraps AlertsPanel to own the acknowledge
                           #   mutation (api.ChargePoints.acknowledgeAlert),
                           #   DeviceEventsPanel: OCPP 2.0.1 NotifyEvent history, and
                           #   DeviceVariableReportsPanel/RequestDeviceReportDialog:
                           #   NotifyReport history + installer-triggered device report
                           #   requests (GetBaseReport/GetReport) — both rendered in the
                           #   "security" tab for OCPP 2.0.1 stations,
                           #   ChargePointReliabilityTile: 7-day uptime % (main tab),
                           #   ChargePointAlertThresholdsSection: the station's alert
                           #   thresholds (effective values, the level each comes from, edit,
                           #   reset to its site's) on the "alerts" tab, via
                           #   hooks/useChargePointAlertThresholds.ts (charge-points-server
                           #   issue #577; reuses the generic components/alert-thresholds/),
                           #   ChargePointActionsSection: the dedicated "Actions" tab
                           #   (includes, 2.0.1-only, DisplayMessageControl:
                           #   SetDisplayMessage/ClearDisplayMessage alongside
                           #   DisplayMessagesPanel: GetDisplayMessages/NotifyDisplayMessages
                           #   history — moved here from the security tab so the write and
                           #   read sides of display messages sit together),
                           #   ChargePointConnectionUrlDialog: reveals the OCPP connection
                           #   URL, and CertificatesPanel/InstallCertificateDialog/
                           #   DeleteCertificateDialog: charge-point certificate management
                           #   (InstallCertificate/DeleteCertificate/GetInstalledCertificateIds,
                           #   applies to both OCPP dialects — only some certificate types in
                           #   the install dialog are 2.0.1-only — rendered in the "security"
                           #   tab alongside SecurityEventsPanel). ChargePointDetailPanel is
                           #   the tabbed container these render into (tabs: main/actions/
                           #   consumption/sessions/alerts/
                           #   security), and persists the last-viewed tab per browser
                           #   (localStorage key cp-detail-last-tab) as the default on the
                           #   next mount or charge-point switch. It is itself decomposed
                           #   into ChargePointHeaderSection,
                           #   ChargePointMetadataSection, and ConnectorStatusSection. The
                           #   page itself wraps its useSearchParams() usage in Suspense —
                           #   required for static rendering, and also drives status/OCPP
                           #   connector filters off the search params.
                           #   hooks/useChargePointActions.ts centralizes the action
                           #   handlers ChargePointDetailPanel and ChargePointFleetPanel share.
                           #   A deactivated charge point (`isActive: false`) accepts no
                           #   command (charge-points-server answers 409): the Actions tab,
                           #   per-connector controls and the log/certificate/device-report/
                           #   firmware/display-message dialogs take an optional `disabled`
                           #   prop fed from `!chargePoint.isActive`, the Actions tab shows
                           #   an `actionsTab.inactiveNotice` callout, and FleetBulkActionBar
                           #   skips inactive stations (`bulkActions.inactiveSkipped`). A new
                           #   control that sends a station command must honour it too.
      sites/components/    # page-scoped components: SiteFormDialog, SiteCard, SiteGrid,
                           #   SiteGridSkeleton, SiteDeletionDialog, SiteDetail (the
                           #   site detail view, rendered by the dedicated sites/[id]/page.tsx
                           #   route — /app/sites/:id, no longer a modal; the list page just
                           #   navigates there),
                           #   SiteReliabilityValue (7-day uptime %, rendered in
                           #   SiteDetail), SetSiteTariffDialog: configures a site's
                           #   per-kWh tariff (GET/PUT /api/sites/:id/tariff via
                           #   hooks/useSiteTariff.ts + lib/api-site-tariff.ts,
                           #   charge-points-server ADR 0019) from SiteDetail,
                           #   LogSiteVisitDialog: logs a site visit
                           #   (POST /api/sites/:id/visits, charge-points-server ADR 0015)
                           #   from SiteDetail, ScheduleNextVisitDialog: plans/edits/
                           #   cancels a site's next visit (GET/PUT/DELETE
                           #   /api/sites/:id/next-visit, charge-points-server issue #579/
                           #   ADR 0016) from SiteDetail — the proactive counterpart to
                           #   LogSiteVisitDialog's reactive history, and SiteReportExportButton:
                           #   downloads the printable PDF site report from SiteDetail, over a time window the
                           #   user picks (3/7/15/30 days, `REPORT_WINDOW_DAYS`) —
                           #   generated entirely by charge-points-server (ADR 0023, GET
                           #   /api/sites/:id/report.pdf): it reads its own data, draws its
                           #   charts as vectors and writes the file in the dashboard's
                           #   language, so this only calls api.Sites.downloadReport and
                           #   hands the blob to the browser (no client-side PDF/chart
                           #   rasterization any more), and SiteAlertThresholdsSection:
                           #   a site's alert thresholds (offline / connector-unavailable
                           #   grace periods, firmware-stall timeout) on SiteDetail —
                           #   effective values with the level each comes from, edit and
                           #   reset, via hooks/useSiteAlertThresholds.ts (charge-points-
                           #   server issue #577, ADR 0031). Its dialog and summary are the
                           #   generic components/alert-thresholds/ (AlertThresholdsDialog,
                           #   AlertThresholdsSummary), written to be reused for a charge point
      components/         # shared feature + common + layout components
                          #   (common/: ConnectorStatusIcon, WsStatusBadge — app-specific,
                          #   tied to domain types/state; GenericStatusBadge — the
                          #   next-intl lookup around electrons' ColorPill; Tooltip — an
                          #   anchor + provider wrapper over electrons' Tooltip primitive.
                          #   The generic ActionsDropdown, StatusActionDropdown, FormDialog,
                          #   StatsBreakdown and SkeletonGrid now come from
                          #   @watchborne/electrons;
                          #   dashboard/: FleetOverviewPanel + SiteHealth* — the fleet-wide
                          #   site health tile, derived client-side from already-fetched
                          #   charge points (lib/derive-site-health.ts) rather than a
                          #   dedicated API call — FleetReliabilityPanel/FleetReliabilityBadge
                          #   + skeleton: fleet-wide 7-day uptime %, via
                          #   hooks/useFleetReliability.ts + lib/api-fleet-reliability.ts
                          #   (api.FleetReliability, GET /api/charge-points/reliability) and
                          #   lib/fleet-reliability.ts (derive helper) — DashboardOnboarding,
                          #   and DashboardLayoutDialog (configurable/reorderable dashboard
                          #   widget visibility + order, persisted via
                          #   lib/dashboard-layout.ts + hooks/useDashboardLayout.ts);
                          #   charge-points/: ChargePointsBreakdown,
                          #   AlertStatusBadge, FirmwareTimeline, StatusBadge)
      404/                 # dashboard-scoped not-found page
      hooks/              # useChargePoints, useSites, useWebSocket, useWebSocketContext,
                          #   useConsumption, useStatusHistory, useFlipReorder, useSiteVisits,
                          #   useDashboardLayout (widget visibility/order, see dashboard/ above),
                          #   useSiteVisitSchedule, useSiteTariff (see sites/components/
                          #   above), useFleetReliability (see dashboard/ above)
      ws/ws-manager.ts    # singleton WebSocket manager (see below)
    404/                   # top-level not-found page
    login/                 # login page (OTP sign-in)
    signup/                # alpha access-request page (gated, admin-approved)
  app/providers/QueryProvider.tsx  # wraps the dashboard in a TanStack Query
                                    #   QueryClientProvider (see Data access
                                    #   layers below) — note this sits outside
                                    #   [locale], not to be confused with
                                    #   [locale]/app/
  components/layout/Navbar.tsx  # shared Navbar used by both the marketing
                                 #   Navbar and the dashboard Header — imports
                                 #   Link/usePathname from i18n/navigation.ts,
                                 #   not next/link or next/navigation
  components/ToastNotification/  # stackable toast system (wraps sonner's Toaster;
                                  #   bottom-center, 15s, dismissible, richColors)
  api/                   # Next route handlers that PROXY to the backend — outside
                         #   [locale] (no locale prefix; not user-facing pages)
  auth/components/       # LogoutButton, shared by Header and marketing Navbar
  auth/dev-login/        # local-dev-only OTP-code shortcut route
  assets/                # static assets used by app/ components
proxy.ts                # Supabase session refresh, next-intl URL-based locale
                        # routing (via next-intl/middleware), and auth guard for
                        # /app, /login, /signup (not /api — the backend
                        # alone gates it; Next's renamed
                        # middleware.ts file convention as of Next 16). /api and
                        # /auth skip next-intl's routing entirely (they're
                        # outside [locale]); everything else goes through
                        # next-intl's middleware first, and a redirect from
                        # that (URL normalization) short-circuits immediately
                        # before the auth gate runs.
components/ui/          # shadcn/ui pieces that stay in the app (edit via
                        #   components.json): Datepicker (popover + calendar
                        #   wired to useDateFormat/useCalendarLocale) and Form
                        #   (react-hook-form). Everything else shadcn-shaped
                        #   comes from @watchborne/electrons.
lib/                    # http-client, api, api-*, proxy-request, constants
types/                  # mostly thin re-exports of @watchborne/charge-points-types;
                        #   charge-point.ts also extends ChargePointWithConnectors/
                        #   ChargePointWithSite with server-local `commissionedAt`
                        #   (Membership queue/audit state, not in the shared package);
                        #   log-upload.ts is the local response-type surface for the
                        #   remote log/diagnostics feature (api-log-uploads.ts)
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
emails/templates/       # Supabase auth email templates (invite.html, signup.html;
                        #   magic-link.html is unused, kept from the pre-OTP flow)
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
0002). `/api/*` is not gated in `proxy.ts` (issue #349): the backend alone enforces
auth from the forwarded bearer token and answers 401 when there is none. A
public endpoint (e.g. `/api/access-requests`) therefore needs no allowlist
here — a request without a session simply reaches the backend with no token.

- `API_SECRET_KEY` must **never** get a `NEXT_PUBLIC_` prefix, or it leaks into
  the client bundle.
- To add a backend-backed endpoint: create `app/api/<resource>/route.ts` that
  calls `proxyToBackend(request, "/api/<resource>")`, then add a client method in
  `lib/api-*.ts` that hits the local `/api/...` path through `httpClient`.
- An endpoint that answers with a **file** (the site report PDF) uses
  `proxyFileToBackend` instead: it streams the body through untouched (reading
  it as text would corrupt binary) and passes `Content-Type` /
  `Content-Disposition` from the backend, which owns the file's type and name;
  the client side is `httpClient.getFile`, which returns `{ blob, filename }`.
- `proxyToBackend` builds a null-body status (204 from every DELETE, 205, 304)
  with no body at all: `new Response("", { status: 204 })` throws a `TypeError`,
  which would turn a successful delete into a 500 from the proxy.

### Data access layers

- `lib/http-client.ts` — thin `fetch` wrapper (`get/getFile/post/patch/delete`),
  throws on non-2xx.
- `lib/api-charge-points.ts`, `lib/api-sites.ts` — typed API methods, aggregated
  in `lib/api.ts` as `api.ChargePoints` / `api.Sites`. `api.ChargePoints` is itself
  composed in `lib/api.ts` from one client per feature, each owning its own
  request/outcome types: `api-charge-points.ts` (CRUD, release, reset, availability,
  unlock, settings, trigger message), `api-charge-point-alerts.ts`,
  `api-certificates.ts`, `api-charging-sessions.ts`, `api-log-uploads.ts`,
  `api-firmware-updates.ts` and `api-display-message-commands.ts`. Add a new
  charge-point feature as its own module and spread it into `chargePointsApi`, not
  into `api-charge-points.ts`. `lib/api-me.ts`
  (`api.Me.getMe()`) fetches the caller's own scoped charge points via
  `GET /api/me`; `lib/api-access-requests.ts` (`api.AccessRequests.requestAccess`)
  posts an alpha access request from `/signup` (see Authentication below).
  `lib/api-commissioning-token.ts` (`api.CommissioningToken`) proxies
  `GET`/`POST` `/api/me/commissioning-token` for the installer
  self-service commissioning-token flow on `/app/configuration`
  (`CommissioningTokenPanel`) — the plaintext token is only ever returned
  once, on issue, and is never persisted client-side. The token
  expires (90 days by default, server-configurable): both the status and the
  issue response carry `expiresAt`, and an expired token reports
  `hasToken: false` with its past `expiresAt` (the panel shows an expiry
  warning and re-offers "Generate"). The panel also explains the process
  (`howItWorks` steps), and shows how many charge points were commissioned with
  the current token (`useCount`, plus the optional `maxUses` ceiling) and when
  a station last presented it (`lastUsedAt`) from the status response
  (charge-points-server ADR 0029). A token that reached its ceiling reports
  `hasToken: false` with a future `expiresAt`: the panel tells it apart from an
  expired one by its counter and shows a "spent" warning. The optional
  "maximum number of charge points" field (1 to 1000, empty = unlimited) is sent
  as `maxUses` by `issueToken` and applies to the next token generated.
  `lib/api-notification-preferences.ts` (`api.NotificationPreferences`) reads/writes
  `GET`/`PATCH /api/me/notification-preferences` — the caller's own digest
  opt-in/out and preferred digest send hour (a Europe/Paris wall-clock hour), behind
  `NotificationPreferencesPanel` on `/app/profile`
  (charge-points-server ADR 0018). `digestHour` in the response is always a
  resolved 0-23 value, and `locale` (the language of the emails the backend
  sends the caller, ADR 0022) is always a resolved `"fr" | "en"`; the backend
  substitutes its own global default when the caller has never set either, so
  this client never guesses a fallback.
  `lib/api-metering.ts` (`api.Metering`) reads the metering history —
  `getMeterSamples` (the raw time series), `getConsumption` (the window reduced
  per connector/measurand/unit). Its response types are the package's
  `MeterSample`/`MeterSampleSummary`/`ChargePointConsumption` seen through
  `Wire<>` (below), and `isCumulativeRegister` is re-exported from the package. `lib/api-status-history.ts`
  (`api.StatusHistory`) reads the connection/connector status timeline behind
  `StatusHistoryPanel`; `lib/status.ts` / `lib/status-history.ts` hold the
  client-side status-display/derivation helpers it and `ConnectorStatusIcon`
  share. `api.ChargePoints.listChargingSessions` (`lib/api-charging-sessions.ts`)
  reads `GET /api/charge-points/:id/charging-sessions` for
  `ChargingSessionsPanel` — a **shared-package type**
  (`@watchborne/charge-points-types`, added in ADR 0012 §8 once this route
  existed to consume it), so there is no locally-declared response surface
  for it. `lib/api-uptime.ts` (`api.Uptime`) reads
  `GET /api/charge-points/:id/uptime` / `GET /api/sites/:id/uptime` — the
  `onlineMs`/`totalMs` window `ChargePointReliabilityTile` and
  `SiteReliabilityValue` render as a 7-day uptime %. `lib/api-device-events.ts`
  (`api.DeviceEvents.list`) reads `GET /api/charge-points/:id/device-events` —
  the OCPP 2.0.1 `NotifyEvent` history behind `DeviceEventsPanel`.
  `lib/api-device-variable-reports.ts` (`api.DeviceVariableReports`) reads
  `GET /api/charge-points/:id/device-variable-reports` (the `NotifyReport`
  history behind `DeviceVariableReportsPanel`) and also issues the
  `GetBaseReport`/`GetReport` device-report requests `RequestDeviceReportDialog`
  triggers — acknowledgment-only calls whose actual inventory arrives later as
  `NotifyReport` frames the panel picks up on its next fetch. `lib/api-display-messages.ts`
  (`api.DisplayMessages`) reads `GET /api/charge-points/:id/display-message-reports`
  (the `NotifyDisplayMessages` history behind `DisplayMessagesPanel`) and issues the
  unfiltered `GetDisplayMessages` request `requestAll` triggers — same
  acknowledgment-now/data-later shape as the device-report request above. The report
  frames themselves are locally-declared response types, like `Me` above (their backing
  entities are still server-local), built on the shared package where the shapes truly
  match: `VariableV201`, `AttributeTypeV201`, and each display message, which is the
  package's `MessageInfoV201` as is. The device-model `Component` is the exception —
  the API flattens OCPP's nested `evse` into `evseId`/`connectorId`, so it stays local
  and is not `ComponentV201`.
  `api.ChargePoints.setDisplayMessage`/`clearDisplayMessage` (`lib/api-display-message-commands.ts`)
  are the write side (OCPP `SetDisplayMessage`/`ClearDisplayMessage`, 2.0.1-only)
  behind `DisplayMessageControl` — a single fixed message id, since this client has
  no way to discover a station's own ids without `GetDisplayMessages`.
- `lib/derive-site-health.ts` derives the fleet-wide site-health tile
  (`FleetOverviewPanel` + `SiteHealth*`) client-side from charge points already
  fetched by `useChargePoints`, replacing an earlier dedicated
  `GET /api/sites/health` call and its own `useSitesHealth` hook (both removed).
  `lib/derive-site-visit-overdue.ts` (`isSiteVisitOverdue`, rendered as a badge in
  `SiteCard`) is the same derive-client-side pattern, kept in lockstep with the
  backend's own `findOverdueSites` (same 90-day threshold, same
  `lastVisitedAt`/`installedAt` fallback). `lib/api-site-visits.ts` (`api.SiteVisits`,
  `list`/`record`) reads/writes `/api/sites/:id/visits` — the `SiteVisit` history
  behind `useSiteVisits`/`LogSiteVisitDialog` (charge-points-server ADR 0015).
  The same module's `getSchedule`/`scheduleNextVisit`/`cancelNextVisit` read/write
  `/api/sites/:id/next-visit` — a site's planned next visit, one row per site,
  behind `useSiteVisitSchedule`/`ScheduleNextVisitDialog` (charge-points-server
  issue #579, ADR 0016). `SiteVisit` and `SiteVisitSchedule` are the shared
  package's entities, seen through `Wire<>` (below).
- `lib/api-site-tariff.ts` (`api.SiteTariff`, `get`/`set`) reads/writes
  `GET`/`PUT /api/sites/:id/tariff` behind `useSiteTariff`/`SetSiteTariffDialog` —
  a site's configurable per-kWh tariff (charge-points-server ADR 0019), consumed
  by `ChargingSessionsPanel`'s cost column via `ChargingSessionCost`
  (`lib/api-charging-sessions.ts`, ADR 0020), looked up one row at a time by
  `ChargingSessionCostCell` (own `useQuery`, 5 min `staleTime`, never for an `ACTIVE`
  session, a failed lookup reads "Unavailable" rather than a dash) so the list is not
  an N+1 on mount. `SiteTariff` is the shared package's
  entity, seen through `Wire<>` (below).
- Web Push (Desktop/Android; charge-points-server issues #587-590):
  `public/sw.js` is the plain, unbundled service worker (it can't import or read
  `process.env`; the page `postMessage`s it the VAPID public key after
  registering it), and `app/[locale]/app/hooks/usePushSubscription.ts` registers
  it and subscribes the browser using `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (must be the
  same key as the server's `VAPID_PUBLIC_KEY`; unset disables subscribing
  rather than throwing). The opt-in toggle lives on `/app/profile` (with iOS
  install-to-home-screen guidance, backed by `public/manifest.json` + icons for
  PWA installability), and the digest's push channel
  (`NotificationPreferencesPanel`, `digestPushEnabled`, charge-points-server
  ADR 0023) requires a live browser subscription. `lib/api-push-subscriptions.ts`
  (`api.PushSubscriptions`, `subscribe`/`unsubscribe`) sends `navigator.userAgent`
  in the subscribe body, which the backend stores to tell the device type, OS and
  browser version apart (it is in the body, not a header, because the proxy hop
  would otherwise hand the backend the Next server's own User-Agent).
- `lib/api-site-alert-thresholds.ts` (`api.SiteAlertThresholds`, `get`/`update`/`reset`)
  reads/writes `GET`/`PATCH`/`DELETE /api/sites/:id/alert-thresholds` behind
  `useSiteAlertThresholds` — a site's overrides of the time-based alert thresholds
  (offline grace period, connector stuck-unavailable, firmware stall;
  charge-points-server issue #577, ADR 0025). A `null` threshold means "inherit the
  global default"; `update` is a partial body (omitted = untouched, `null` = clear);
  the `effective` thresholds in the `get` envelope are resolved by the backend, never
  guessed here. `SiteAlertThresholds` is the shared package's entity, seen through
  `Wire<>` (below).
- `lib/api-charge-points-alert-thresholds.ts` (`api.ChargePointAlertThresholds`,
  `get`/`update`/`reset`) is the charge point level of the same feature, against
  `GET`/`PATCH`/`DELETE /api/charge-points/:id/alert-thresholds`, behind
  `useChargePointAlertThresholds`. Its `effective` envelope is what the alert sweep
  really applies to the station — own override, else its site's, else the default —
  with the `source` of each value. Saving a site's thresholds invalidates these reads
  (a station without its own override inherits the change).
- `lib/api-fleet-reliability.ts` (`api.FleetReliability`) reads
  `GET /api/charge-points/reliability` — the fleet-wide 7-day uptime % behind
  `FleetReliabilityPanel`/`FleetReliabilityBadge`, distinct from
  `lib/api-uptime.ts`'s per-charge-point/per-site reads above.
  `lib/fleet-reliability.ts` holds the client-side derive helper the panel
  builds on.
- `lib/api-firmware-campaigns.ts` (`api.FirmwareCampaigns`) reads/writes
  `/api/firmware-campaigns` behind the `firmware-campaigns/` page — fleet-wide
  firmware campaign management (dispatch `UpdateFirmware` to many charge points,
  track per-station outcome), charge-points-server ADR 0017.
  `FirmwareCampaign` is the shared package's entity, seen through `Wire<>` (below).
- `lib/api-contact.ts` (`api.Contact.send`) posts the marketing contact form
  (`ContactForm`) to `app/api/contact/route.ts`, which — unlike the proxies above —
  is handled by this app itself: it validates with `lib/contact-message.ts` (zod)
  and emails the message to `CONTACT_EMAIL_TO` (default
  adrien.miquel.pro@gmail.com) through Resend's REST API, using the server-side-only
  `RESEND_API_KEY` and `CONTACT_EMAIL_FROM`. Being public and handled here (not by the
  backend's limiter), it rate-limits itself per client address
  (`lib/rate-limit.ts` + `lib/contact-rate-limit.ts`, in-memory per instance;
  `CONTACT_RATE_LIMIT_MAX` / `CONTACT_RATE_LIMIT_WINDOW_MS`, default 5 / 60s, answers 429).
- `lib/constants.ts` — `API_URL` / `WS_URL` from `NEXT_PUBLIC_*` env, with
  localhost fallbacks.
- `lib/proxy-request.ts` **appends** query parameters rather than setting them, so
  a repeated one survives the hop (`?measurand=A&measurand=B` is how the metering
  reads ask for two series). Keep it that way.
- `lib/api-security-events.ts` (`api.SecurityEvents.list`) reads
  `GET /api/charge-points/:id/security-events` for `SecurityEventsPanel` — the
  station's OCPP `SecurityEventNotification` history. Its response type is the
  shared package's `SecurityEvent` (ADR 0009), seen through `Wire<>` (below).
- `api.ChargePoints.listCertificates`/`installCertificate`/`deleteCertificate`
  (`lib/api-certificates.ts`) back `CertificatesPanel`/`InstallCertificateDialog`/
  `DeleteCertificateDialog` — OCPP `GetInstalledCertificateIds`/
  `InstallCertificate`/`DeleteCertificate` (charge-points-types issue #535)
  proxied through `POST /api/charge-points/:id/certificates/query` and
  `POST`/`DELETE /api/charge-points/:id/certificates`. `ChargePointCertificates`
  and friends are declared locally in `types/certificate.ts`, same server-local
  response-type pattern as `SecurityEvent` above (the backend has no persisted
  certificate entity to re-export a shared type for).
- Copy-to-clipboard goes through `useCopyToClipboard()`
  (`app/[locale]/app/hooks/`): it catches a rejected `navigator.clipboard.writeText`
  with an error toast (`common.copyFailed`) and clears its "copied" timer on re-copy,
  reset and unmount. Used by `ChargePointConnectionUrlDialog` and
  `CommissioningTokenPanel` (the token is shown only once, so a silent failure is
  costly).
- `lib/wire.ts` — `Wire<T>`: a shared-package type as it looks after crossing the
  wire as JSON, i.e. every `Date` is an ISO string. `@watchborne/charge-points-types`
  schemas coerce timestamps to `Date`, but the `lib/api-*.ts` clients hand the parsed
  JSON to the UI as is (timestamps are converted where rendered, see `useDateFormat`),
  so entity types are written `Wire<SharedX>`: derived from the package, so they can't
  drift from the backend's response schema, yet honest about what is actually in memory.
  `NotificationPreferences` has no timestamps and is used as is.
- `lib/command-outcome.ts` — `CommandOutcome<TOk>`, the discriminated
  `{ ok: true } & TOk | { ok: false; httpStatus }` result the request/response
  OCPP command methods (and other calls needing the precise HTTP outcome)
  return instead of throwing; every `XOutcome` type is an alias of it.
- `lib/api-error-wrapper.ts` — the standardized error-handling wrapper the
  `lib/api-*.ts` methods above are built on, so a failed request surfaces a
  consistent shape regardless of which method threw.
- `lib/error-messages.ts` — centralizes the mapping from API error codes/shapes
  to user-facing messages, pulled out of `ChargePointDetailPanel`.
- `lib/queryKeys.ts` — centralizes TanStack Query key construction; `useChargePoints`/
  `useSites` and their mutations build keys from here rather than ad hoc arrays,
  so an invalidation can't drift from the key a query was registered under.
- `app/app/providers/QueryProvider.tsx` wraps the dashboard (`app/[locale]/app/layout.tsx`)
  in a TanStack Query `QueryClientProvider` (plus devtools). `useChargePoints` /
  `useSites` and their create/update/delete flows are `useQuery` / `useMutation`
  hooks built on top of the `lib/api-*.ts` methods above, not manual
  fetch-then-`useState`/`useEffect` — invalidate the relevant query key after a
  mutation rather than refetching by hand.

### Real-time WebSocket

`app/[locale]/app/ws/ws-manager.ts` is a **per-URL singleton** (`getWebSocketManager`)
that owns the connection: reference counting, a disconnect grace period, and
exponential-backoff auto-reconnect with equal jitter (half the backoff is
guaranteed, half randomized, to avoid every dashboard reconnecting in lockstep
after a shared server blip). Reconnection gives up after 10 consecutive
attempts, setting a terminal `"ERROR"` status and turning off auto-reconnect —
a fresh `subscribe()` or a manual `reconnect()` call resets the attempt count
and can bring it back. Components consume it through the `useWebSocket(url)`
hook — do not construct `new WebSocket` directly in components. Prefer
`useWebSocketContext` for shared dashboard state.

### Authentication (Supabase OTP)

- Sign-in is passwordless: `/login` calls `supabase.auth.signInWithOtp` to
  email a 6-digit code; there is no password flow and no magic link.
  `LoginForm` sends the code; once that succeeds, `app/[locale]/login/page.tsx` renders
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
  file-convention rename), then gates `/app/*` behind a valid session
  (redirecting to `/login`) and bounces signed-in visitors off `/login` and
  `/signup`. `/api/*` is deliberately **not** gated here: `getUser()`
  revalidates against Supabase Auth on every call (~400–530 ms), and the
  backend re-verifies the same JWT anyway, resolving the caller's
  `AccessScope` and failing closed with 401 (charge-points-server ADR 0002,
  issue #349) — one authority, not two. The Supabase session lookup
  (`getUser()`, a network round trip) only runs for the authenticated page
  surface (`/app`, `/login`, `/signup`); public marketing pages and `/api/*`
  skip it entirely. There is no `app.*` subdomain routing — `/app/*` is served at that
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
  round-trip; `app/[locale]/login/components/DevLoginShortcut.tsx` fetches it and
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
- `app/[locale]/signup/` is a public alpha-access-request page alongside `/login`; like
  `/login`, an already-authenticated visitor is redirected to `/app/dashboard`.
  It does **not** create a Supabase user directly — it POSTs the visitor's
  email via `api.AccessRequests.requestAccess` to the public, unauthenticated
  `app/api/access-requests/route.ts` proxy (idempotent on email backend-side).
  Approval happens out-of-band: an admin invites the email from the Supabase
  dashboard, which is what actually creates the auth user — `/login`'s
  `shouldCreateUser: false` then naturally admits only invited users.

### UI

Most UI primitives (`Button`, `Badge`, `Input`, `Textarea`, `Label`, `Switch`, `Tabs`,
`Table`, `Collapsible`, `Callout`, `Tag`, `Loader`, `Skeleton`, `StatCard`, `Tooltip`,
`Dialog`, `AlertDialog`, `Popover`, `DropdownMenu`, `Select`, `Command`, `Calendar`,
`ActionsDropdown`, `StatusActionDropdown`, `FormDialog`, `StatsBreakdown`, `SkeletonGrid`)
come from `@watchborne/electrons`, the shared watchborne component library —
import them from there rather than redefining or re-copying them locally.
A `Button` that triggers an async action takes `loading` (spinner, disabled,
`aria-busy`) rather than a hand-placed `Loader2`; hide the button's own icon while
it is loading, since the spinner is added, not swapped.
Dates are formatted with `useDateFormat` (`lib/date-format.ts`), never with ad hoc
`Intl`/`toLocale*`/`date-fns`/`useFormatter().dateTime` calls: it follows the
language of the UI (`fr` `08/10/2026 14:05`, `en` `10/08/2026, 02:05 PM`), in the
browser's local time. Numbers and currency still go through next-intl's `useFormatter`.
`DialogContent`, `CommandDialog` and `FormDialog` take a `closeLabel` for the close
button's screen-reader text (default `"Close"`); pass a translated string
(`t("common.close")`) where the dialog is user-facing. `ActionsDropdown`'s default
icon-only trigger takes its accessible name from `triggerLabel` the same way. Only the app-specific `Datepicker` and `Form` still live in
`components/ui/*`; shadcn config is in `components.json`, regenerate with the
shadcn CLI rather than hand-editing generated files. Style with Tailwind and the tokens from
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
NEXT_PUBLIC_VAPID_PUBLIC_KEY=                     # optional; Web Push VAPID public key (same as server's)
API_SECRET_KEY=<shared secret>                    # SERVER-SIDE ONLY (x-api-key)
RESEND_API_KEY=                                   # SERVER-SIDE ONLY, contact form email (optional CONTACT_EMAIL_FROM / CONTACT_EMAIL_TO)
NEXT_PUBLIC_SUPABASE_URL=<project url>            # Supabase Auth (public)
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>          # Supabase Auth (public)
ENABLE_DEV_LOGIN=                                 # optional, LOCAL DEV ONLY (dev-login shortcut opt-in)
SUPABASE_SERVICE_ROLE_KEY=                        # optional, LOCAL DEV ONLY (dev-login shortcut)
NEXT_PUBLIC_SENTRY_DSN=                           # optional; unset disables Sentry entirely
NEXT_PUBLIC_SENTRY_ENVIRONMENT=                   # optional, overrides NODE_ENV as the Sentry "environment" tag
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=            # optional, 0-1 (default 1), Sentry tracing sample rate
SENTRY_ORG=                                       # optional, CI/build only (source map upload)
SENTRY_PROJECT=                                   # optional, CI/build only (source map upload)
SENTRY_AUTH_TOKEN=                                # optional, CI/build only, secret (source map upload)
```

`NEXT_PUBLIC_*` values are exposed to the browser; anything secret (like
`API_SECRET_KEY` and `SUPABASE_SERVICE_ROLE_KEY`) must stay unprefixed. The
Supabase anon key is public by design (Row Level Security governs access), so
it is `NEXT_PUBLIC_`. `NEXT_PUBLIC_OCPP_SERVER_URL` and the Supabase values are
centralized in `lib/constants.ts` and consumed only through
`lib/supabase/{client,server,middleware}.ts`. `NEXT_PUBLIC_SENTRY_DSN` wires
Sentry error reporting and Web Vitals via `instrumentation.ts` /
`instrumentation-client.ts` / `sentry.*.config.ts`; leaving it unset disables
Sentry rather than erroring (the local dev default). `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE`
(parsed by `lib/sentry-sample-rate.ts`, falls back to 1 on a blank/invalid value)
tunes the tracing sample rate. `app/global-error.tsx` reports React rendering
errors that escape every other boundary to Sentry. Errors the app catches and
handles (a failed load, the WebSocket, push subscription, the contact form) go
through `reportError(error, context)` (`lib/report-error.ts`: `Sentry.captureException`
with a `context` tag, plus a console log outside production) — never a bare
`console.error`; query hooks use `useReportQueryError` for a query's `error`. `SENTRY_ORG` /
`SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` are only used at build time to upload
source maps so stack traces resolve to original TypeScript. See `.env.example`.

## Coding conventions

### Generic

- Import domain types from `@watchborne/charge-points-types` (re-exported via
  `types/`), never redefine `ChargePoint` / `Site` shapes locally.

### Code comments

Comments state what the code does not: a rule, an invariant, why a
non-obvious choice holds. Keep them factual and true of the code as it is now.

- **No history.** Don't narrate how the code got here ("now", "no longer",
  "used to", "first PR"), past bugs or abandoned workarounds. That belongs in
  the commit message and the PR.
- **No ADR or issue references** (here or in `charge-points-server`) unless
  the reader needs that document to understand the code. Restate the rule
  instead.
- **Document a shared rule once**, where it lives, and don't repeat it on every
  file that follows it. For example, the `setRequestLocale` rule is in
  `app/[locale]/(marketing)/page.tsx`, and the `CommandOutcome` rationale is in
  `lib/command-outcome.ts`.
- A test comment explains why the case matters, not what the assertion already
  says.

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
- `vi.mock` targets resolve the `@/*` alias (`vitest.config.ts` sets
  `resolve.tsconfigPaths`), so alias and relative targets both intercept. Use
  `vi.hoisted` for a mock a `vi.mock` factory references.
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
