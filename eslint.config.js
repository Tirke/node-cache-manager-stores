const { FlatCompat } = require('@eslint/eslintrc')
const js = require('@eslint/js')
const nxEslintPlugin = require('@nx/eslint-plugin')
const eslintPluginImport = require('eslint-plugin-import')

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
})

module.exports = [
  {
    plugins: {
      '@nx': nxEslintPlugin,
      import: eslintPluginImport,
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [],
          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
    },
  },
  ...compat.config({ extends: ['plugin:@nx/typescript', 'plugin:import/typescript'] }).map((config) => ({
    ...config,
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      ...config.rules,
      'no-multiple-empty-lines': 'error',
      'no-else-return': 'error',
      'no-unneeded-ternary': 'error',
      'no-return-await': 'error',
      'no-trailing-spaces': 'error',
      'prefer-const': 'error',
      'template-curly-spacing': 'error',
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']],
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
          'newlines-between': 'always',
        },
      ],
      'no-extra-semi': 'error',
    },
  })),
  ...compat.config({ extends: ['plugin:@nx/javascript'] }).map((config) => ({
    ...config,
    files: ['**/*.js', '**/*.jsx'],
    rules: {
      ...config.rules,
      'no-extra-semi': 'error',
    },
  })),
  { ignores: ['**/dist', '**/node_modules', 'node_modules/'] },
]
