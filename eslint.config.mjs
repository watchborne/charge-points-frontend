import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
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
      // eslint-plugin-react-hooks v7 (bundled by eslint-config-next) added its
      // React Compiler-alignment rules to the recommended set. This project
      // doesn't use the React Compiler, and both rules flag long-standing,
      // deliberate patterns already used throughout the codebase: mutating a
      // "latest value" ref during render (see the tRef/pushWarningNotificationRef
      // comment in useChargePoints.ts) and calling setState from an effect to
      // sync with an external system (WebSocket messages, fetch-on-mount).
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
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
