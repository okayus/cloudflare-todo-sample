/**
 * Firebase設定のテスト
 *
 * Firebase初期化とAuth設定が適切に行われることを検証する。
 * TDD手法に従い、まずテストを作成してから実装を進める。
 * 
 * 注意：テスト間干渉を防ぐため、setupTests.tsで統一されたモック設定を使用。
 * 個別のvi.mock()呼び出しは避け、setupTests.tsの設定に依存する。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// 注意：Firebase モジュールのモック設定は setupTests.ts で統一管理されている
// ここでは個別のモック設定は行わない

describe('Firebase設定', () => {
  beforeEach(() => {
    // setupTests.ts で統一されたクリーンアップが実行される
    
    // Firebaseテスト用の環境変数を明示的に設定（setupTests.tsの設定を上書き）
    vi.stubEnv('VITE_FIREBASE_API_KEY', 'test-api-key')
    vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', 'test-project.firebaseapp.com')
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project')
    vi.stubEnv('VITE_FIREBASE_STORAGE_BUCKET', 'test-project.appspot.com')
    vi.stubEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', '123456789')
    vi.stubEnv('VITE_FIREBASE_APP_ID', '1:123456789:web:abcdef')
    vi.stubEnv('DEV', false) // デフォルトは本番環境でテスト
  })

  describe('Firebase設定読み込み', () => {
    it('環境変数が設定されている場合、適切なconfig objectを返すこと', async () => {
      // テスト用環境変数は setupTests.ts で設定済み
      // 追加で必要な場合のみここで設定
      
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
      // 一部の環境変数を未設定にする
      vi.stubEnv('VITE_FIREBASE_API_KEY', undefined)
      
      const { getFirebaseConfig } = await import('../firebase')
      
      expect(() => getFirebaseConfig()).toThrow('Firebase設定環境変数が不足しています')
    })
  })

  describe('Firebase初期化', () => {
    it('アプリがまだ初期化されていない場合、新しいアプリを初期化すること', async () => {
      const { initializeApp, getApps } = await import('firebase/app')
      const { initializeFirebase } = await import('../firebase')

      // getApps が空配列を返すようにモック設定
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
      const { initializeApp, getApps, getApp } = await import('firebase/app')
      const { initializeFirebase } = await import('../firebase')

      // 既存のアプリがあることをシミュレート
      vi.mocked(getApps).mockReturnValue([{ name: '[DEFAULT]' } as ReturnType<typeof getApp>])

      await initializeFirebase()

      expect(initializeApp).not.toHaveBeenCalled()
      expect(getApp).toHaveBeenCalled()
    })
  })

  describe('Auth初期化', () => {
    it('本番環境でAuth Emulatorに接続しないこと', async () => {
      // 本番環境設定
      vi.stubEnv('DEV', false)
      // Emulator URLが設定されても、DEVがfalseなので接続しない
      vi.stubEnv('VITE_FIREBASE_AUTH_EMULATOR_URL', 'http://localhost:9099')

      const { connectAuthEmulator } = await import('firebase/auth')
      const { initializeAuth } = await import('../firebase')

      await initializeAuth()

      expect(connectAuthEmulator).not.toHaveBeenCalled()
    })

    it('開発環境でAuth Emulatorが設定されている場合、接続すること', async () => {
      // 開発環境設定
      vi.stubEnv('DEV', true)
      vi.stubEnv('VITE_FIREBASE_AUTH_EMULATOR_URL', 'http://localhost:9099')

      const { connectAuthEmulator, getAuth } = await import('firebase/auth')
      
      // getAuthのmockを更新してemulatorConfigを設定
      vi.mocked(getAuth).mockReturnValue({ 
        name: 'test-auth-instance', 
        emulatorConfig: null // emulator未接続状態
      } as ReturnType<typeof getAuth>)
      
      const { initializeAuth } = await import('../firebase')

      await initializeAuth()

      expect(connectAuthEmulator).toHaveBeenCalledWith(
        expect.anything(),
        'http://localhost:9099'
      )
    })
  })

  describe('統合テスト', () => {
    it('完全な初期化フローが正常に動作すること', async () => {
      const { initializeApp, getApps } = await import('firebase/app')
      const { getAuth } = await import('firebase/auth')
      const { initializeFirebase, initializeAuth } = await import('../firebase')

      // 新規初期化をシミュレート
      vi.mocked(getApps).mockReturnValue([])
      
      // getAuthの返り値を設定
      const mockAuthInstance = { name: 'test-auth-instance', emulatorConfig: null }
      vi.mocked(getAuth).mockReturnValue(mockAuthInstance as ReturnType<typeof getAuth>)

      // Firebase初期化
      await initializeFirebase()
      const auth = await initializeAuth()

      expect(initializeApp).toHaveBeenCalled()
      expect(getAuth).toHaveBeenCalled()
      expect(auth).toBe(mockAuthInstance) // 正確なインスタンスが返されることを確認
    })
  })
})