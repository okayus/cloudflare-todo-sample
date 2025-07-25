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
    
    // Browser Mode設定（統合テスト用）
    browser: {
      enabled: false, // デフォルトは無効、必要に応じて有効化
      name: 'chromium',
      provider: 'playwright',
      // Reactコンポーネントテスト用の設定
      headless: true,
      screenshotOnFailure: true,
    },
  },
  define: {
    // Firebase needs this for proper initialization
    global: 'globalThis',
  },
})