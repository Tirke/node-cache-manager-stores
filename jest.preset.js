module.exports = {
  testMatch: ['**/+(*.)+(spec|test).+(ts|js)?(x)'],
  resolver: '@nrwl/jest/plugins/resolver',
  moduleFileExtensions: ['ts', 'js', 'mjs', 'html'],
  coverageReporters: ['html'],
  transform: {
    '^.+\\.[tj]s$': '@swc/jest',
  },
  testEnvironment: 'node',
};
