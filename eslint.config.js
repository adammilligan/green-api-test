import boundaries from 'eslint-plugin-boundaries';
import globals from 'globals';
import importPlugin from 'eslint-plugin-import';
import js from '@eslint/js';
import jsdoc from 'eslint-plugin-jsdoc';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

import prettierRecommended from 'eslint-plugin-prettier/recommended';

export default tseslint.config(
  prettierRecommended,
  { ignores: ['dist', 'vite.config.ts'] },
  {
    extends: [
      js.configs.recommended,
      importPlugin.flatConfigs.recommended,
      jsdoc.configs['flat/recommended-typescript-error'],
      ...tseslint.configs.recommended
    ],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      boundaries
    },
    settings: {
      react: { version: 'detect' },
      'import/resolver': { typescript: { alwaysTryTypes: true } },
      'boundaries/include': ['src/**/*'],
      'boundaries/elements': [
        {
          type: 'app',
          pattern: 'app'
        },
        {
          type: 'pages',
          pattern: 'src/pages/*',
          capture: ['page']
        },
        {
          type: 'widgets',
          pattern: 'widgets/*',
          capture: ['widget']
        },
        {
          type: 'features',
          pattern: 'features/*',
          capture: ['feature']
        },
        {
          type: 'entities',
          pattern: 'entities/*',
          capture: ['entity']
        },
        {
          type: 'shared',
          pattern: 'shared/*',
          capture: ['segment']
        }
      ]
    },
    rules: {
      complexity: [2, 9],
      'max-params': [2, 4],
      'max-lines': [2, { max: 350, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': [2, 250],
      'max-nested-callbacks': [2, 4],
      semi: 2,
      'eol-last': 2,
      'no-param-reassign': 2,
      'sort-imports': [
        2,
        {
          ignoreCase: true,
          allowSeparatedGroups: true,
          ignoreDeclarationSort: true
        }
      ],
      'max-len': [2, { code: 130 }],
      'import/extensions': [
        2,
        'never',
        {
          json: 'always',
          css: 'always',
          png: 'always',
          svg: 'always',
          webp: 'always'
        }
      ],
      'import/prefer-default-export': 0,
      'import/no-unresolved': 0,
      'no-console': 2,
      'object-curly-spacing': [2, 'always'],
      'no-plusplus': [2, { allowForLoopAfterthoughts: true }],
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [2, { argsIgnorePattern: '^_' }],
      'no-shadow': 0,
      '@typescript-eslint/no-shadow': 2,
      'react/jsx-filename-extension': [2, { extensions: ['.tsx'] }],
      'react/function-component-definition': [
        2,
        { namedComponents: 'arrow-function' }
      ],
      'react/prop-types': 0,
      'react/self-closing-comp': 2,
      'react-refresh/only-export-components': 0,
      'jsdoc/require-jsdoc': [
        2,
        {
          require: {
            ArrowFunctionExpression: true,
            FunctionDeclaration: true,
            FunctionExpression: true,
            MethodDefinition: true
          }
        }
      ],
      'jsdoc/require-returns': [0],
      'jsdoc/require-param': [0],
      'jsdoc/require-param-description': [0],
      'jsdoc/require-param-type': [0],
      'jsdoc/check-param-names': [0],
      'boundaries/entry-point': [
        2,
        {
          default: 'disallow',
          rules: [
            {
              target: [['shared', { segment: 'lib' }]],
              allow: '*/index.ts'
            },
            {
              target: [['shared', { segment: 'lib' }]],
              allow: '*.(ts|tsx)'
            },
            {
              target: [['shared', { segment: 'config' }]],
              allow: '**'
            },
            {
              target: [['shared', { segment: '(ui|api|types)' }]],
              allow: '**'
            },
            {
              target: ['app', 'pages', 'widgets', 'features', 'entities'],
              allow: 'index.(ts|tsx)'
            }
          ]
        }
      ],
      'boundaries/element-types': [
        2,
        {
          default: 'allow',
          message: '${file.type} is not allowed to import (${dependency.type})',
          rules: [
            {
              from: ['shared'],
              disallow: ['app', 'pages', 'widgets', 'features', 'entities'],
              message:
                'Shared module must not import upper layers (${dependency.type})'
            },
            {
              from: ['entities'],
              message:
                'Entity must not import upper layers (${dependency.type})',
              disallow: ['app', 'pages', 'widgets', 'features']
            },
            {
              from: ['entities'],
              message: 'Entity must not import other entity',
              disallow: [['entities', { entity: '!${entity}' }]]
            },
            {
              from: ['features'],
              message:
                'Feature must not import upper layers (${dependency.type})',
              disallow: ['app', 'pages', 'widgets']
            },
            {
              from: ['features'],
              message: 'Feature must not import other feature',
              disallow: [['features', { feature: '!${feature}' }]]
            },
            {
              from: ['widgets'],
              message:
                'Widget must not import upper layers (${dependency.type})',
              disallow: ['app', 'pages']
            },
            {
              from: ['widgets'],
              message: 'Widget must not import other widget',
              disallow: [['widgets', { widget: '!${widget}' }]]
            },
            {
              from: ['pages'],
              message: 'Page must not import upper layers (${dependency.type})',
              disallow: ['app']
            },
            {
              from: ['pages'],
              message: 'Page must not import other page',
              disallow: [['pages', { page: '!${page}' }]]
            }
          ]
        }
      ]
    }
  },
  {
    files: ['src/features/receive-messages/**/*.{ts,tsx}'],
    rules: {
      complexity: [2, 12]
    }
  }
);
