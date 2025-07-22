import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

/** @type {import('eslint').Linter.Config[]} */
export default tseslint.config(
  // グローバル除外設定
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '.wrangler/**',
      'worker-configuration.d.ts', // wranglerが生成するファイル
      '*.config.js',
      '*.config.mjs',
      '*.config.ts',
      'coverage/**',
    ],
  },

  // JavaScript推奨設定
  js.configs.recommended,

  // TypeScript推奨設定
  ...tseslint.configs.recommended,

  // 全ファイル共通設定
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        // Cloudflare Workers Runtime globals
        addEventListener: 'readonly',
        fetch: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        Headers: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        crypto: 'readonly',
        btoa: 'readonly',
        atob: 'readonly',
        caches: 'readonly',
        AbortController: 'readonly',
        AbortSignal: 'readonly',
        ReadableStream: 'readonly',
        WritableStream: 'readonly',
        TransformStream: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
      },
    },
    plugins: {
      prettier: prettier,
    },
    rules: {
      // コード品質
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-unused-vars': 'off', // TypeScriptで管理
      
      // Cloudflare Workers対応
      'no-restricted-globals': [
        'error',
        {
          name: 'window',
          message: 'window is not available in Cloudflare Workers runtime',
        },
        {
          name: 'document',
          message: 'document is not available in Cloudflare Workers runtime',
        },
        {
          name: 'localStorage',
          message: 'localStorage is not available in Cloudflare Workers runtime',
        },
      ],
      
      // Prettier連携
      'prettier/prettier': 'error',
    },
  },

  // TypeScriptファイル専用設定
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { 
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error', // any型禁止
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-inferrable-types': 'off',
    },
  },

  // テストファイル用設定（ルール緩和）
  {
    files: ['**/*.test.ts', '**/*.spec.ts'],
    rules: {
      'no-console': 'off', // テストでconsole.logを許可
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },

  // Prettier設定を最後に適用（競合回避）
  prettierConfig,
);