/**
 * プロテクトルートコンポーネントテスト
 * 
 * TDD原則に従い、実装前にテストを作成。
 * 認証状態に基づくルート保護機能を検証する。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
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
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    Navigate: vi.fn(({ to, state, replace }) => {
      // Navigate コンポーネントをモック
      return <div data-testid="navigate-redirect" data-to={to} data-state={JSON.stringify(state)} data-replace={replace} />
    }),
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
        <MemoryRouter initialEntries={['/dashboard']}>
          <ProtectedRoute>
            <TestProtectedContent />
          </ProtectedRoute>
        </MemoryRouter>
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
        <MemoryRouter initialEntries={['/dashboard']}>
          <ProtectedRoute>
            <TestProtectedContent />
          </ProtectedRoute>
        </MemoryRouter>
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
        <MemoryRouter initialEntries={['/dashboard']}>
          <ProtectedRoute>
            <TestProtectedContent />
          </ProtectedRoute>
        </MemoryRouter>
      )

      // ログインページにリダイレクトされることを確認
      const redirectElement = screen.getByTestId('navigate-redirect')
      expect(redirectElement).toHaveAttribute('data-to', '/login')
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


      const { ProtectedRoute } = await import('../ProtectedRoute')

      const TestProtectedContent = () => (
        <div data-testid="protected-content">Protected Content</div>
      )

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <ProtectedRoute>
            <TestProtectedContent />
          </ProtectedRoute>
        </MemoryRouter>
      )

      // リダイレクト先とstateを確認
      const redirectElement = screen.getByTestId('navigate-redirect')
      expect(redirectElement).toHaveAttribute('data-to', '/login')
      expect(redirectElement).toHaveAttribute('data-state', JSON.stringify({ from: '/dashboard' }))
      expect(redirectElement).toHaveAttribute('data-replace', 'true')
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
        <MemoryRouter initialEntries={['/']}>
          <ProtectedRoute redirectTo="/custom-login">
            <TestProtectedContent />
          </ProtectedRoute>
        </MemoryRouter>
      )

      const redirectElement = screen.getByTestId('navigate-redirect')
      expect(redirectElement).toHaveAttribute('data-to', '/custom-login')
      expect(redirectElement).toHaveAttribute('data-state', JSON.stringify({ from: '/' }))
      expect(redirectElement).toHaveAttribute('data-replace', 'true')
    })
  })
})