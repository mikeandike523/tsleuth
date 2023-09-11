export const exports ={
    parser: '@typescript-eslint/parser',
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:prettier/recommended'
    ],
    plugins:[
      'tsdoc',
      'import'
    ],
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: 'module'
    },
    rules: {
      'prettier/prettier': 'off',
      'tsdoc/syntax': 'warn',
      "import/no-relative-parent-imports": "warn",
      "import/order": ["warn", {
        "groups": ["builtin", "external", "parent", "sibling", "index"],
        "newlines-between": "always",
        "alphabetize": {
          "order": "asc",
          "caseInsensitive": true
        }
      }],
      "no-unused-vars": ["warn", { "vars": "all", "args": "after-used", "ignoreRestSiblings": false, "varsIgnorePattern": "^_" }]
    } 
  };