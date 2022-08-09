module.exports = {
  testMatch: ['**/+(*.)+(spec|test).+(ts|js)?(x)'],
  resolver: '@nrwl/jest/plugins/resolver',
  coverageReporters: ['text', 'cobertura'],
  moduleFileExtensions: ['ts', 'js', 'mjs', 'html'],
  testEnvironment: 'node',
};
