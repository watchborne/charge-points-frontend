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

## 📦 Deployment

### Deployment preview

Commenting `/deploy` on PR

### Production deployyment

Adding label `deploy` to the PR
