// eslint.config.js
export default [
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        // Define your global variables here
        window: "readonly",
        document: "readonly",
        // Add other globals as needed
      },
    },
    rules: {
      // Add ESLint's recommended rules here
      // For example:
      "no-unused-vars": "warn",
      "no-console": "off",
      // Add other rules as needed
    },
  },
];
