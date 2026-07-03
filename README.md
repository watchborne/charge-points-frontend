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

3. Run the app:
   ```bash
   npm run dev
   ```

- Browse **http://localhost:3001**

## ⚙️ Configuration

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

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
