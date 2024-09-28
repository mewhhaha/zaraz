import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react/configs/recommended.js";
import jsx from "eslint-plugin-react/configs/jsx-runtime.js";
import globals from "globals";
import a11y from "eslint-plugin-jsx-a11y";
import tailwind from "eslint-plugin-tailwindcss";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  react,
  jsx,
  a11y.flatConfigs.recommended,
  ...tailwind.configs["flat/recommended"],
  {
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    ignores: ["!**/.server", "!**/.client"],
  },
  {
    settings: {
      tailwindcss: {
        callees: ["cx", "clsx", "className"],
        config: "./tailwind.config.ts",
      },
      react: {
        version: "detect",
      },
      formComponents: ["Form"],
      linkComponents: [
        { name: "Link", linkAttribute: "to" },
        { name: "NavLink", linkAttribute: "to" },
      ],
      "import/internal-regex": "^~/",
      "import/resolver": {
        typescript: {},
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
);
