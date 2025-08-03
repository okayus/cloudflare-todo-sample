/**
 * ダッシュボードコンポーネントテスト
 * 
 * TDD原則に従い、実装前にテストを作成。
 * 認証済みユーザー向けダッシュボードの機能を検証する。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { User } from 'firebase/auth'
import type { PaginatedResponse, Todo, ApiResponse } from '@cloudflare-todo-sample/shared'

// AuthContextのモック
const mockLogout = vi.fn()
const mockUseAuth = vi.fn()

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: mockUseAuth,
}))

// todoApi のモック
const mockGetTodos = vi.fn()
const mockToggleTodoCompletion = vi.fn()
const mockCreateTodo = vi.fn()

vi.mock('../../utils/todoApi', () => ({
  getTodos: mockGetTodos,
  toggleTodoCompletion: mockToggleTodoCompletion,
  createTodo: mockCreateTodo,
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

  // テスト用のモックレスポンス
  const mockTodosResponse: PaginatedResponse<Todo> = {
    success: true,
    data: {
      items: [],
      total: 0,
      page: 0,
      limit: 20,
      totalPages: 0,
    },
    pagination: {
      total: 0,
      page: 0,
      limit: 20,
      totalPages: 0,
    },
  }

  const mockCreateResponse: ApiResponse<Todo> = {
    success: true,
    data: {
      id: 'test-todo-id',
      userId: 'test-user-id',
      title: 'Test Task',
      description: 'Test Description',
      completed: false,
      dueDate: '2024-12-31T23:59:59.000Z',
      createdAt: '2024-07-26T20:00:00.000Z',
      updatedAt: '2024-07-26T20:00:00.000Z',
      deletedAt: null,
      slug: 'test-task',
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // AuthContext モック設定
    mockUseAuth.mockReturnValue({
      user: mockUser as User,
      isLoading: false,
      login: vi.fn(),
      signup: vi.fn(),
      logout: mockLogout,
    })
    
    // TodoAPI モック設定
    mockGetTodos.mockResolvedValue(mockTodosResponse)
    mockToggleTodoCompletion.mockResolvedValue({ success: true, data: null })
    mockCreateTodo.mockResolvedValue(mockCreateResponse)
  })

  describe('コンポーネント表示', () => {
    it('ダッシュボードページが正しく表示される', async () => {
      const { Dashboard } = await import('../Dashboard')

      await act(async () => {
        render(<Dashboard />)
      })

      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument()
      expect(screen.getByText('ダッシュボード')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /ログアウト/i })).toBeInTheDocument()
      
      // TaskList の API 呼び出し完了を待つ
      await waitFor(() => {
        expect(mockGetTodos).toHaveBeenCalledWith()
      })
    })

    it('ユーザー情報セクションが表示される', async () => {
      const { Dashboard } = await import('../Dashboard')

      await act(async () => {
        render(<Dashboard />)
      })

      expect(screen.getByText('ユーザー情報')).toBeInTheDocument()
      expect(screen.getByText('メールアドレス')).toBeInTheDocument()
      expect(screen.getByText('表示名')).toBeInTheDocument()
      expect(screen.getByText('認証状態')).toBeInTheDocument()
      
      // TaskList の API 呼び出し完了を待つ
      await waitFor(() => {
        expect(mockGetTodos).toHaveBeenCalledWith()
      })
    })

    it('フッター情報が表示される', async () => {
      const { Dashboard } = await import('../Dashboard')

      await act(async () => {
        render(<Dashboard />)
      })

      expect(screen.getByText('Cloudflare Todo Sample Application')).toBeInTheDocument()
      
      // TaskList の API 呼び出し完了を待つ
      await waitFor(() => {
        expect(mockGetTodos).toHaveBeenCalledWith()
      })
    })
  })

  describe('ユーザー情報表示', () => {

    it('displayNameが設定されている場合は挨拶でdisplayNameを使用', async () => {
      const { Dashboard } = await import('../Dashboard')

      await act(async () => {
        render(<Dashboard />)
      })

      expect(screen.getByText('おかえりなさい、Test Userさん')).toBeInTheDocument()
      
      // TaskList の API 呼び出し完了を待つ
      await waitFor(() => {
        expect(mockGetTodos).toHaveBeenCalledWith()
      })
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

      await act(async () => {
        render(<Dashboard />)
      })

      expect(screen.getByText('おかえりなさい、testさん')).toBeInTheDocument()
      
      // TaskList の API 呼び出し完了を待つ
      await waitFor(() => {
        expect(mockGetTodos).toHaveBeenCalledWith()
      })
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

      await act(async () => {
        render(<Dashboard />)
      })

      expect(screen.getByText('未設定')).toBeInTheDocument()
      
      // TaskList の API 呼び出し完了を待つ
      await waitFor(() => {
        expect(mockGetTodos).toHaveBeenCalledWith()
      })
    })


  })

  describe('ログアウト機能', () => {
    it('ログアウトボタンをクリックするとlogout関数が呼ばれる', async () => {
      mockLogout.mockResolvedValue(undefined)

      const { Dashboard } = await import('../Dashboard')

      await act(async () => {
        render(<Dashboard />)
      })

      // TaskList の API 呼び出し完了を待つ
      await waitFor(() => {
        expect(mockGetTodos).toHaveBeenCalledWith()
      })

      const logoutButton = screen.getByRole('button', { name: /ログアウト/i })
      
      await user.click(logoutButton)

      expect(mockLogout).toHaveBeenCalledTimes(1)
    })

    it('ログアウト処理が正常に完了する', async () => {
      mockLogout.mockResolvedValue(undefined)

      const { Dashboard } = await import('../Dashboard')

      await act(async () => {
        render(<Dashboard />)
      })

      // TaskList の API 呼び出し完了を待つ
      await waitFor(() => {
        expect(mockGetTodos).toHaveBeenCalledWith()
      })

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

      await act(async () => {
        render(<Dashboard />)
      })

      // TaskList の API 呼び出し完了を待つ
      await waitFor(() => {
        expect(mockGetTodos).toHaveBeenCalledWith()
      })

      const logoutButton = screen.getByRole('button', { name: /ログアウト/i })
      
      await user.click(logoutButton)

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('ログアウトエラー:', error)
      })

      consoleErrorSpy.mockRestore()
    })
  })
})