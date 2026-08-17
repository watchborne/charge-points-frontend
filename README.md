[![Netlify Status](https://api.netlify.com/api/v1/badges/ddc11923-2ec8-4629-b977-dd0f6d39c483/deploy-status)](https://app.netlify.com/projects/watchborne/deploys)

# 🎨 watchborne/frontend app

Next.js dashboard to fetch real-time data on charge points realm.

## 🚀 Installation

1. Ask and set NPM_TOKEN env var:

   ```bash
   export NPM_TOKEN=<token>
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy the example env file and fill in your values (see Configuration below):

   ```bash
   cp .env.example .env
   ```

4. Run the app:
   ```bash
   npm run dev
   ```

- Browse **http://localhost:3001**

## ⚙️ Configuration

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3000/ws
NEXT_PUBLIC_OCPP_SERVER_URL=ws://localhost:9000/ocpp
API_SECRET_KEY=<shared secret, must match the backend's APP_API_KEY>
NEXT_PUBLIC_SUPABASE_URL=<your Supabase project URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your Supabase anon key>
ENABLE_DEV_LOGIN=<optional, local dev only — see below>
SUPABASE_SERVICE_ROLE_KEY=<optional, local dev only — see below>
```

`NEXT_PUBLIC_OCPP_SERVER_URL` is the public-facing OCPP endpoint charge points
dial into, shown as-is on the in-app Configuration page — distinct from
`NEXT_PUBLIC_WS_URL`, which is the dashboard's own status websocket.

The Configuration page also lets an installer self-generate a personal
**commissioning token**: appended as `?token=...` to a charge point's OCPP
connection URL, it lets the backend auto-grant the installer membership on
any unclaimed charge point that connects with it. The plaintext token is
only ever shown once, right after it's (re)generated, and isn't persisted
client-side — losing it means generating a new one.

## 🔐 Authentication

The dashboard (`/app/*`) and its API proxy routes (`/api/*`) are gated behind a
Supabase-backed session (`proxy.ts`); unauthenticated requests are
redirected to `/login`.

1. Create a Supabase project and grab the URL/anon key from
   **Project Settings → API**; set them as `NEXT_PUBLIC_SUPABASE_URL` /
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
2. Enable email OTP sign-in in the Supabase Auth settings (no Redirect URL
   setup needed — sign-in never leaves this app).
3. Sign in from `/login` — Supabase emails a 6-digit code; `LoginForm` sends
   it, then `VerifyOtpForm` verifies it client-side
   (`supabase.auth.verifyOtp({ email, token, type: "email" })`) and
   hard-redirects into `/app/dashboard`. Use the header's logout button to end
   the session.
4. New users request access from `/signup` (like `/login`, an
   already-authenticated visitor is redirected straight to `/app/dashboard`).
   This does **not** create a Supabase user directly — it posts the email to
   the public, unauthenticated `/api/access-requests` proxy route (exempted
   from the session gate in `proxy.ts`), which the backend records
   idempotently. An admin then invites the email from the Supabase dashboard,
   which creates the auth user; `/login`'s `shouldCreateUser: false` admits
   only invited users from then on.

### Skipping the OTP email in local dev

Set **both** `ENABLE_DEV_LOGIN=true` and `SUPABASE_SERVICE_ROLE_KEY` (Project
Settings → API → `service_role`) in your local `.env` to get a "Dev only"
sign-in box on `/login`: `app/auth/dev-login/route.ts` mints an OTP code via
the Supabase admin API and returns it as JSON, and `DevLoginShortcut` feeds it
into `VerifyOtpForm` as `initialCode`, which auto-submits it through the exact
same client-side `verifyOtp` call a real user's browser would make — so you
don't have to check your inbox on every sign-in while developing, without
skipping the real verification path.

This is disabled in production and unless **both** `ENABLE_DEV_LOGIN=true` and
`SUPABASE_SERVICE_ROLE_KEY` are set, so **never** set either variable outside
your local `.env` — the service-role key bypasses Row Level Security, and the
explicit opt-in flag exists so a preview/staging environment that accidentally
has the service-role key set still can't be used to sign in as an arbitrary
email.

## 🌐 Netlify deploy previews

Deploy previews are **on demand** instead of being rebuilt on every push. A
preview is built and deployed by the
[`deploy-preview-netlify`](.github/workflows/deploy-preview-netlify.yml) workflow
only when:

1. A trusted member comments `/deploy` on the pull request, or
2. The pull request is marked **ready for review** (leaves draft state).

### Setup

- In the Netlify UI, **disable automatic Deploy Previews** so previews are built
  only through the workflow.
- Add these repository secrets (Settings → Secrets → Actions):
  - `NETLIFY_AUTH_TOKEN` — a Netlify personal access token.
  - `NETLIFY_SITE_ID` — the site's API ID (Netlify → Site configuration → General).
  - `NPM_TOKEN` — already used by the other workflows, needed for private packages.

## 🚀 Releasing and Netlify production deploys

A production deploy is part of the release pipeline,
[`release`](.github/workflows/release.yml): **Actions → Release → Run
workflow**, one input (`version`, e.g. `1.4.0`). It tags `vX.Y.Z`, creates a
GitHub Release with a changelog generated from Conventional Commits, then
calls `deploy-production-netlify` to build and deploy that exact tag. No
`package.json` version bump, no push to `main` — the git tag alone is the
source of truth.

[`deploy-production-netlify`](.github/workflows/deploy-production-netlify.yml)
is also independently dispatchable via **Actions → Deploy Frontend to
Production (manual) → Run workflow**, one input: `ref` (default `main`) — for
redeploying or rolling back to an already-tagged release without cutting a
new one. The job only runs when triggered against `main` (`if: github.ref ==
'refs/heads/main'`); the `ref` input is checked out and built.

- In the Netlify UI, **disable automatic production deploys** so `main` pushes
  don't also trigger a separate deploy outside this workflow.
- Uses the same `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID`, and `NPM_TOKEN`
  secrets as the preview workflow, scoped to the `production` GitHub
  environment.
