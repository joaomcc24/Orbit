const baseConfig = require('./jest.config.cjs');

module.exports = {
  ...baseConfig,
  testRegex: 'test/.*\\.integration-spec\\.ts$',
  testPathIgnorePatterns: [],
  collectCoverageFrom: [],
};
