module.exports = {
  testMatch: ['**/+(*.)+(spec|test).+(ts|js)?(x)'],
  resolver: '@nx/jest/plugins/resolver',
  coverageReporters: ['text', 'cobertura', 'html'],
  moduleFileExtensions: ['ts', 'js', 'mjs', 'html'],
  testEnvironment: 'node',
}
