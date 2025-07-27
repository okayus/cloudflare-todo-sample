/**
 * TaskCreateForm コンポーネントのテスト
 *
 * TDD手法に従い、タスク作成フォームの動作を検証。
 * フォームバリデーション、API連携、エラーハンドリングをテスト。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ApiResponse, Todo } from '@cloudflare-todo-sample/shared'
import { TaskCreateForm } from '../TaskCreateForm'
import * as todoApi from '../../utils/todoApi'

// todoApi のモック
vi.mock('../../utils/todoApi', () => ({
  createTodo: vi.fn(),
}))

const mockCreateTodo = vi.mocked(todoApi.createTodo)

// テスト用データ
const mockCreatedTodo: Todo = {
  id: 'test-todo-id',
  userId: 'test-user-id',
  title: '新しいタスク',
  description: 'テスト用の説明',
  completed: false,
  dueDate: '2024-12-31T23:59:59.000Z',
  createdAt: '2024-07-26T20:00:00.000Z',
  updatedAt: '2024-07-26T20:00:00.000Z',
  deletedAt: null,
  slug: 'new-task-slug',
}

describe('TaskCreateForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('フォーム表示', () => {
    it('必要なフォーム要素が表示される', () => {
      render(<TaskCreateForm onSuccess={vi.fn()} />)

      // フォーム要素の存在確認
      expect(screen.getByLabelText(/タイトル/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/説明/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/期限日/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /作成/i })).toBeInTheDocument()
    })

    it('初期状態では送信ボタンが無効でない', () => {
      render(<TaskCreateForm onSuccess={vi.fn()} />)

      const submitButton = screen.getByRole('button', { name: /作成/i })
      expect(submitButton).not.toBeDisabled()
    })

    it('フォームのtestidが設定されている', () => {
      render(<TaskCreateForm onSuccess={vi.fn()} />)

      expect(screen.getByTestId('task-create-form')).toBeInTheDocument()
    })
  })

  describe('バリデーション', () => {
    it('タイトルが空の場合エラーメッセージを表示する', async () => {
      const user = userEvent.setup()
      render(<TaskCreateForm onSuccess={vi.fn()} />)

      const titleInput = screen.getByLabelText(/タイトル/i)
      const submitButton = screen.getByRole('button', { name: /作成/i })

      // タイトルを空にして送信
      await user.clear(titleInput)
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('タイトルは必須です')).toBeInTheDocument()
      })
    })

    it('タイトルが200文字を超える場合エラーメッセージを表示する', async () => {
      const user = userEvent.setup()
      render(<TaskCreateForm onSuccess={vi.fn()} />)

      const titleInput = screen.getByLabelText(/タイトル/i)
      const submitButton = screen.getByRole('button', { name: /作成/i })

      // 201文字のタイトルを入力
      const longTitle = 'あ'.repeat(201)
      await user.type(titleInput, longTitle)
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('タイトルは200文字以内で入力してください')).toBeInTheDocument()
      })
    })

    it('説明が1000文字を超える場合エラーメッセージを表示する', async () => {
      const user = userEvent.setup()
      render(<TaskCreateForm onSuccess={vi.fn()} />)

      const titleInput = screen.getByLabelText(/タイトル/i)
      const descriptionInput = screen.getByLabelText(/説明/i)
      const submitButton = screen.getByRole('button', { name: /作成/i })

      // 有効なタイトルと1001文字の説明を入力
      await user.type(titleInput, '有効なタイトル')
      const longDescription = 'あ'.repeat(1001)
      await user.type(descriptionInput, longDescription)
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('説明は1000文字以内で入力してください')).toBeInTheDocument()
      })
    })

    it('期限日が空の場合エラーメッセージを表示する', async () => {
      const user = userEvent.setup()
      render(<TaskCreateForm onSuccess={vi.fn()} />)

      const titleInput = screen.getByLabelText(/タイトル/i)
      const dueDateInput = screen.getByLabelText(/期限日/i)
      const submitButton = screen.getByRole('button', { name: /作成/i })

      // 有効なタイトルのみ入力（期限日は空のまま）
      await user.type(titleInput, '有効なタイトル')
      
      // 期限日を空のままにして送信
      fireEvent.change(dueDateInput, { target: { value: '' } })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('期限日は必須です')).toBeInTheDocument()
      })
    })
  })

  describe('フォーム送信', () => {
    it('有効なデータで送信が成功する', async () => {
      const user = userEvent.setup()
      const onSuccess = vi.fn()
      const mockResponse: ApiResponse<Todo> = {
        success: true,
        data: mockCreatedTodo,
      }

      mockCreateTodo.mockResolvedValueOnce(mockResponse)

      render(<TaskCreateForm onSuccess={onSuccess} />)

      const titleInput = screen.getByLabelText(/タイトル/i)
      const descriptionInput = screen.getByLabelText(/説明/i)
      const dueDateInput = screen.getByLabelText(/期限日/i)
      const submitButton = screen.getByRole('button', { name: /作成/i })

      // フォームに入力
      await user.type(titleInput, '新しいタスク')
      await user.type(descriptionInput, 'テスト用の説明')
      await user.type(dueDateInput, '2024-12-31')

      // 送信
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockCreateTodo).toHaveBeenCalledWith({
          title: '新しいタスク',
          description: 'テスト用の説明',
          dueDate: expect.stringContaining('2024-12-31'), // 日付部分が含まれることを確認
        })
      })

      expect(onSuccess).toHaveBeenCalledWith(mockCreatedTodo)
    })

    it('説明が空の場合でも送信できる', async () => {
      const user = userEvent.setup()
      const onSuccess = vi.fn()
      const mockResponse: ApiResponse<Todo> = {
        success: true,
        data: { ...mockCreatedTodo, description: null },
      }

      mockCreateTodo.mockResolvedValueOnce(mockResponse)

      render(<TaskCreateForm onSuccess={onSuccess} />)

      const titleInput = screen.getByLabelText(/タイトル/i)
      const dueDateInput = screen.getByLabelText(/期限日/i)
      const submitButton = screen.getByRole('button', { name: /作成/i })

      // タイトルと期限日のみ入力
      await user.type(titleInput, '新しいタスク')
      await user.type(dueDateInput, '2024-12-31')

      await user.click(submitButton)

      await waitFor(() => {
        expect(mockCreateTodo).toHaveBeenCalledWith({
          title: '新しいタスク',
          description: '', // 空文字として送信されることを期待
          dueDate: expect.stringContaining('2024-12-31'),
        })
      })

      expect(onSuccess).toHaveBeenCalled()
    })
  })

  describe('ローディング状態', () => {
    it('送信中はローディング状態を表示する', async () => {
      const user = userEvent.setup()
      let resolvePromise: ((value: ApiResponse<Todo>) => void) | undefined

      const promise = new Promise<ApiResponse<Todo>>((resolve) => {
        resolvePromise = resolve
      })

      mockCreateTodo.mockReturnValueOnce(promise)

      render(<TaskCreateForm onSuccess={vi.fn()} />)

      const titleInput = screen.getByLabelText(/タイトル/i)
      const dueDateInput = screen.getByLabelText(/期限日/i)
      const submitButton = screen.getByRole('button', { name: /作成/i })

      // フォームに入力
      await user.type(titleInput, '新しいタスク')
      await user.type(dueDateInput, '2024-12-31')

      // 送信
      await user.click(submitButton)

      // ローディング状態の確認
      await waitFor(() => {
        expect(screen.getByText(/作成中.../i)).toBeInTheDocument()
        expect(submitButton).toBeDisabled()
      })

      // 送信完了
      act(() => {
        resolvePromise!({
          success: true,
          data: mockCreatedTodo,
        })
      })

      // ローディングが終了することを確認
      await waitFor(() => {
        expect(screen.queryByText(/作成中.../i)).not.toBeInTheDocument()
        expect(submitButton).not.toBeDisabled()
      })
    })
  })

  describe('エラーハンドリング', () => {
    it('API エラー時にエラーメッセージを表示する', async () => {
      const user = userEvent.setup()
      const onError = vi.fn()

      mockCreateTodo.mockRejectedValueOnce(new Error('サーバーエラー'))

      render(<TaskCreateForm onSuccess={vi.fn()} onError={onError} />)

      const titleInput = screen.getByLabelText(/タイトル/i)
      const dueDateInput = screen.getByLabelText(/期限日/i)
      const submitButton = screen.getByRole('button', { name: /作成/i })

      // フォームに入力
      await user.type(titleInput, '新しいタスク')
      await user.type(dueDateInput, '2024-12-31')

      // 送信
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('サーバーエラー')).toBeInTheDocument()
      })

      expect(onError).toHaveBeenCalledWith(expect.any(Error))
    })

    it('バリデーションエラー時に詳細メッセージを表示する', async () => {
      const user = userEvent.setup()
      const apiError = {
        success: false,
        error: 'バリデーションエラー: タイトルが重複しています',
      }

      mockCreateTodo.mockRejectedValueOnce(apiError)

      render(<TaskCreateForm onSuccess={vi.fn()} />)

      const titleInput = screen.getByLabelText(/タイトル/i)
      const dueDateInput = screen.getByLabelText(/期限日/i)
      const submitButton = screen.getByRole('button', { name: /作成/i })

      // フォームに入力
      await user.type(titleInput, '重複タスク')
      await user.type(dueDateInput, '2024-12-31')

      // 送信
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('バリデーションエラー: タイトルが重複しています')).toBeInTheDocument()
      })
    })
  })

  describe('フォームリセット', () => {
    it('送信成功後にフォームがリセットされる', async () => {
      const user = userEvent.setup()
      const onSuccess = vi.fn()
      const mockResponse: ApiResponse<Todo> = {
        success: true,
        data: mockCreatedTodo,
      }

      mockCreateTodo.mockResolvedValueOnce(mockResponse)

      render(<TaskCreateForm onSuccess={onSuccess} />)

      const titleInput = screen.getByLabelText(/タイトル/i) as HTMLInputElement
      const descriptionInput = screen.getByLabelText(/説明/i) as HTMLTextAreaElement
      const dueDateInput = screen.getByLabelText(/期限日/i) as HTMLInputElement
      const submitButton = screen.getByRole('button', { name: /作成/i })

      // フォームに入力
      await user.type(titleInput, '新しいタスク')
      await user.type(descriptionInput, 'テスト用の説明')
      await user.type(dueDateInput, '2024-12-31')

      // 送信
      await user.click(submitButton)

      // 送信成功を待つ
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
      })

      // フォームがリセットされることを確認
      await waitFor(() => {
        expect(titleInput.value).toBe('')
        expect(descriptionInput.value).toBe('')
        expect(dueDateInput.value).toBe('')
      })
    })
  })
})