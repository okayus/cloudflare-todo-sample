/**
 * 認証コンテキストテスト
 * 
 * TDD原則に従い、認証状態管理の実装前にテストを作成。
 * ユーザーの認証状態変更とコンテキストの動作を検証する。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, renderHook, act } from '@testing-library/react'
import { User } from 'firebase/auth'

// Firebase認証関連のモック
const mockUser: Partial<User> = {
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  emailVerified: true,
}

const mockSignInWithEmailAndPassword = vi.fn()
const mockCreateUserWithEmailAndPassword = vi.fn()
const mockSignOut = vi.fn()
const mockOnAuthStateChanged = vi.fn()
const mockGetAuth = vi.fn()
const mockAuth = { name: 'test-auth-instance' }

// Firebase configのモックを最初に設定
vi.mock('../config/firebase', () => ({
  auth: vi.fn().mockResolvedValue(mockAuth), // auth関数として正しくモック
}))

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({ name: 'test-app' })),
  getApps: vi.fn(() => []),
  getApp: vi.fn(),
}))

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: mockSignInWithEmailAndPassword,
  createUserWithEmailAndPassword: mockCreateUserWithEmailAndPassword,
  signOut: mockSignOut,
  onAuthStateChanged: mockOnAuthStateChanged,
  getAuth: mockGetAuth,
  connectAuthEmulator: vi.fn(),
}))

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // getAuthモックの設定
    mockGetAuth.mockReturnValue(mockAuth)
    // デフォルトでは認証リスナーは即座に実行される
    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      callback(null) // 初期状態では未認証
      return vi.fn() // unsubscribe関数を返す
    })
  })

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
      
      // 認証状態変更をシミュレート
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        // 最初は未認証
        setTimeout(() => callback(null), 0)
        // 100ms後に認証済みに変更
        setTimeout(() => callback(mockUser as User), 100)
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
      mockSignInWithEmailAndPassword.mockResolvedValue({
        user: mockUser,
        credential: null,
      })

      const { AuthProvider, useAuth } = await import('../AuthContext')
      
      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
      })

      await act(async () => {
        await result.current.login('test@example.com', 'password123')
      })

      expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
        mockAuth, // auth instance
        'test@example.com',
        'password123'
      )
    })

    it('サインアップ機能が正常に動作する', async () => {
      mockCreateUserWithEmailAndPassword.mockResolvedValue({
        user: mockUser,
        credential: null,
      })

      const { AuthProvider, useAuth } = await import('../AuthContext')
      
      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
      })

      await act(async () => {
        await result.current.signup('test@example.com', 'password123')
      })

      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
        mockAuth, // auth instance
        'test@example.com',
        'password123'
      )
    })

    it('ログアウト機能が正常に動作する', async () => {
      mockSignOut.mockResolvedValue(undefined)

      const { AuthProvider, useAuth } = await import('../AuthContext')
      
      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
      })

      await act(async () => {
        await result.current.logout()
      })

      expect(mockSignOut).toHaveBeenCalledWith(mockAuth) // auth instance
    })
  })

  describe('エラーハンドリング', () => {
    it('ログイン失敗時にエラーを適切に処理する', async () => {
      const error = new Error('Invalid credentials')
      mockSignInWithEmailAndPassword.mockRejectedValue(error)

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
      let authCallback: ((user: User | null) => void) | null = null
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        // コールバックを保存するが、すぐには実行しない
        authCallback = callback
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