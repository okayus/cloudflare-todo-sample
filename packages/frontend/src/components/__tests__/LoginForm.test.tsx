/**
 * ログインフォームコンポーネントテスト
 * 
 * TDD原則に従い、実装前にテストを作成。
 * Firebase認証を使用したログイン機能を検証する。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'

// AuthContextのモック
const mockLogin = vi.fn()
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
    useLocation: () => ({ state: null }),
  }
})

describe('LoginForm', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      login: mockLogin,
      signup: vi.fn(),
      logout: vi.fn(),
    })
  })

  describe('フォーム表示', () => {
    it('メールアドレスとパスワードの入力フィールドが表示される', async () => {
      // この時点ではまだ実装されていないため失敗する
      const { LoginForm } = await import('../LoginForm')

      render(
        <BrowserRouter>
          <LoginForm />
        </BrowserRouter>
      )

      expect(screen.getByLabelText(/メールアドレス/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/パスワード/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /ログイン/i })).toBeInTheDocument()
    })

    it('サインアップページへのリンクが表示される', async () => {
      const { LoginForm } = await import('../LoginForm')

      render(
        <BrowserRouter>
          <LoginForm />
        </BrowserRouter>
      )

      expect(screen.getByText(/アカウントをお持ちでない場合/i)).toBeInTheDocument()
      // 複数のサインアップリンクが存在することを確認
      const signupLinks = screen.getAllByRole('link', { name: /サインアップ/i })
      expect(signupLinks).toHaveLength(2)
      
      // それぞれのリンクが正しいhrefを持つことを確認
      signupLinks.forEach(link => {
        expect(link).toHaveAttribute('href', '/signup')
      })
    })
  })

  describe('フォーム入力', () => {
    it('メールアドレスとパスワードが入力できる', async () => {
      const { LoginForm } = await import('../LoginForm')

      render(
        <BrowserRouter>
          <LoginForm />
        </BrowserRouter>
      )

      const emailInput = screen.getByLabelText(/メールアドレス/i)
      const passwordInput = screen.getByLabelText(/パスワード/i)

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')

      expect(emailInput).toHaveValue('test@example.com')
      expect(passwordInput).toHaveValue('password123')
    })

    it('空の値でフォーム送信しようとするとバリデーションエラーが表示される', async () => {
      const { LoginForm } = await import('../LoginForm')

      render(
        <BrowserRouter>
          <LoginForm />
        </BrowserRouter>
      )

      const submitButton = screen.getByRole('button', { name: /ログイン/i })
      
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/メールアドレスを入力してください/i)).toBeInTheDocument()
        expect(screen.getByText(/パスワードを入力してください/i)).toBeInTheDocument()
      })
    })

  })

  describe('ログイン処理', () => {
    it('正しい入力値でログインが実行される', async () => {
      mockLogin.mockResolvedValue({ user: { uid: 'test-user' } })

      const { LoginForm } = await import('../LoginForm')

      render(
        <BrowserRouter>
          <LoginForm />
        </BrowserRouter>
      )

      const emailInput = screen.getByLabelText(/メールアドレス/i)
      const passwordInput = screen.getByLabelText(/パスワード/i)
      const submitButton = screen.getByRole('button', { name: /ログイン/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
      })
    })

    it('ログイン成功後にダッシュボードにリダイレクトされる', async () => {
      mockLogin.mockResolvedValue({ user: { uid: 'test-user' } })

      const { LoginForm } = await import('../LoginForm')

      render(
        <BrowserRouter>
          <LoginForm />
        </BrowserRouter>
      )

      const emailInput = screen.getByLabelText(/メールアドレス/i)
      const passwordInput = screen.getByLabelText(/パスワード/i)
      const submitButton = screen.getByRole('button', { name: /ログイン/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
      })
    })


    it('ログイン処理中はローディング状態が表示される', async () => {
      let resolveLogin: (value: any) => void
      const loginPromise = new Promise(resolve => {
        resolveLogin = resolve
      })
      mockLogin.mockReturnValue(loginPromise)

      const { LoginForm } = await import('../LoginForm')

      render(
        <BrowserRouter>
          <LoginForm />
        </BrowserRouter>
      )

      const emailInput = screen.getByLabelText(/メールアドレス/i)
      const passwordInput = screen.getByLabelText(/パスワード/i)
      const submitButton = screen.getByRole('button', { name: /ログイン/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      
      await user.click(submitButton)

      // ローディング状態を確認
      expect(screen.getByText(/ログイン中.../i)).toBeInTheDocument()
      expect(submitButton).toBeDisabled()

      // ログイン完了
      resolveLogin!({ user: { uid: 'test-user' } })
    })

    it('ログイン失敗時にエラーメッセージが表示される', async () => {
      const error = new Error('Invalid credentials')
      mockLogin.mockRejectedValue(error)

      const { LoginForm } = await import('../LoginForm')

      render(
        <BrowserRouter>
          <LoginForm />
        </BrowserRouter>
      )

      const emailInput = screen.getByLabelText(/メールアドレス/i)
      const passwordInput = screen.getByLabelText(/パスワード/i)
      const submitButton = screen.getByRole('button', { name: /ログイン/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'wrongpassword')
      
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/ログインに失敗しました/i)).toBeInTheDocument()
      })
    })
  })
})