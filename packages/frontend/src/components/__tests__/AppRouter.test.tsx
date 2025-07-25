/**
 * アプリケーションルーターテスト
 * 
 * TDD原則に従い、実装前にテストを作成。
 * React Routerを使用したルーティング機能を検証する。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
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

describe('AppRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('パブリックルート', () => {
    it('ルートパス（/）でランディングページが表示される', async () => {
      // 未認証状態をモック
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        login: vi.fn(),
        signup: vi.fn(),
        logout: vi.fn(),
      })

      // この時点ではまだ実装されていないため失敗する
      const { AppRouter } = await import('../AppRouter')

      render(
        <MemoryRouter initialEntries={['/']}>
          <AppRouter />
        </MemoryRouter>
      )

      expect(screen.getByTestId('landing-page')).toBeInTheDocument()
    })

    it('/loginパスでログインページが表示される', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        login: vi.fn(),
        signup: vi.fn(),
        logout: vi.fn(),
      })

      const { AppRouter } = await import('../AppRouter')

      render(
        <MemoryRouter initialEntries={['/login']}>
          <AppRouter />
        </MemoryRouter>
      )

      expect(screen.getByTestId('login-page')).toBeInTheDocument()
    })

    it('/signupパスでサインアップページが表示される', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        login: vi.fn(),
        signup: vi.fn(),
        logout: vi.fn(),
      })

      const { AppRouter } = await import('../AppRouter')

      render(
        <MemoryRouter initialEntries={['/signup']}>
          <AppRouter />
        </MemoryRouter>
      )

      expect(screen.getByTestId('signup-page')).toBeInTheDocument()
    })
  })

  describe('プライベートルート', () => {
    it('認証済みユーザーは/dashboardにアクセスできる', async () => {
      // 認証済み状態をモック
      mockUseAuth.mockReturnValue({
        user: mockUser as User,
        isLoading: false,
        login: vi.fn(),
        signup: vi.fn(),
        logout: vi.fn(),
      })

      const { AppRouter } = await import('../AppRouter')

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <AppRouter />
        </MemoryRouter>
      )

      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument()
    })

    it('未認証ユーザーが/dashboardにアクセスすると/loginにリダイレクト', async () => {
      // 未認証状態をモック
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        login: vi.fn(),
        signup: vi.fn(),
        logout: vi.fn(),
      })

      const { AppRouter } = await import('../AppRouter')

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <AppRouter />
        </MemoryRouter>
      )

      // プロテクトルートがリダイレクトするため、最終的にログインページが表示される
      expect(screen.getByTestId('login-page')).toBeInTheDocument()
    })
  })

  describe('認証済みユーザーのリダイレクト', () => {
    it('認証済みユーザーが/loginにアクセスすると/dashboardにリダイレクト', async () => {
      // 認証済み状態をモック
      mockUseAuth.mockReturnValue({
        user: mockUser as User,
        isLoading: false,
        login: vi.fn(),
        signup: vi.fn(),
        logout: vi.fn(),
      })

      const { AppRouter } = await import('../AppRouter')

      render(
        <MemoryRouter initialEntries={['/login']}>
          <AppRouter />
        </MemoryRouter>
      )

      // 認証済みユーザーはダッシュボードにリダイレクト
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument()
    })

    it('認証済みユーザーが/signupにアクセスすると/dashboardにリダイレクト', async () => {
      // 認証済み状態をモック
      mockUseAuth.mockReturnValue({
        user: mockUser as User,
        isLoading: false,
        login: vi.fn(),
        signup: vi.fn(),
        logout: vi.fn(),
      })

      const { AppRouter } = await import('../AppRouter')

      render(
        <MemoryRouter initialEntries={['/signup']}>
          <AppRouter />
        </MemoryRouter>
      )

      // 認証済みユーザーはダッシュボードにリダイレクト
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument()
    })

    it('認証済みユーザーが/（ルート）にアクセスすると/dashboardにリダイレクト', async () => {
      // 認証済み状態をモック
      mockUseAuth.mockReturnValue({
        user: mockUser as User,
        isLoading: false,
        login: vi.fn(),
        signup: vi.fn(),
        logout: vi.fn(),
      })

      const { AppRouter } = await import('../AppRouter')

      render(
        <MemoryRouter initialEntries={['/']}>
          <AppRouter />
        </MemoryRouter>
      )

      // 認証済みユーザーはダッシュボードにリダイレクト
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument()
    })
  })

  describe('存在しないルート', () => {
    it('存在しないパスでは404ページが表示される', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        login: vi.fn(),
        signup: vi.fn(),
        logout: vi.fn(),
      })

      const { AppRouter } = await import('../AppRouter')

      render(
        <MemoryRouter initialEntries={['/nonexistent']}>
          <AppRouter />
        </MemoryRouter>
      )

      expect(screen.getByTestId('not-found-page')).toBeInTheDocument()
    })
  })

  describe('ローディング状態', () => {
    it('認証状態確認中はローディング画面が表示される', async () => {
      // ローディング状態をモック
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: true,
        login: vi.fn(),
        signup: vi.fn(),
        logout: vi.fn(),
      })

      const { AppRouter } = await import('../AppRouter')

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <AppRouter />
        </MemoryRouter>
      )

      expect(screen.getByTestId('app-loading')).toBeInTheDocument()
    })
  })
})