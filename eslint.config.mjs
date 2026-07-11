import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "import/order": [
        "error",
        {
          groups: [["builtin", "external"], "internal", ["parent", "sibling"]],
          pathGroups: [
            {
              pattern: "@/**",
              group: "internal",
            },
          ],
          pathGroupsExcludedImportTypes: [],
          "newlines-between": "always",
          alphabetize: { order: "asc" },
        },
      ],
    },
  },
  {
    files: ["*.config.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    ignores: [".next/**", "node_modules/**", "dist/**", "out/**", "coverage/**"],
  },
];

export default eslintConfig;
