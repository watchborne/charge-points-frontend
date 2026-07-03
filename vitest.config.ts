import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
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
