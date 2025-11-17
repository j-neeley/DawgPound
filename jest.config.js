module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/frontend/',
    '/backend/',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/frontend/',
    '/backend/',
  ],
};
