import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // テストファイルのパターン
    include: ['src/**/*.{test,spec}.{js,ts}'],
    
    // テスト環境設定
    environment: 'node', // Cloudflare Workers環境はNode.js寄り
    
    // グローバル設定
    globals: true,
    
    // カバレッジ設定
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'src/**/*.d.ts',
        'src/**/*.config.{js,ts}',
        'worker-configuration.d.ts',
        '.wrangler/**',
      ],
      // カバレッジ閾値（学習用プロジェクトのため段階的に上げる）
      thresholds: {
        global: {
          branches: 50,
          functions: 50,
          lines: 50,
          statements: 50,
        },
      },
    },
    
    // テストタイムアウト設定
    testTimeout: 10000, // 10秒
    hookTimeout: 10000,
    
    // 並列実行設定
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
      },
    },
    
    // モックファイルの場所
    setupFiles: [],
    
    // テスト実行前の設定
    globalSetup: [],
  },
  
  // ESBuild設定（TypeScript対応）
  esbuild: {
    target: 'es2022',
  },
});