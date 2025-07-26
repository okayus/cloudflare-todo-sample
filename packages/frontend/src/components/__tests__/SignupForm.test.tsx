/**
 * サインアップフォームコンポーネントテスト
 * 
 * TDD原則に従い、実装前にテストを作成。
 * Firebase認証を使用したサインアップ機能を検証する。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'

// 注意：React Router と AuthContext のモック設定は setupTests.ts で統一管理

// AuthContext のモック関数
const mockSignup = vi.fn()
const mockUseAuth = vi.fn()

// AuthContext をモック（統一設定に依存）
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: mockUseAuth,
}))

// React Router のモック関数取得（setupTests.ts で設定済み）
let mockNavigate: any
beforeEach(async () => {
  const reactRouter = await import('react-router-dom')
  mockNavigate = reactRouter.useNavigate()
})

describe('SignupForm', () => {
  const user = userEvent.setup()

  // 統一された beforeEach は setupTests.ts で処理済み
  beforeEach(() => {
    // AuthContext のモック返り値を設定
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      login: vi.fn(),
      signup: mockSignup,
      logout: vi.fn(),
    })
  })

  describe('フォーム表示', () => {
    it('メール・パスワード・確認パスワードの入力フィールドが表示される', async () => {
      const { SignupForm } = await import('../SignupForm')

      render(
        <BrowserRouter>
          <SignupForm />
        </BrowserRouter>
      )

      expect(screen.getByLabelText(/メールアドレス/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^パスワード$/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/パスワード確認/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /アカウント作成/i })).toBeInTheDocument()
    })

    it('ログインページへのリンクが表示される', async () => {
      const { SignupForm } = await import('../SignupForm')

      render(
        <BrowserRouter>
          <SignupForm />
        </BrowserRouter>
      )

      expect(screen.getByText(/既にアカウントをお持ちの場合/i)).toBeInTheDocument()
      // 複数のログインリンクが存在することを確認
      const loginLinks = screen.getAllByRole('link', { name: /ログイン/i })
      expect(loginLinks).toHaveLength(2)
      
      // それぞれのリンクが正しいhrefを持つことを確認
      loginLinks.forEach(link => {
        expect(link).toHaveAttribute('href', '/login')
      })
    })

    it('フォーム初期状態が正しく設定されている', async () => {
      const { SignupForm } = await import('../SignupForm')

      render(
        <BrowserRouter>
          <SignupForm />
        </BrowserRouter>
      )

      const emailInput = screen.getByLabelText(/メールアドレス/i)
      const passwordInput = screen.getByLabelText(/^パスワード$/i)
      const confirmPasswordInput = screen.getByLabelText(/パスワード確認/i)
      const submitButton = screen.getByRole('button', { name: /アカウント作成/i })

      expect(emailInput).toHaveValue('')
      expect(passwordInput).toHaveValue('')
      expect(confirmPasswordInput).toHaveValue('')
      expect(submitButton).toBeEnabled()
    })
  })

  describe('フォーム入力', () => {
    it('各フィールドに入力ができる', async () => {
      const { SignupForm } = await import('../SignupForm')

      render(
        <BrowserRouter>
          <SignupForm />
        </BrowserRouter>
      )

      const emailInput = screen.getByLabelText(/メールアドレス/i)
      const passwordInput = screen.getByLabelText(/^パスワード$/i)
      const confirmPasswordInput = screen.getByLabelText(/パスワード確認/i)

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'password123')

      expect(emailInput).toHaveValue('test@example.com')
      expect(passwordInput).toHaveValue('password123')
      expect(confirmPasswordInput).toHaveValue('password123')
    })

    it('入力時にエラーがクリアされる', async () => {
      const { SignupForm } = await import('../SignupForm')

      render(
        <BrowserRouter>
          <SignupForm />
        </BrowserRouter>
      )

      const emailInput = screen.getByLabelText(/メールアドレス/i)
      const submitButton = screen.getByRole('button', { name: /アカウント作成/i })

      // エラーを発生させる
      await user.click(submitButton)
      await waitFor(() => {
        expect(screen.getByText(/メールアドレスを入力してください/i)).toBeInTheDocument()
      })

      // 入力するとエラーがクリアされる
      await user.type(emailInput, 'test@example.com')
      await waitFor(() => {
        expect(screen.queryByText(/メールアドレスを入力してください/i)).not.toBeInTheDocument()
      })
    })

    it('フォーム状態が適切に管理される', async () => {
      const { SignupForm } = await import('../SignupForm')

      render(
        <BrowserRouter>
          <SignupForm />
        </BrowserRouter>
      )

      const emailInput = screen.getByLabelText(/メールアドレス/i)
      const passwordInput = screen.getByLabelText(/^パスワード$/i)

      // 初期状態では空
      expect(emailInput).toHaveValue('')
      expect(passwordInput).toHaveValue('')

      // 入力後は値が反映される
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'secret')

      expect(emailInput).toHaveValue('test@example.com')
      expect(passwordInput).toHaveValue('secret')
    })
  })

  describe('バリデーション', () => {
    it('空値でフォーム送信しようとするとバリデーションエラーが表示される', async () => {
      const { SignupForm } = await import('../SignupForm')

      render(
        <BrowserRouter>
          <SignupForm />
        </BrowserRouter>
      )

      const submitButton = screen.getByRole('button', { name: /アカウント作成/i })
      
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/メールアドレスを入力してください/i)).toBeInTheDocument()
        expect(screen.getByText(/パスワードを入力してください/i)).toBeInTheDocument()
        expect(screen.getByText(/パスワード確認を入力してください/i)).toBeInTheDocument()
      })
    })


    it('パスワードが6文字未満でバリデーションエラーが表示される', async () => {
      const { SignupForm } = await import('../SignupForm')

      render(
        <BrowserRouter>
          <SignupForm />
        </BrowserRouter>
      )

      const passwordInput = screen.getByLabelText(/^パスワード$/i)
      const submitButton = screen.getByRole('button', { name: /アカウント作成/i })

      await user.type(passwordInput, '12345')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/パスワードは6文字以上で入力してください/i)).toBeInTheDocument()
      })
    })

    it('パスワードが一致しない場合にバリデーションエラーが表示される', async () => {
      const { SignupForm } = await import('../SignupForm')

      render(
        <BrowserRouter>
          <SignupForm />
        </BrowserRouter>
      )

      const passwordInput = screen.getByLabelText(/^パスワード$/i)
      const confirmPasswordInput = screen.getByLabelText(/パスワード確認/i)
      const submitButton = screen.getByRole('button', { name: /アカウント作成/i })

      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'different123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/パスワードが一致しません/i)).toBeInTheDocument()
      })
    })
  })

  describe('サインアップ処理', () => {
    it('正しい入力値でサインアップが実行される', async () => {
      mockSignup.mockResolvedValue({ user: { uid: 'test-user' } })

      const { SignupForm } = await import('../SignupForm')

      render(
        <BrowserRouter>
          <SignupForm />
        </BrowserRouter>
      )

      const emailInput = screen.getByLabelText(/メールアドレス/i)
      const passwordInput = screen.getByLabelText(/^パスワード$/i)
      const confirmPasswordInput = screen.getByLabelText(/パスワード確認/i)
      const submitButton = screen.getByRole('button', { name: /アカウント作成/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'password123')
      
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockSignup).toHaveBeenCalledWith('test@example.com', 'password123')
      })
    })

    it('サインアップ成功後にダッシュボードにリダイレクトされる', async () => {
      mockSignup.mockResolvedValue({ user: { uid: 'test-user' } })

      const { SignupForm } = await import('../SignupForm')

      render(
        <BrowserRouter>
          <SignupForm />
        </BrowserRouter>
      )

      const emailInput = screen.getByLabelText(/メールアドレス/i)
      const passwordInput = screen.getByLabelText(/^パスワード$/i)
      const confirmPasswordInput = screen.getByLabelText(/パスワード確認/i)
      const submitButton = screen.getByRole('button', { name: /アカウント作成/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'password123')
      
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
      })
    })

    it('サインアップ処理中はローディング状態が表示される', async () => {
      let resolveSignup: () => void
      const signupPromise = new Promise<void>(resolve => {
        resolveSignup = resolve
      })
      mockSignup.mockReturnValue(signupPromise)

      const { SignupForm } = await import('../SignupForm')

      render(
        <BrowserRouter>
          <SignupForm />
        </BrowserRouter>
      )

      const emailInput = screen.getByLabelText(/メールアドレス/i)
      const passwordInput = screen.getByLabelText(/^パスワード$/i)
      const confirmPasswordInput = screen.getByLabelText(/パスワード確認/i)
      const submitButton = screen.getByRole('button', { name: /アカウント作成/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'password123')
      
      await user.click(submitButton)

      // ローディング状態を確認
      expect(screen.getByText(/アカウント作成中.../i)).toBeInTheDocument()
      expect(submitButton).toBeDisabled()

      // サインアップ完了
      resolveSignup!()
    })

    it('サインアップ失敗時にエラーメッセージが表示される', async () => {
      const error = new Error('Email already in use')
      mockSignup.mockRejectedValue(error)

      const { SignupForm } = await import('../SignupForm')

      render(
        <BrowserRouter>
          <SignupForm />
        </BrowserRouter>
      )

      const emailInput = screen.getByLabelText(/メールアドレス/i)
      const passwordInput = screen.getByLabelText(/^パスワード$/i)
      const confirmPasswordInput = screen.getByLabelText(/パスワード確認/i)
      const submitButton = screen.getByRole('button', { name: /アカウント作成/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'password123')
      
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/アカウント作成に失敗しました/i)).toBeInTheDocument()
      })
    })
  })
})