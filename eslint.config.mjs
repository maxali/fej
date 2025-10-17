// @ts-check
import { defineConfig } from "eslint/config";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-plugin-prettier";
import eslintConfigPrettier from "eslint-config-prettier";

export default defineConfig([
  // Global ignores
  {
    ignores: [
      "**/dist",
      "**/docs",
      "**/node_modules",
      "**/coverage",
      "**/*.config.ts",
      // NOTE: Don't ignore *.config.js since eslint.config.mjs would be ignored
      // Only ignore specific config files if needed:
      "**/tsup.config.ts",
      "**/vitest.config.ts",
    ],
  },

  // Base ESLint recommended rules
  eslint.configs.recommended,

  // TypeScript ESLint recommended rules
  ...tseslint.configs.recommended,

  // TypeScript ESLint type-checked rules
  ...tseslint.configs.recommendedTypeChecked,

  // Main configuration for TypeScript files
  {
    files: ["**/*.ts", "**/*.tsx"],

    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: "latest",
      sourceType: "module",

      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },

    plugins: {
      prettier,
    },

    rules: {
      // Prettier integration
      "prettier/prettier": "error",

      // TypeScript specific rules
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/explicit-function-return-type": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],

      // General rules
      "no-console": [
        "warn",
        {
          allow: ["warn", "error"],
        },
      ],
    },
  },
  // Prettier config to disable conflicting rules (must be last)
  eslintConfigPrettier,
]);
