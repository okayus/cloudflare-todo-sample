/**
 * APIクライアントのテスト
 *
 * HTTP通信とエラーハンドリングの動作を検証。
 * 重要な機能に絞った簡潔なテスト。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { get, post, patch, del, ApiError } from '../api'

// グローバルfetchのモック
const mockFetch = vi.fn()
global.fetch = mockFetch

// Headersオブジェクトのモックヘルパー
function createMockHeaders(headers: Record<string, string>) {
  return {
    get: vi.fn().mockImplementation((name: string) => headers[name.toLowerCase()] || null),
    has: vi.fn().mockImplementation((name: string) => name.toLowerCase() in headers),
    entries: vi.fn().mockReturnValue(Object.entries(headers)),
  }
}

// 成功レスポンスのモックヘルパー
function createSuccessResponse(data: unknown, contentType = 'application/json') {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: createMockHeaders({ 'content-type': contentType }),
    json: vi.fn().mockResolvedValue(data),
    text: vi.fn().mockResolvedValue(typeof data === 'string' ? data : JSON.stringify(data)),
  }
}

// エラーレスポンスのモックヘルパー
function createErrorResponse(status: number, statusText: string, errorData: unknown, contentType = 'application/json') {
  return {
    ok: false,
    status,
    statusText,
    headers: createMockHeaders({ 'content-type': contentType }),
    json: vi.fn().mockResolvedValue(errorData),
    text: vi.fn().mockResolvedValue(typeof errorData === 'string' ? errorData : JSON.stringify(errorData)),
  }
}

describe('apiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('HTTP Methods', () => {
    it('GETリクエストを送信できる', async () => {
      const responseData = { success: true, data: { message: 'test' } }
      mockFetch.mockResolvedValueOnce(createSuccessResponse(responseData))

      const result = await get('/api/test')

      expect(mockFetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
        method: 'GET',
      }))
      expect(result).toEqual(responseData)
    })

    it('POSTリクエストでJSONデータを送信できる', async () => {
      const requestData = { title: 'テストタスク' }
      const responseData = { success: true, data: { id: '123' } }
      
      mockFetch.mockResolvedValueOnce(createSuccessResponse(responseData))

      const result = await post('/api/todos', requestData)

      expect(mockFetch).toHaveBeenCalledWith('/api/todos', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(requestData),
      }))
      expect(result).toEqual(responseData)
    })

    it('PATCHリクエストでデータを更新できる', async () => {
      const updateData = { completed: true }
      const responseData = { success: true }
      
      mockFetch.mockResolvedValueOnce(createSuccessResponse(responseData))

      const result = await patch('/api/todos/123', updateData)

      expect(mockFetch).toHaveBeenCalledWith('/api/todos/123', expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify(updateData),
      }))
      expect(result).toEqual(responseData)
    })

    it('DELETEリクエストを送信できる', async () => {
      const responseData = { success: true }
      
      mockFetch.mockResolvedValueOnce(createSuccessResponse(responseData))

      const result = await del('/api/todos/123')

      expect(mockFetch).toHaveBeenCalledWith('/api/todos/123', expect.objectContaining({
        method: 'DELETE',
      }))
      expect(result).toEqual(responseData)
    })
  })

  describe('エラーハンドリング', () => {
    it('HTTPエラーレスポンスでApiErrorを投げる', async () => {
      const errorResponse = { success: false, error: 'バリデーションエラー' }
      mockFetch.mockResolvedValueOnce(createErrorResponse(400, 'Bad Request', errorResponse))

      await expect(get('/api/invalid')).rejects.toThrow('バリデーションエラー')
    })

    it('ネットワークエラーでApiErrorを投げる', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(get('/api/test')).rejects.toThrow('Network error')
    })
  })

  describe('レスポンス処理', () => {
    it('JSON以外のレスポンスをテキストとして処理する', async () => {
      const textResponse = 'Plain text response'
      mockFetch.mockResolvedValueOnce(createSuccessResponse(textResponse, 'text/plain'))

      const result = await get('/api/text')
      expect(result).toBe(textResponse)
    })
  })

  describe('ApiErrorクラス', () => {
    it('適切なプロパティを持つ', () => {
      const error = new ApiError(404, 'Not found', { detail: 'Resource not found' })
      
      expect(error).toBeInstanceOf(Error)
      expect(error.name).toBe('ApiError')
      expect(error.status).toBe(404)
      expect(error.message).toBe('Not found')
      expect(error.response).toEqual({ detail: 'Resource not found' })
    })
  })
})