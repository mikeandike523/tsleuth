export const exports ={
    parser: '@typescript-eslint/parser',
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:prettier/recommended'
    ],
    plugins:[
      'tsdoc'
    ],
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: 'module'
    },
    rules: {
      // Add any custom rules if needed
      'prettier/prettier': 'off',
      'tsdoc/syntax': 'warn',
    }
  };