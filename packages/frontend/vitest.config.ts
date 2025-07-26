/**
 * Vitest設定ファイル
 * 
 * Viteベースのテストランナー設定。
 * React Testing Library、Firebase のモック設定、
 * Vitest Browser Mode 対応を含む。
 */
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    // デフォルトはjsdom（高速なユニットテスト用）
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    globals: true,
    
    // テスト分離と干渉防止設定
    isolate: true, // テストファイル間の完全分離
    pool: 'forks', // プロセス分離で実行
    poolOptions: {
      forks: {
        singleFork: false, // 並列実行を有効化
      },
    },
    
    // タイムアウト設定
    testTimeout: 10000, // 10秒
    hookTimeout: 10000, // beforeEach/afterEach用
    
    // Browser Mode設定（統合テスト用）
    browser: {
      enabled: false, // デフォルトは無効、必要に応じて有効化
      name: 'chromium',
      provider: 'playwright',
      // Reactコンポーネントテスト用の設定
      headless: true,
      screenshotFailures: true,
    },
    
    // モジュールキャッシュの管理
    clearMocks: true, // 各テスト後にモックをクリア
    restoreMocks: true, // 元の実装を復元
    unstubEnvs: true, // 環境変数スタブをクリア
  },
  define: {
    // Firebase needs this for proper initialization
    global: 'globalThis',
  },
})