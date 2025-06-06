module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testMatch: ['**/context/**/*.test.js', '**/context/**/*.spec.js'],
  setupFilesAfterEnv: ['<rootDir>/context/tests/setup.js'],
};
