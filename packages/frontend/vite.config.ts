import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  css: {
    postcss: './postcss.config.js',
  },
  build: {
    // Minification設定 - esbuildを使用（高速かつ効率的）
    minify: 'esbuild',
    
    // CSS minification - esbuildで統一
    cssMinify: 'esbuild',
    
    // ソースマップ制御 - 本番環境では隠しマップ（デバッグ可能だが参照されない）
    sourcemap: mode === 'production' ? 'hidden' : true,
    
    // ターゲットブラウザ - モダンブラウザ対象
    target: 'esnext',
  },
  esbuild: {
    // 本番環境でconsole.log等を削除（セキュリティ向上）
    // drop設定でより確実にconsole文を削除
    ...(mode === 'production' && {
      drop: ['console', 'debugger'],
    }),
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    globals: true,
  },
  define: {
    // Firebase needs this for proper initialization
    global: 'globalThis',
  },
}))