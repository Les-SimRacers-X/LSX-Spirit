module.exports = {
  env: {
    node: true,
    es2022: true,
    jest: true,
  },
  extends: ["@eslint/js/recommended", "prettier"],
  plugins: ["prettier"],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
  },
  rules: {
    "prettier/prettier": "error",
    "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "no-console": "warn",
    "prefer-const": "error",
  },
  ignorePatterns: ["node_modules/", "dist/", "*.min.js"],
}
