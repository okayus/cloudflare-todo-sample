/**
 * TaskList コンポーネントのテスト
 *
 * TDD手法に従い、タスク一覧表示の動作を検証。
 * データ取得、表示、完了トグル、各種状態管理をテスト。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { PaginatedResponse, Todo, ApiResponse } from '@cloudflare-todo-sample/shared'
import { TaskList } from '../TaskList'
import * as todoApi from '../../utils/todoApi'

// AuthContext のモック
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    isLoading: false, // デフォルトは認証完了状態
    user: { uid: 'test-user', email: 'test@example.com' },
  })),
}))

// todoApi のモック
vi.mock('../../utils/todoApi', () => ({
  getTodos: vi.fn(),
  toggleTodoCompletion: vi.fn(),
}))

const mockGetTodos = vi.mocked(todoApi.getTodos)
const mockToggleTodoCompletion = vi.mocked(todoApi.toggleTodoCompletion)

// テスト用データ
const mockTodos: Todo[] = [
  {
    id: 'todo-1',
    userId: 'test-user',
    title: '最初のタスク',
    description: '最初のタスクの説明',
    completed: false,
    dueDate: '2024-12-31T23:59:59.000Z',
    createdAt: '2024-07-26T10:00:00.000Z',
    updatedAt: '2024-07-26T10:00:00.000Z',
    deletedAt: null,
    slug: 'first-task',
  },
  {
    id: 'todo-2',
    userId: 'test-user',
    title: '完了済みタスク',
    description: null,
    completed: true,
    dueDate: '2024-12-25T23:59:59.000Z',
    createdAt: '2024-07-25T15:30:00.000Z',
    updatedAt: '2024-07-26T09:00:00.000Z',
    deletedAt: null,
    slug: 'completed-task',
  },
  {
    id: 'todo-3',
    userId: 'test-user',
    title: '長いタイトルのタスクです。これは非常に長いタイトルで、表示のテストに使用されます。',
    description: '長い説明のテストです。これは非常に詳細な説明で、複数行にわたる可能性があります。UIでの表示確認に使用されます。',
    completed: false,
    dueDate: '2024-11-15T23:59:59.000Z',
    createdAt: '2024-07-20T08:00:00.000Z',
    updatedAt: '2024-07-20T08:00:00.000Z',
    deletedAt: null,
    slug: 'long-title-task',
  },
]

const mockPaginatedResponse: PaginatedResponse<Todo> = {
  success: true,
  data: mockTodos,
  pagination: {
    total: 3,
    page: 0,
    limit: 20,
    totalPages: 1,
  },
}

describe('TaskList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('認証状態管理', () => {
    it('認証状態確認中はローディングを表示する', () => {
      // AuthContextのisLoadingをtrueに設定（vi.mockで既にモック済み）
      const authContextMock = vi.mocked(require('../../contexts/AuthContext'))
      authContextMock.useAuth.mockReturnValueOnce({
        isLoading: true,
        user: null,
        login: vi.fn(),
        signup: vi.fn(),
        logout: vi.fn(),
      })

      render(<TaskList />)

      // ローディング表示の確認
      expect(screen.getByTestId('task-list-loading')).toBeInTheDocument()
      
      // API呼び出しは行われない
      expect(mockGetTodos).not.toHaveBeenCalled()
    })

    it('認証完了後にタスク取得を実行する', async () => {
      mockGetTodos.mockResolvedValueOnce(mockPaginatedResponse)

      render(<TaskList />)

      // 認証完了後にAPI呼び出しが実行される
      await waitFor(() => {
        expect(mockGetTodos).toHaveBeenCalledWith()
      })
    })
  })

  describe('データ取得・表示', () => {
    it('コンポーネント初期化時にタスク一覧を取得する', async () => {
      mockGetTodos.mockResolvedValueOnce(mockPaginatedResponse)

      render(<TaskList />)

      // API呼び出しが実行されることを確認
      await waitFor(() => {
        expect(mockGetTodos).toHaveBeenCalledWith()
      })
    })

    it('取得したタスクが正しく表示される', async () => {
      mockGetTodos.mockResolvedValueOnce(mockPaginatedResponse)

      render(<TaskList />)

      // タスクの表示を確認
      await waitFor(() => {
        expect(screen.getByText('最初のタスク')).toBeInTheDocument()
        expect(screen.getByText('完了済みタスク')).toBeInTheDocument()
        expect(screen.getByText(/長いタイトルのタスクです/)).toBeInTheDocument()
      })

      // 説明の表示確認（nullの場合は表示されない）
      expect(screen.getByText('最初のタスクの説明')).toBeInTheDocument()
      expect(screen.queryByText('完了済みタスクの説明')).not.toBeInTheDocument()
    })

    it('完了状態に応じてチェックボックスが正しく表示される', async () => {
      mockGetTodos.mockResolvedValueOnce(mockPaginatedResponse)

      render(<TaskList />)

      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox')
        expect(checkboxes).toHaveLength(3)

        // 最初のタスク（未完了）
        expect(checkboxes[0]).not.toBeChecked()
        // 完了済みタスク
        expect(checkboxes[1]).toBeChecked()
        // 長いタイトルのタスク（未完了）
        expect(checkboxes[2]).not.toBeChecked()
      })
    })

    it('タスク件数が表示される', async () => {
      mockGetTodos.mockResolvedValueOnce(mockPaginatedResponse)

      render(<TaskList />)

      await waitFor(() => {
        expect(screen.getByText('タスク 3件')).toBeInTheDocument()
      })
    })

    it('testidが設定されている', async () => {
      mockGetTodos.mockResolvedValueOnce(mockPaginatedResponse)

      render(<TaskList />)

      await waitFor(() => {
        expect(screen.getByTestId('task-list')).toBeInTheDocument()
      })
    })
  })

  describe('ローディング状態', () => {
    it('初期ローディング中はローディング表示される', () => {
      // Promiseを保留状態にしてローディング状態をシミュレート
      const pendingPromise = new Promise<PaginatedResponse<Todo>>(() => {})
      mockGetTodos.mockReturnValueOnce(pendingPromise)

      render(<TaskList />)

      expect(screen.getByText('タスクを読み込み中...')).toBeInTheDocument()
      expect(screen.getByTestId('task-list-loading')).toBeInTheDocument()
    })

    it('データ取得完了後はローディングが消える', async () => {
      mockGetTodos.mockResolvedValueOnce(mockPaginatedResponse)

      render(<TaskList />)

      // 最初はローディング表示
      expect(screen.getByText('タスクを読み込み中...')).toBeInTheDocument()

      // データ取得後はローディングが消える
      await waitFor(() => {
        expect(screen.queryByText('タスクを読み込み中...')).not.toBeInTheDocument()
        expect(screen.queryByTestId('task-list-loading')).not.toBeInTheDocument()
      })
    })
  })

  describe('エラー状態', () => {
    it('データ取得失敗時にエラーメッセージが表示される', async () => {
      const errorMessage = 'ネットワークエラー'
      mockGetTodos.mockRejectedValueOnce(new Error(errorMessage))

      render(<TaskList />)

      await waitFor(() => {
        expect(screen.getByText('タスクの取得に失敗しました')).toBeInTheDocument()
        expect(screen.getByTestId('task-list-error')).toBeInTheDocument()
      })
    })

    it('エラー状態で再試行ボタンが表示される', async () => {
      mockGetTodos.mockRejectedValueOnce(new Error('Server error'))

      render(<TaskList />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '再試行' })).toBeInTheDocument()
      })
    })

    it('再試行ボタンクリックで再度データ取得が実行される', async () => {
      const user = userEvent.setup()
      
      // 最初は失敗
      mockGetTodos.mockRejectedValueOnce(new Error('Server error'))
      // 再試行では成功
      mockGetTodos.mockResolvedValueOnce(mockPaginatedResponse)

      render(<TaskList />)

      // エラー状態を確認
      await waitFor(() => {
        expect(screen.getByRole('button', { name: '再試行' })).toBeInTheDocument()
      })

      // 再試行ボタンをクリック
      await user.click(screen.getByRole('button', { name: '再試行' }))

      // 2回目のAPI呼び出しが実行される
      await waitFor(() => {
        expect(mockGetTodos).toHaveBeenCalledTimes(2)
      })

      // データが表示される
      await waitFor(() => {
        expect(screen.getByText('最初のタスク')).toBeInTheDocument()
      })
    })
  })

  describe('空状態', () => {
    it('タスクが0件の場合に空状態メッセージが表示される', async () => {
      const emptyResponse: PaginatedResponse<Todo> = {
        success: true,
        data: [],
        pagination: {
          total: 0,
          page: 0,
          limit: 20,
          totalPages: 0,
        },
      }

      mockGetTodos.mockResolvedValueOnce(emptyResponse)

      render(<TaskList />)

      await waitFor(() => {
        expect(screen.getByText('タスクがありません')).toBeInTheDocument()
        expect(screen.getByText('新しいタスクを作成してみましょう')).toBeInTheDocument()
        expect(screen.getByTestId('task-list-empty')).toBeInTheDocument()
      })
    })

    it('空状態でタスク件数が0件と表示される', async () => {
      const emptyResponse: PaginatedResponse<Todo> = {
        success: true,
        data: [],
        pagination: {
          total: 0,
          page: 0,
          limit: 20,
          totalPages: 0,
        },
      }

      mockGetTodos.mockResolvedValueOnce(emptyResponse)

      render(<TaskList />)

      await waitFor(() => {
        expect(screen.getByText('タスク 0件')).toBeInTheDocument()
      })
    })
  })

  describe('完了トグル機能', () => {
    it('未完了タスクのチェックボックスをクリックして完了にする', async () => {
      const user = userEvent.setup()
      
      mockGetTodos.mockResolvedValueOnce(mockPaginatedResponse)
      
      const updatedTodo: Todo = { ...mockTodos[0], completed: true }
      const updateResponse: ApiResponse<Todo> = {
        success: true,
        data: updatedTodo,
      }
      mockToggleTodoCompletion.mockResolvedValueOnce(updateResponse)

      render(<TaskList />)

      // データが表示されるまで待つ
      await waitFor(() => {
        expect(screen.getByText('最初のタスク')).toBeInTheDocument()
      })

      // 最初のタスクのチェックボックスをクリック
      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[0])

      // API呼び出しが実行される
      await waitFor(() => {
        expect(mockToggleTodoCompletion).toHaveBeenCalledWith('first-task', true)
      })

      // チェックボックスが即座に更新される（楽観的UI更新）
      expect(checkboxes[0]).toBeChecked()
    })

    it('完了済みタスクのチェックボックスをクリックして未完了にする', async () => {
      const user = userEvent.setup()
      
      mockGetTodos.mockResolvedValueOnce(mockPaginatedResponse)
      
      const updatedTodo: Todo = { ...mockTodos[1], completed: false }
      const updateResponse: ApiResponse<Todo> = {
        success: true,
        data: updatedTodo,
      }
      mockToggleTodoCompletion.mockResolvedValueOnce(updateResponse)

      render(<TaskList />)

      // データが表示されるまで待つ
      await waitFor(() => {
        expect(screen.getByText('完了済みタスク')).toBeInTheDocument()
      })

      // 完了済みタスクのチェックボックスをクリック
      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[1])

      // API呼び出しが実行される
      await waitFor(() => {
        expect(mockToggleTodoCompletion).toHaveBeenCalledWith('completed-task', false)
      })

      // チェックボックスが即座に更新される
      expect(checkboxes[1]).not.toBeChecked()
    })

    it('完了トグル失敗時にエラーメッセージが表示される', async () => {
      const user = userEvent.setup()
      
      mockGetTodos.mockResolvedValueOnce(mockPaginatedResponse)
      mockToggleTodoCompletion.mockRejectedValueOnce(new Error('更新失敗'))

      render(<TaskList />)

      // データが表示されるまで待つ
      await waitFor(() => {
        expect(screen.getByText('最初のタスク')).toBeInTheDocument()
      })

      // チェックボックスをクリック
      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[0])

      // エラーメッセージが表示される
      await waitFor(() => {
        expect(screen.getByText('タスクの更新に失敗しました')).toBeInTheDocument()
      })

      // チェックボックスが元の状態に戻る（ロールバック）
      expect(checkboxes[0]).not.toBeChecked()
    })
  })

  describe('再取得機能', () => {
    it('onRefreshプロップが提供された場合、データ更新後に呼び出される', async () => {
      const user = userEvent.setup()
      const onRefresh = vi.fn()
      
      mockGetTodos.mockResolvedValueOnce(mockPaginatedResponse)
      
      const updatedTodo: Todo = { ...mockTodos[0], completed: true }
      const updateResponse: ApiResponse<Todo> = {
        success: true,
        data: updatedTodo,
      }
      mockToggleTodoCompletion.mockResolvedValueOnce(updateResponse)

      render(<TaskList onRefresh={onRefresh} />)

      // データが表示されるまで待つ
      await waitFor(() => {
        expect(screen.getByText('最初のタスク')).toBeInTheDocument()
      })

      // チェックボックスをクリック
      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[0])

      // onRefreshが呼び出される
      await waitFor(() => {
        expect(onRefresh).toHaveBeenCalled()
      })
    })
  })

  describe('プロップス', () => {
    it('disabledプロップがtrueの場合、チェックボックスが無効になる', async () => {
      mockGetTodos.mockResolvedValueOnce(mockPaginatedResponse)

      render(<TaskList disabled={true} />)

      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox')
        checkboxes.forEach(checkbox => {
          expect(checkbox).toBeDisabled()
        })
      })
    })

    it('カスタムクラス名が適用される', async () => {
      mockGetTodos.mockResolvedValueOnce(mockPaginatedResponse)

      render(<TaskList className="custom-task-list" />)

      await waitFor(() => {
        const taskList = screen.getByTestId('task-list')
        expect(taskList).toHaveClass('custom-task-list')
      })
    })
  })
})