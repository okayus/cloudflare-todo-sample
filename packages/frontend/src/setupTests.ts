/**
 * テスト環境セットアップファイル
 * 
 * 全てのテストファイルで使用される共通設定を定義。
 * testing-library/jest-domを import して DOM マッチャーを追加する。
 */
import '@testing-library/jest-dom'
import { vi } from 'vitest'

/**
 * Firebase Auth のモック設定
 * 
 * テスト環境では実際のFirebase認証を使用せず、
 * モックを使用してテストの実行速度とテストの独立性を確保する。
 */
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000/',
    origin: 'http://localhost:3000',
  },
  writable: true,
})

/**
 * Firebase設定に必要な環境変数をテスト環境で設定
 * 
 * 全てのテストで共通して使用されるFirebase環境変数を定義。
 * 各テストファイルで個別に設定する必要がなくなる。
 */
vi.stubEnv('VITE_FIREBASE_API_KEY', 'test-api-key')
vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', 'test-project.firebaseapp.com')
vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project')
vi.stubEnv('VITE_FIREBASE_STORAGE_BUCKET', 'test-project.appspot.com')
vi.stubEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', '123456789')
vi.stubEnv('VITE_FIREBASE_APP_ID', '1:123456789:web:abcdef')
vi.stubEnv('VITE_USE_AUTH_EMULATOR', 'false')
vi.stubEnv('DEV', 'false')