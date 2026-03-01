import js from "@eslint/js";
import eslintPlugin from "eslint-plugin-eslint-plugin";
import jsdocPlugin from "eslint-plugin-jsdoc";
import pluginNode from "eslint-plugin-n";
import prettierConfig from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";

const config = [
  js.configs.recommended,
  eslintPlugin.configs["flat/recommended"],
  jsdocPlugin.configs["flat/recommended-error"],
  ...pluginNode.configs["flat/mixed-esm-and-cjs"],
  prettierConfig,
  {
    plugins: {
      "eslint-plugin": eslintPlugin,
      jsdoc: jsdocPlugin,
      n: pluginNode,
      prettier: prettierPlugin,
    },
    languageOptions: {
      ecmaVersion: 2026,
      sourceType: "module",
    },
    rules: {
      "prettier/prettier": ["error"],
      "jsdoc/require-jsdoc": ["off"],
      "jsdoc/tag-lines": ["off"], // let prettier-plugin-jsdoc take care of this
    },
  },
];

export default config;
