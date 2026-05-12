import globals from 'globals';
import mochaPlugin from 'eslint-plugin-mocha';
import stylistic from '@stylistic/eslint-plugin';
import js from '@eslint/js';

export default [
  {
    ignores: ['dist/'],
  },
  {
    files:           ['**/*.mjs'],
    languageOptions: {
      sourceType: 'module',
    },
  },
  {
    languageOptions: {
      globals: globals.node,
    },
  },
  mochaPlugin.configs.recommended,
  js.configs.recommended,
  stylistic.configs.customize({
    semi: true,
  }),
  {
    rules: {
      '@stylistic/multiline-ternary': 'off',
      '@stylistic/key-spacing':       [
        'error',
        {
          align: 'value',
        },
      ],
    },
  },
];
