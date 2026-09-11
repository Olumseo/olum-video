// Shared flat ESLint config for every app and package in the repo.
// Apps extend it so lint rules are defined once and cannot drift per app.

import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default tseslint.config(
  { ignores: ["dist", "node_modules", ".turbo"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      // The generated API client is committed; never hand-edit it.
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/api-client/src/generated/*"],
              message: "Import from @olum-video/api-client, not the generated files directly.",
            },
          ],
        },
      ],
    },
  },
);
