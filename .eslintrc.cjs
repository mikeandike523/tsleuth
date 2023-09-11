// eslint-disable-next-line no-undef
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  plugins: ['tsdoc', 'import', 'no-relative-import-paths'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  rules: {
    '@typescript-eslint/no-unused-vars': 'warn',
    'prettier/prettier': 'off',
    'tsdoc/syntax': 'warn',
    'import/no-relative-parent-imports': 'warn',
    'import/order': [
      'warn',
      {
        groups: ['builtin', 'external', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
    'no-unused-vars': [
      'warn',
      {
        vars: 'all',
        args: 'after-used',
        ignoreRestSiblings: false,
        varsIgnorePattern: '^_',
      },
    ],
    'no-relative-import-paths/no-relative-import-paths': [
      'warn',
      {
        allowSameFolder: false,
        rootDir: 'src',
        prefix: '<^w^>',
      },
    ],
  },
};
