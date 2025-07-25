/**
 * Firebase設定のテスト
 *
 * Firebase初期化とAuth設定が適切に行われることを検証する。
 * TDD手法に従い、まずテストを作成してから実装を進める。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// モック設定
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({ name: '[DEFAULT]' })),
  getApps: vi.fn(() => []),
  getApp: vi.fn(() => ({ name: '[DEFAULT]' })),
}))

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ 
    app: { name: '[DEFAULT]' },
    currentUser: null,
  })),
  connectAuthEmulator: vi.fn(),
}))

describe('Firebase設定', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // 環境変数をクリア
    delete process.env.VITE_FIREBASE_API_KEY
    delete process.env.VITE_FIREBASE_AUTH_DOMAIN
    delete process.env.VITE_FIREBASE_PROJECT_ID
    delete process.env.VITE_FIREBASE_STORAGE_BUCKET
    delete process.env.VITE_FIREBASE_MESSAGING_SENDER_ID
    delete process.env.VITE_FIREBASE_APP_ID
  })

  describe('Firebase設定読み込み', () => {
    it('環境変数が設定されている場合、適切なconfig objectを返すこと', async () => {
      // 環境変数を設定
      process.env.VITE_FIREBASE_API_KEY = 'test-api-key'
      process.env.VITE_FIREBASE_AUTH_DOMAIN = 'test-project.firebaseapp.com'
      process.env.VITE_FIREBASE_PROJECT_ID = 'test-project'
      process.env.VITE_FIREBASE_STORAGE_BUCKET = 'test-project.appspot.com'
      process.env.VITE_FIREBASE_MESSAGING_SENDER_ID = '123456789'
      process.env.VITE_FIREBASE_APP_ID = '1:123456789:web:abcdef'

      // 動的importを使用してモジュールを再読み込み
      const { getFirebaseConfig } = await import('../firebase')
      const config = getFirebaseConfig()

      expect(config).toEqual({
        apiKey: 'test-api-key',
        authDomain: 'test-project.firebaseapp.com',
        projectId: 'test-project',
        storageBucket: 'test-project.appspot.com',
        messagingSenderId: '123456789',
        appId: '1:123456789:web:abcdef',
      })
    })

    it('必須環境変数が不足している場合、エラーを投げること', async () => {
      // 一部の環境変数のみ設定
      process.env.VITE_FIREBASE_API_KEY = 'test-api-key'
      // 他の変数は未設定

      const { getFirebaseConfig } = await import('../firebase')
      
      expect(() => getFirebaseConfig()).toThrow('Firebase設定環境変数が不足しています')
    })
  })

  describe('Firebase初期化', () => {
    it('アプリがまだ初期化されていない場合、新しいアプリを初期化すること', async () => {
      const { initializeApp, getApps } = await import('firebase/app')
      const { initializeFirebase } = await import('../firebase')

      // 環境変数を設定
      process.env.VITE_FIREBASE_API_KEY = 'test-api-key'
      process.env.VITE_FIREBASE_AUTH_DOMAIN = 'test-project.firebaseapp.com'
      process.env.VITE_FIREBASE_PROJECT_ID = 'test-project'
      process.env.VITE_FIREBASE_STORAGE_BUCKET = 'test-project.appspot.com'
      process.env.VITE_FIREBASE_MESSAGING_SENDER_ID = '123456789'
      process.env.VITE_FIREBASE_APP_ID = '1:123456789:web:abcdef'

      vi.mocked(getApps).mockReturnValue([])

      await initializeFirebase()

      expect(initializeApp).toHaveBeenCalledWith({
        apiKey: 'test-api-key',
        authDomain: 'test-project.firebaseapp.com',
        projectId: 'test-project',
        storageBucket: 'test-project.appspot.com',
        messagingSenderId: '123456789',
        appId: '1:123456789:web:abcdef',
      })
    })

    it('アプリが既に初期化されている場合、既存のアプリを使用すること', async () => {
      // 環境変数を設定
      process.env.VITE_FIREBASE_API_KEY = 'test-api-key'
      process.env.VITE_FIREBASE_AUTH_DOMAIN = 'test-project.firebaseapp.com'
      process.env.VITE_FIREBASE_PROJECT_ID = 'test-project'
      process.env.VITE_FIREBASE_STORAGE_BUCKET = 'test-project.appspot.com'
      process.env.VITE_FIREBASE_MESSAGING_SENDER_ID = '123456789'
      process.env.VITE_FIREBASE_APP_ID = '1:123456789:web:abcdef'

      const { initializeApp, getApps, getApp } = await import('firebase/app')
      const { initializeFirebase } = await import('../firebase')

      vi.mocked(getApps).mockReturnValue([{ name: '[DEFAULT]' } as any])

      await initializeFirebase()

      expect(initializeApp).not.toHaveBeenCalled()
      expect(getApp).toHaveBeenCalled()
    })
  })

  describe('Auth初期化', () => {
    it('本番環境でAuth Emulatorに接続しないこと', async () => {
      // 環境変数を設定
      process.env.VITE_FIREBASE_API_KEY = 'test-api-key'
      process.env.VITE_FIREBASE_AUTH_DOMAIN = 'test-project.firebaseapp.com'
      process.env.VITE_FIREBASE_PROJECT_ID = 'test-project'
      process.env.VITE_FIREBASE_STORAGE_BUCKET = 'test-project.appspot.com'
      process.env.VITE_FIREBASE_MESSAGING_SENDER_ID = '123456789'
      process.env.VITE_FIREBASE_APP_ID = '1:123456789:web:abcdef'

      const { connectAuthEmulator } = await import('firebase/auth')
      const { initializeAuth } = await import('../firebase')

      process.env.NODE_ENV = 'production'

      await initializeAuth()

      expect(connectAuthEmulator).not.toHaveBeenCalled()
    })

    it('開発環境でAuth Emulatorが設定されている場合、接続すること', async () => {
      // 環境変数を設定
      process.env.VITE_FIREBASE_API_KEY = 'test-api-key'
      process.env.VITE_FIREBASE_AUTH_DOMAIN = 'test-project.firebaseapp.com'
      process.env.VITE_FIREBASE_PROJECT_ID = 'test-project'
      process.env.VITE_FIREBASE_STORAGE_BUCKET = 'test-project.appspot.com'
      process.env.VITE_FIREBASE_MESSAGING_SENDER_ID = '123456789'
      process.env.VITE_FIREBASE_APP_ID = '1:123456789:web:abcdef'

      const { connectAuthEmulator } = await import('firebase/auth')
      const { initializeAuth } = await import('../firebase')

      process.env.NODE_ENV = 'development'
      process.env.VITE_FIREBASE_AUTH_EMULATOR_URL = 'http://localhost:9099'

      await initializeAuth()

      expect(connectAuthEmulator).toHaveBeenCalledWith(
        expect.anything(),
        'http://localhost:9099'
      )
    })
  })

  describe('統合テスト', () => {
    it('完全な初期化フローが正常に動作すること', async () => {
      // 環境変数を設定
      process.env.VITE_FIREBASE_API_KEY = 'test-api-key'
      process.env.VITE_FIREBASE_AUTH_DOMAIN = 'test-project.firebaseapp.com'
      process.env.VITE_FIREBASE_PROJECT_ID = 'test-project'
      process.env.VITE_FIREBASE_STORAGE_BUCKET = 'test-project.appspot.com'
      process.env.VITE_FIREBASE_MESSAGING_SENDER_ID = '123456789'
      process.env.VITE_FIREBASE_APP_ID = '1:123456789:web:abcdef'

      const { initializeApp, getApps } = await import('firebase/app')
      const { getAuth } = await import('firebase/auth')
      const { initializeFirebase, initializeAuth } = await import('../firebase')

      vi.mocked(getApps).mockReturnValue([])

      // Firebase初期化
      await initializeFirebase()
      const auth = await initializeAuth()

      expect(initializeApp).toHaveBeenCalled()
      expect(getAuth).toHaveBeenCalled()
      expect(auth).toBeDefined()
    })
  })
})