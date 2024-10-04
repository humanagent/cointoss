export default [
  {
    languageOptions: {
      ecmaVersion: "latest", // Ensure this is compatible with your codebase
      sourceType: "module", // Use "script" if not using ES modules
      globals: {
        window: "readonly", // Define global variables as needed
        document: "readonly",
        // Add other globals as needed
      },
    },
    rules: {
      "no-unused-vars": "off", // Disable warnings for unused variables
      "no-console": "off", // Allow console statements
      // Add other rules as needed
    },
  },
];
