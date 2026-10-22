import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// jsdom costs ~0.7s per test file, so only files that touch the DOM or browser
// storage get it. Everything else (API clients, route handlers, proxy, pure
// helpers) runs in the plain node environment.
const NEEDS_DOM = [
  "lib/__tests__/dashboard-layout.test.ts",
  "lib/__tests__/date-format.test.ts",
  "lib/__tests__/http-client.test.ts",
  "lib/__tests__/safe-local-storage.test.ts",
  "lib/supabase/__tests__/ensure-session.test.ts",
];
const NODE_ONLY = [
  "lib/**/__tests__/**/*.test.{ts,tsx}",
  "app/api/**/__tests__/**/*.test.{ts,tsx}",
  "proxy/**/__tests__/**/*.test.{ts,tsx}",
  "i18n/**/__tests__/**/*.test.{ts,tsx}",
];

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    reporters:
      process.env.GITHUB_ACTIONS === "true"
        ? [
            "tree",
            [
              "github-actions",
              {
                onWritePath: (path) => path.replace(/^\/app\//, `${process.env.GITHUB_WORKSPACE}/`),
              },
            ],
          ]
        : ["tree"],
    exclude: ["**/node_modules/**", "**/dist/**"],
    projects: [
      {
        extends: true,
        test: {
          name: "node",
          environment: "node",
          include: NODE_ONLY,
          exclude: ["**/node_modules/**", "**/dist/**", ...NEEDS_DOM],
        },
      },
      {
        extends: true,
        test: {
          name: "jsdom",
          environment: "jsdom",
          include: ["**/__tests__/**/*.test.{ts,tsx}"],
          exclude: ["**/node_modules/**", "**/dist/**", ...NODE_ONLY],
        },
      },
      {
        extends: true,
        test: { name: "jsdom-lib", environment: "jsdom", include: NEEDS_DOM },
      },
    ],
  },
});
