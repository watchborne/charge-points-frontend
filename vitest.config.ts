import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
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
  },
});
