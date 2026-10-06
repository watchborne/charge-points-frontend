import { defineConfig, devices } from "@playwright/test";

const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}`;
const isCI = !!process.env.CI;

// "Full stack" runs (nightly workflow) point the app at a real backend and a real
// local Supabase, whose URLs/keys come from the environment — nothing is faked.
// They also need `next dev`: /auth/dev-login (the OTP shortcut the specs sign in
// with) answers 404 under NODE_ENV=production.
const isFullStack = process.env.E2E_FULL_STACK === "true";

// Supabase is never reached by the "frontend only" specs: browser-side calls are
// intercepted with `page.route`, and the proxy's server-side `getUser()` has no
// session cookie to validate. A throwaway local URL keeps the app booting
// without real credentials.
const FAKE_SUPABASE_URL = "http://127.0.0.1:54321";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: BASE_URL,
    locale: "fr-FR",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      testIgnore: "**/full-stack/**",
      use: {
        ...devices["Desktop Chrome"],
        // Lets a sandbox with a pre-installed browser skip `playwright install`.
        launchOptions: {
          executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
        },
      },
    },
    {
      name: "full-stack",
      testMatch: "**/full-stack/**/*.spec.ts",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
        },
      },
    },
  ],
  // One dev/start server serves both projects.
  webServer: {
    // CI runs against the production build (`npm run build` happens first);
    // locally the dev server is faster to start and picked up if already running.
    command: isCI && !isFullStack ? "npm run start -- -p 3001" : "npm run dev",
    url: BASE_URL,
    reuseExistingServer: !isCI,
    timeout: 120_000,
    env: isFullStack
      ? { ENABLE_DEV_LOGIN: "true" }
      : {
          NEXT_PUBLIC_API_URL: "http://localhost:3000",
          NEXT_PUBLIC_WS_URL: "ws://localhost:3000/ws",
          NEXT_PUBLIC_SUPABASE_URL: FAKE_SUPABASE_URL,
          NEXT_PUBLIC_SUPABASE_ANON_KEY: "e2e-anon-key",
          API_SECRET_KEY: "e2e-secret",
        },
  },
});
