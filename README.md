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
API_SECRET_KEY=<shared secret, must match the backend's APP_API_KEY>
NEXT_PUBLIC_SUPABASE_URL=<your Supabase project URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your Supabase anon key>
```

## 🔐 Authentication

The dashboard (`/app/*`) and its API proxy routes (`/api/*`) are gated behind a
Supabase-backed session (`middleware.ts`); unauthenticated requests are
redirected to `/login`.

1. Create a Supabase project and grab the URL/anon key from
   **Project Settings → API**; set them as `NEXT_PUBLIC_SUPABASE_URL` /
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
2. Enable email magic-link sign-in in the Supabase Auth settings.
3. Add `http://localhost:3001/auth/callback` (and the equivalent production
   URL) to the project's Auth **Redirect URLs**.
4. Sign in from `/login` — Supabase emails a magic link that hits
   `app/auth/callback/route.ts`, which exchanges the code for a session and
   redirects into `/app/dashboard`. Use the header's logout button to end the
   session.

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

## 🚀 Netlify production deploys

Production deploys are **manual and on-demand**, not triggered by pushes to
`main`. Run the
[`deploy-production-netlify`](.github/workflows/deploy-production-netlify.yml)
workflow via **Actions → Deploy Frontend to Production (manual) → Run workflow**,
optionally overriding the `ref` to deploy (defaults to `main`).

- In the Netlify UI, **disable automatic production deploys** so `main` pushes
  don't also trigger a separate deploy outside this workflow.
- Uses the same `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID`, and `NPM_TOKEN`
  secrets as the preview workflow, scoped to the `production` GitHub
  environment.
