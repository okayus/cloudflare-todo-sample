/**
 * Todo API クライアントのテスト
 *
 * バックエンドTodo APIとの通信機能を検証。
 * 型安全性とエラーハンドリングをテスト。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Todo, CreateTodo, UpdateTodo, PaginatedResponse, ApiResponse } from '@cloudflare-todo-sample/shared'
import {
  getTodos,
  getTodo,
  createTodo,
  updateTodo,
  deleteTodo,
  toggleTodoCompletion,
  DEFAULT_TODO_QUERY,
} from '../todoApi'
import * as api from '../api'

// api.ts のモック
vi.mock('../api', () => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  del: vi.fn(),
  ApiError: class MockApiError extends Error {
    constructor(public status: number, message: string, public response?: unknown) {
      super(message)
      this.name = 'ApiError'
    }
  },
}))

const mockGet = vi.mocked(api.get)
const mockPost = vi.mocked(api.post)
const mockPatch = vi.mocked(api.patch)
const mockDel = vi.mocked(api.del)

// テスト用データ
const mockTodo: Todo = {
  id: 'test-todo-id',
  userId: 'test-user-id',
  title: 'テストタスク',
  description: 'テスト用の説明',
  completed: false,
  dueDate: '2024-12-31T23:59:59.000Z',
  createdAt: '2024-07-26T10:00:00.000Z',
  updatedAt: '2024-07-26T10:00:00.000Z',
  deletedAt: null,
  slug: 'test-task-slug',
}

const mockCreateTodoData: CreateTodo = {
  title: '新しいタスク',
  description: '新しいタスクの説明',
  dueDate: '2024-12-31T23:59:59.000Z',
}

const mockUpdateTodoData: UpdateTodo = {
  title: '更新されたタスク',
  completed: true,
}

describe('todoApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // 環境変数をクリア
    vi.stubEnv('VITE_API_BASE_URL', undefined)
  })

  describe('getTodos', () => {
    it('Todo一覧を取得する（クエリパラメータなし）', async () => {
      const mockResponse: PaginatedResponse<Todo> = {
        success: true,
        data: [mockTodo],
        pagination: {
          total: 1,
          page: 0,
          limit: 20,
          totalPages: 1,
        },
      }

      mockGet.mockResolvedValueOnce(mockResponse)

      const result = await getTodos()

      expect(mockGet).toHaveBeenCalledWith('http://localhost:8787/api/todos')
      expect(result).toEqual(mockResponse)
    })

    it('Todo一覧を取得する（フィルタリング付き）', async () => {
      const query = {
        completed: true,
        search: 'テスト',
        page: 1,
        limit: 10,
        field: 'dueDate' as const,
        order: 'asc' as const,
      }

      const mockResponse: PaginatedResponse<Todo> = {
        success: true,
        data: [mockTodo],
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      }

      mockGet.mockResolvedValueOnce(mockResponse)

      const result = await getTodos(query)

      expect(mockGet).toHaveBeenCalledWith(
        'http://localhost:8787/api/todos?completed=true&search=%E3%83%86%E3%82%B9%E3%83%88&page=1&limit=10&field=dueDate&order=asc'
      )
      expect(result).toEqual(mockResponse)
    })

    it('undefinedやnullの値を除外してクエリパラメータを構築する', async () => {
      const query = {
        completed: undefined,
        search: null,
        page: 0,
        limit: 20,
      }

      const mockResponse: PaginatedResponse<Todo> = {
        success: true,
        data: [],
        pagination: {
          total: 0,
          page: 0,
          limit: 20,
          totalPages: 0,
        },
      }

      mockGet.mockResolvedValueOnce(mockResponse)

      await getTodos(query as any)

      expect(mockGet).toHaveBeenCalledWith(
        'http://localhost:8787/api/todos?page=0&limit=20'
      )
    })

    it('デフォルトのAPI_BASE_URLを使用する', async () => {
      const mockResponse: PaginatedResponse<Todo> = {
        success: true,
        data: [],
        pagination: { total: 0, page: 0, limit: 20, totalPages: 0 },
      }

      mockGet.mockResolvedValueOnce(mockResponse)

      await getTodos()

      expect(mockGet).toHaveBeenCalledWith('http://localhost:8787/api/todos')
    })
  })

  describe('getTodo', () => {
    it('Todo詳細を取得する', async () => {
      const mockResponse: ApiResponse<Todo> = {
        success: true,
        data: mockTodo,
      }

      mockGet.mockResolvedValueOnce(mockResponse)

      const result = await getTodo('test-slug')

      expect(mockGet).toHaveBeenCalledWith('http://localhost:8787/api/todos/test-slug')
      expect(result).toEqual(mockResponse)
    })

    it('スラッグをURLエンコードする', async () => {
      const mockResponse: ApiResponse<Todo> = {
        success: true,
        data: mockTodo,
      }

      mockGet.mockResolvedValueOnce(mockResponse)

      await getTodo('テスト スラッグ/特殊文字')

      expect(mockGet).toHaveBeenCalledWith(
        'http://localhost:8787/api/todos/%E3%83%86%E3%82%B9%E3%83%88%20%E3%82%B9%E3%83%A9%E3%83%83%E3%82%B0%2F%E7%89%B9%E6%AE%8A%E6%96%87%E5%AD%97'
      )
    })
  })

  describe('createTodo', () => {
    it('新しいTodoを作成する', async () => {
      const mockResponse: ApiResponse<Todo> = {
        success: true,
        data: { ...mockTodo, ...mockCreateTodoData },
      }

      mockPost.mockResolvedValueOnce(mockResponse)

      const result = await createTodo(mockCreateTodoData)

      expect(mockPost).toHaveBeenCalledWith(
        'http://localhost:8787/api/todos',
        mockCreateTodoData
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('updateTodo', () => {
    it('既存のTodoを更新する', async () => {
      const mockResponse: ApiResponse<Todo> = {
        success: true,
        data: { ...mockTodo, ...mockUpdateTodoData },
      }

      mockPatch.mockResolvedValueOnce(mockResponse)

      const result = await updateTodo('test-slug', mockUpdateTodoData)

      expect(mockPatch).toHaveBeenCalledWith(
        'http://localhost:8787/api/todos/test-slug',
        mockUpdateTodoData
      )
      expect(result).toEqual(mockResponse)
    })

    it('スラッグをURLエンコードする', async () => {
      const mockResponse: ApiResponse<Todo> = {
        success: true,
        data: mockTodo,
      }

      mockPatch.mockResolvedValueOnce(mockResponse)

      await updateTodo('特殊/文字', mockUpdateTodoData)

      expect(mockPatch).toHaveBeenCalledWith(
        'http://localhost:8787/api/todos/%E7%89%B9%E6%AE%8A%2F%E6%96%87%E5%AD%97',
        mockUpdateTodoData
      )
    })
  })

  describe('deleteTodo', () => {
    it('Todoを削除する', async () => {
      const mockResponse: ApiResponse<void> = {
        success: true,
      }

      mockDel.mockResolvedValueOnce(mockResponse)

      const result = await deleteTodo('test-slug')

      expect(mockDel).toHaveBeenCalledWith('http://localhost:8787/api/todos/test-slug')
      expect(result).toEqual(mockResponse)
    })
  })

  describe('toggleTodoCompletion', () => {
    it('Todo完了状態をtrueに切り替える', async () => {
      const mockResponse: ApiResponse<Todo> = {
        success: true,
        data: { ...mockTodo, completed: true },
      }

      mockPatch.mockResolvedValueOnce(mockResponse)

      const result = await toggleTodoCompletion('test-slug', true)

      expect(mockPatch).toHaveBeenCalledWith(
        'http://localhost:8787/api/todos/test-slug',
        { completed: true }
      )
      expect(result).toEqual(mockResponse)
    })

    it('Todo完了状態をfalseに切り替える', async () => {
      const mockResponse: ApiResponse<Todo> = {
        success: true,
        data: { ...mockTodo, completed: false },
      }

      mockPatch.mockResolvedValueOnce(mockResponse)

      const result = await toggleTodoCompletion('test-slug', false)

      expect(mockPatch).toHaveBeenCalledWith(
        'http://localhost:8787/api/todos/test-slug',
        { completed: false }
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('DEFAULT_TODO_QUERY', () => {
    it('デフォルトクエリ設定が正しい', () => {
      expect(DEFAULT_TODO_QUERY).toEqual({
        page: 0,
        limit: 20,
        field: 'createdAt',
        order: 'desc',
      })
    })
  })

  describe('エラーハンドリング', () => {
    it('APIエラーをそのまま再スローする', async () => {
      const apiError = new api.ApiError(404, 'Todo not found')
      mockGet.mockRejectedValueOnce(apiError)

      await expect(getTodo('nonexistent')).rejects.toThrow('Todo not found')
      
      // 2回目の呼び出し用に再度エラーを設定
      mockGet.mockRejectedValueOnce(apiError)
      await expect(getTodo('nonexistent')).rejects.toBeInstanceOf(api.ApiError)
    })
  })
})