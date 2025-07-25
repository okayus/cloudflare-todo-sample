/**
 * ESLint設定ファイル
 *
 * 共通パッケージのコード品質を保つための設定。
 * TypeScript strict mode と型安全性を重視。
 */
import parser from '@typescript-eslint/parser';

export default [
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser,
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      // 一般的なコード品質
      'no-console': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
      'no-unused-vars': 'error',
    },
  },
];