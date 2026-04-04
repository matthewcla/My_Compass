// Extends the base Jest config with a security-instrumented setup layer.
// Used by the IAST CI workflow to detect PII exposure at runtime.
// Run with: npm run test:security  (jest --config=jest.security.config.js --runInBand --detectOpenHandles)

const baseConfig = require("./jest.config");

module.exports = {
  ...baseConfig,
  setupFilesAfterEnv: [
    ...(baseConfig.setupFilesAfterEnv || []),
    "<rootDir>/__tests__/security/securitySetup.ts",
  ],
};
