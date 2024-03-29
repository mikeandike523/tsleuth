// eslint-disable-next-line no-undef
module.exports = {
  extends: [
    'plugin:react/recommended',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  plugins: ['react', 'react-hooks', 'tsdoc'],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    'no-empty-pattern': 'off',
    'react/react-in-jsx-scope': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'off',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'after-used',
        argsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],
    'tsdoc/syntax': 'warn',
    '@typescript-eslint/ban-types': ['warn', { types: { object: false } }],
  },
};
