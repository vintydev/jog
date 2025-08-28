module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "google",
    "plugin:@typescript-eslint/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["tsconfig.json", "tsconfig.dev.json"],
    sourceType: "module",
  },
  ignorePatterns: [
    "**/node_modules/**",
    "lib/**",
    "generated/**", // Ignore generated files
    "**/*.d.ts",
  ],
  plugins: [
    "@typescript-eslint",
    "import",
  ],
  rules: {
    "max-len": ["error", {code: 500}],
    "quotes": ["error", "double"],
    "import/no-unresolved": 0,
    "indent": ["error", 2],
    "@typescript-eslint/no-unused-vars": ["warn", {argsIgnorePattern: "^_"}],
    "@typescript-eslint/explicit-module-boundary-types": "off",
  },
};
