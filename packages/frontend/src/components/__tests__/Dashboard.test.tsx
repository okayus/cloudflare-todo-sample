/**
 * ダッシュボードコンポーネントテスト
 * 
 * TDD原則に従い、実装前にテストを作成。
 * 認証済みユーザー向けダッシュボードの機能を検証する。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { User } from 'firebase/auth'

// AuthContextのモック
const mockLogout = vi.fn()
const mockUseAuth = vi.fn()

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: mockUseAuth,
}))

describe('Dashboard', () => {
  const user = userEvent.setup()

  // テスト用のモックユーザー
  const mockUser: Partial<User> = {
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
    emailVerified: true,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({
      user: mockUser as User,
      isLoading: false,
      login: vi.fn(),
      signup: vi.fn(),
      logout: mockLogout,
    })
  })

  describe('コンポーネント表示', () => {
    it('ダッシュボードページが正しく表示される', async () => {
      const { Dashboard } = await import('../Dashboard')

      render(<Dashboard />)

      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument()
      expect(screen.getByText('ダッシュボード')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /ログアウト/i })).toBeInTheDocument()
    })

    it('ユーザー情報セクションが表示される', async () => {
      const { Dashboard } = await import('../Dashboard')

      render(<Dashboard />)

      expect(screen.getByText('ユーザー情報')).toBeInTheDocument()
      expect(screen.getByText('メール:')).toBeInTheDocument()
      expect(screen.getByText('表示名:')).toBeInTheDocument()
      expect(screen.getByText('認証状態:')).toBeInTheDocument()
    })

    it('フッター情報が表示される', async () => {
      const { Dashboard } = await import('../Dashboard')

      render(<Dashboard />)

      expect(screen.getByText('Cloudflare Todo Sample Application')).toBeInTheDocument()
    })
  })

  describe('ユーザー情報表示', () => {
    it('認証済みユーザーの情報が正確に表示される', async () => {
      const { Dashboard } = await import('../Dashboard')

      render(<Dashboard />)

      // ユーザー情報の表示確認
      expect(screen.getByText('test-user-id')).toBeInTheDocument()
      expect(screen.getByText('test@example.com')).toBeInTheDocument()
      expect(screen.getByText('Test User')).toBeInTheDocument()
      expect(screen.getByText('認証済み')).toBeInTheDocument()
    })

    it('displayNameが設定されている場合は挨拶でdisplayNameを使用', async () => {
      const { Dashboard } = await import('../Dashboard')

      render(<Dashboard />)

      expect(screen.getByText('ようこそ、Test Userさん')).toBeInTheDocument()
    })

    it('displayNameが未設定の場合は挨拶でemailを使用', async () => {
      // displayNameがnullのユーザー
      const userWithoutDisplayName = {
        ...mockUser,
        displayName: null,
      }

      mockUseAuth.mockReturnValue({
        user: userWithoutDisplayName as User,
        isLoading: false,
        login: vi.fn(),
        signup: vi.fn(),
        logout: mockLogout,
      })

      const { Dashboard } = await import('../Dashboard')

      render(<Dashboard />)

      expect(screen.getByText('ようこそ、test@example.comさん')).toBeInTheDocument()
    })

    it('表示名が未設定の場合は「未設定」と表示', async () => {
      // displayNameがnullのユーザー
      const userWithoutDisplayName = {
        ...mockUser,
        displayName: null,
      }

      mockUseAuth.mockReturnValue({
        user: userWithoutDisplayName as User,
        isLoading: false,
        login: vi.fn(),
        signup: vi.fn(),
        logout: mockLogout,
      })

      const { Dashboard } = await import('../Dashboard')

      render(<Dashboard />)

      expect(screen.getByText('未設定')).toBeInTheDocument()
    })

    it('メール認証済みの場合は「認証済み」と表示', async () => {
      const { Dashboard } = await import('../Dashboard')

      render(<Dashboard />)

      const emailVerifiedElement = screen.getByText('認証済み')
      expect(emailVerifiedElement).toBeInTheDocument()
      expect(emailVerifiedElement).toHaveClass('text-green-600')
    })

    it('メール未認証の場合は「未認証」と表示', async () => {
      // メール未認証のユーザー
      const unverifiedUser = {
        ...mockUser,
        emailVerified: false,
      }

      mockUseAuth.mockReturnValue({
        user: unverifiedUser as User,
        isLoading: false,
        login: vi.fn(),
        signup: vi.fn(),
        logout: mockLogout,
      })

      const { Dashboard } = await import('../Dashboard')

      render(<Dashboard />)

      const emailVerifiedElement = screen.getByText('未認証')
      expect(emailVerifiedElement).toBeInTheDocument()
      expect(emailVerifiedElement).toHaveClass('text-red-600')
    })
  })

  describe('ログアウト機能', () => {
    it('ログアウトボタンをクリックするとlogout関数が呼ばれる', async () => {
      mockLogout.mockResolvedValue(undefined)

      const { Dashboard } = await import('../Dashboard')

      render(<Dashboard />)

      const logoutButton = screen.getByRole('button', { name: /ログアウト/i })
      
      await user.click(logoutButton)

      expect(mockLogout).toHaveBeenCalledTimes(1)
    })

    it('ログアウト処理が正常に完了する', async () => {
      mockLogout.mockResolvedValue(undefined)

      const { Dashboard } = await import('../Dashboard')

      render(<Dashboard />)

      const logoutButton = screen.getByRole('button', { name: /ログアウト/i })
      
      await user.click(logoutButton)

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalledTimes(1)
      })
    })

    it('ログアウト失敗時にエラーがコンソールに出力される', async () => {
      const error = new Error('Logout failed')
      mockLogout.mockRejectedValue(error)
      
      // console.errorをモック
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { Dashboard } = await import('../Dashboard')

      render(<Dashboard />)

      const logoutButton = screen.getByRole('button', { name: /ログアウト/i })
      
      await user.click(logoutButton)

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('ログアウトエラー:', error)
      })

      consoleErrorSpy.mockRestore()
    })
  })
})