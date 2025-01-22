import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    // extends: [
    //   'standard',
    //   'airbnb-base',
    //   'plugin:prettier/recommended',
    //   'prettier',
    // ],
    eslintIgnore: [
      'node_modules',
      'dist',
      'docs',
      'coverage',
      '.yarn',
      '.husky',
      '.vscode',
    ],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    exclude: ['**/node_modules/**'],
    rules: {
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'import/prefer-default-export': 'off',
      'no-underscore-dangle': 'off',
      'no-param-reassign': ['error', { props: false }],
    },
  },
];
