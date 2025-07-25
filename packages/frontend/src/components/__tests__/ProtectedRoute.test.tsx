/**
 * プロテクトルートコンポーネントテスト
 * 
 * TDD原則に従い、実装前にテストを作成。
 * 認証状態に基づくルート保護機能を検証する。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { User } from 'firebase/auth'

// AuthContextのモック
const mockUser: Partial<User> = {
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  emailVerified: true,
}

const mockUseAuth = vi.fn()

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: mockUseAuth,
}))

// React Routerのモック
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('認証済みユーザーのアクセス', () => {
    it('認証済みユーザーは保護されたコンテンツにアクセスできる', async () => {
      // 認証済み状態をモック
      mockUseAuth.mockReturnValue({
        user: mockUser as User,
        isLoading: false,
        login: vi.fn(),
        signup: vi.fn(),
        logout: vi.fn(),
      })

      // この時点ではまだ実装されていないため失敗する
      const { ProtectedRoute } = await import('../ProtectedRoute')

      const TestProtectedContent = () => (
        <div data-testid="protected-content">Protected Content</div>
      )

      render(
        <BrowserRouter>
          <ProtectedRoute>
            <TestProtectedContent />
          </ProtectedRoute>
        </BrowserRouter>
      )

      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })

    it('認証済みユーザーでローディング中の場合はローディング表示', async () => {
      // ローディング中状態をモック
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: true,
        login: vi.fn(),
        signup: vi.fn(),
        logout: vi.fn(),
      })

      const { ProtectedRoute } = await import('../ProtectedRoute')

      const TestProtectedContent = () => (
        <div data-testid="protected-content">Protected Content</div>
      )

      render(
        <BrowserRouter>
          <ProtectedRoute>
            <TestProtectedContent />
          </ProtectedRoute>
        </BrowserRouter>
      )

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })
  })

  describe('未認証ユーザーのアクセス', () => {
    it('未認証ユーザーはログインページにリダイレクトされる', async () => {
      // 未認証状態をモック
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        login: vi.fn(),
        signup: vi.fn(),
        logout: vi.fn(),
      })

      const { ProtectedRoute } = await import('../ProtectedRoute')

      const TestProtectedContent = () => (
        <div data-testid="protected-content">Protected Content</div>
      )

      render(
        <BrowserRouter>
          <ProtectedRoute>
            <TestProtectedContent />
          </ProtectedRoute>
        </BrowserRouter>
      )

      // ログインページにリダイレクトされることを確認
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true })
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    it('リダイレクト時に現在のパスをstate付きで保存する', async () => {
      // 未認証状態をモック
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        login: vi.fn(),
        signup: vi.fn(),
        logout: vi.fn(),
      })

      // 現在のパスをモック
      Object.defineProperty(window, 'location', {
        value: { pathname: '/dashboard' },
        writable: true,
      })

      const { ProtectedRoute } = await import('../ProtectedRoute')

      const TestProtectedContent = () => (
        <div data-testid="protected-content">Protected Content</div>
      )

      render(
        <BrowserRouter>
          <ProtectedRoute>
            <TestProtectedContent />
          </ProtectedRoute>
        </BrowserRouter>
      )

      // リダイレクト先とstateを確認
      expect(mockNavigate).toHaveBeenCalledWith('/login', {
        replace: true,
        state: { from: '/dashboard' }
      })
    })
  })

  describe('コンポーネントprops', () => {
    it('fallbackコンポーネントが指定された場合はそれを表示', async () => {
      // 未認証状態をモック
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        login: vi.fn(),
        signup: vi.fn(),
        logout: vi.fn(),
      })

      const { ProtectedRoute } = await import('../ProtectedRoute')

      const TestProtectedContent = () => (
        <div data-testid="protected-content">Protected Content</div>
      )

      const CustomFallback = () => (
        <div data-testid="custom-fallback">Custom Unauthorized</div>
      )

      render(
        <BrowserRouter>
          <ProtectedRoute fallback={<CustomFallback />}>
            <TestProtectedContent />
          </ProtectedRoute>
        </BrowserRouter>
      )

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument()
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    it('redirectToが指定された場合はそのパスにリダイレクト', async () => {
      // 未認証状態をモック
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        login: vi.fn(),
        signup: vi.fn(),
        logout: vi.fn(),
      })

      const { ProtectedRoute } = await import('../ProtectedRoute')

      const TestProtectedContent = () => (
        <div data-testid="protected-content">Protected Content</div>
      )

      render(
        <BrowserRouter>
          <ProtectedRoute redirectTo="/custom-login">
            <TestProtectedContent />
          </ProtectedRoute>
        </BrowserRouter>
      )

      expect(mockNavigate).toHaveBeenCalledWith('/custom-login', {
        replace: true,
        state: { from: '/' }
      })
    })
  })
})