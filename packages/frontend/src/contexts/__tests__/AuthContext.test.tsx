/**
 * 認証コンテキストテスト
 * 
 * TDD原則に従い、認証状態管理の実装前にテストを作成。
 * ユーザーの認証状態変更とコンテキストの動作を検証する。
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, renderHook, act } from '@testing-library/react'
import { User } from 'firebase/auth'

// 注意：Firebase モジュールのモック設定は setupTests.ts で統一管理されている
// ここでは個別のモック設定は行わず、統一されたモックを使用する

// テスト用のユーザーデータ（setupTests.tsのmockUserと同様）
const mockUser: User = {
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  emailVerified: true,
  isAnonymous: false,
  phoneNumber: null,
  photoURL: null,
  providerData: [],
  refreshToken: 'test-refresh-token',
  tenantId: null,
  delete: vi.fn(),
  getIdToken: vi.fn().mockResolvedValue('test-token'),
  getIdTokenResult: vi.fn(),
  reload: vi.fn(),
  toJSON: vi.fn(),
  providerId: 'firebase',
  metadata: {
    creationTime: 'test-creation-time',
    lastSignInTime: 'test-signin-time'
  }
}

// 注意：すべてのモック設定は setupTests.ts で統一管理されている
// ここでは setupTests.ts の設定に完全依存し、個別のモック設定は行わない

describe('AuthContext', () => {
  // setupTests.ts で統一された beforeEach が自動実行される

  describe('AuthProvider', () => {
    it('初期状態では未認証である', async () => {
      // この時点ではまだ実装されていないため失敗する
      const { AuthProvider, useAuth } = await import('../AuthContext')
      
      const TestComponent = () => {
        const { user, isLoading } = useAuth()
        return (
          <div>
            <div data-testid="user">{user ? user.email : 'not authenticated'}</div>
            <div data-testid="loading">{isLoading ? 'loading' : 'loaded'}</div>
          </div>
        )
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('not authenticated')
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })
    })

    it('認証状態の変更を正しく反映する', async () => {
      const { AuthProvider, useAuth } = await import('../AuthContext')
      const { onAuthStateChanged } = await import('firebase/auth')
      
      // 認証状態変更をシミュレート
      vi.mocked(onAuthStateChanged).mockImplementation((_auth, callback) => {
        // 最初は未認証
        setTimeout(() => {
          if (typeof callback === 'function') {
            callback(null)
          }
        }, 0)
        // 100ms後に認証済みに変更
        setTimeout(() => {
          if (typeof callback === 'function') {
            callback(mockUser as User)
          }
        }, 100)
        return vi.fn()
      })

      const TestComponent = () => {
        const { user } = useAuth()
        return <div data-testid="user">{user ? user.email : 'not authenticated'}</div>
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // 初期状態では未認証
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('not authenticated')
      })

      // 認証後の状態を確認
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
      }, { timeout: 200 })
    })
  })

  describe('認証メソッド', () => {
    it('ログイン機能が正常に動作する', async () => {
      const { signInWithEmailAndPassword } = await import('firebase/auth')
      
      vi.mocked(signInWithEmailAndPassword).mockResolvedValue({
        user: mockUser,
        operationType: 'signIn',
        providerId: 'password'
      })

      const { AuthProvider, useAuth } = await import('../AuthContext')
      
      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
      })

      await act(async () => {
        await result.current.login('test@example.com', 'password123')
      })

      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'test-auth-instance' }), // auth instance
        'test@example.com',
        'password123'
      )
    })

    it('サインアップ機能が正常に動作する', async () => {
      const { createUserWithEmailAndPassword } = await import('firebase/auth')
      
      vi.mocked(createUserWithEmailAndPassword).mockResolvedValue({
        user: mockUser,
        operationType: 'signIn',
        providerId: 'password'
      })

      const { AuthProvider, useAuth } = await import('../AuthContext')
      
      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
      })

      await act(async () => {
        await result.current.signup('test@example.com', 'password123')
      })

      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'test-auth-instance' }), // auth instance
        'test@example.com',
        'password123'
      )
    })

    it('ログアウト機能が正常に動作する', async () => {
      const { signOut } = await import('firebase/auth')
      
      vi.mocked(signOut).mockResolvedValue(undefined)

      const { AuthProvider, useAuth } = await import('../AuthContext')
      
      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
      })

      await act(async () => {
        await result.current.logout()
      })

      expect(signOut).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'test-auth-instance' }) // auth instance
      )
    })
  })

  describe('エラーハンドリング', () => {
    it('ログイン失敗時にエラーを適切に処理する', async () => {
      const { signInWithEmailAndPassword } = await import('firebase/auth')
      const error = new Error('Invalid credentials')
      vi.mocked(signInWithEmailAndPassword).mockRejectedValue(error)

      const { AuthProvider, useAuth } = await import('../AuthContext')
      
      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
      })

      await expect(
        act(async () => {
          await result.current.login('test@example.com', 'wrongpassword')
        })
      ).rejects.toThrow('Invalid credentials')
    })

    it('useAuthフックがプロバイダー外で使用された場合にエラーを投げる', async () => {
      const { useAuth } = await import('../AuthContext')
      
      // プロバイダー外でフックを使用
      // renderHook内でエラーが発生するため、expect.toThrowは使えない
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      try {
        renderHook(() => useAuth())
        // エラーが発生しなかった場合はテスト失敗
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('useAuth must be used within an AuthProvider')
      }
      
      consoleError.mockRestore()
    })
  })

  describe('ローディング状態管理', () => {
    it('認証状態確認中はローディング状態になる', async () => {
      // 認証状態の確認に時間がかかる場合をシミュレート
      const { onAuthStateChanged } = await import('firebase/auth')
      let authCallback: ((user: User | null) => void) | null = null
      vi.mocked(onAuthStateChanged).mockImplementation((_auth, callback) => {
        // コールバックを保存するが、すぐには実行しない
        if (typeof callback === 'function') {
          authCallback = callback
        }
        return vi.fn()
      })

      const { AuthProvider, useAuth } = await import('../AuthContext')
      
      const TestComponent = () => {
        const { isLoading } = useAuth()
        return <div data-testid="loading">{isLoading ? 'loading' : 'loaded'}</div>
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // 初期状態ではローディング中
      expect(screen.getByTestId('loading')).toHaveTextContent('loading')

      // 少し待ってからコールバックを実行（非同期auth関数の完了を待つ）
      await new Promise(resolve => setTimeout(resolve, 10))

      // 認証状態が確定するとローディング終了
      act(() => {
        authCallback?.(null)
      })

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })
    })
  })
})