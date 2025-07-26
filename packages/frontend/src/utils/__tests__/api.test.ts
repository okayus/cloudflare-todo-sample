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

describe('apiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('HTTP Methods', () => {
    it('GETリクエストを送信できる', async () => {
      const responseData = { success: true, data: { message: 'test' } }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: vi.fn().mockResolvedValue(responseData),
      })

      const result = await get('/api/test')

      expect(mockFetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
        method: 'GET',
      }))
      expect(result).toEqual(responseData)
    })

    it('POSTリクエストでJSONデータを送信できる', async () => {
      const requestData = { title: 'テストタスク' }
      const responseData = { success: true, data: { id: '123' } }
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: vi.fn().mockResolvedValue(responseData),
      })

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
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: vi.fn().mockResolvedValue(responseData),
      })

      const result = await patch('/api/todos/123', updateData)

      expect(mockFetch).toHaveBeenCalledWith('/api/todos/123', expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify(updateData),
      }))
      expect(result).toEqual(responseData)
    })

    it('DELETEリクエストを送信できる', async () => {
      const responseData = { success: true }
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: vi.fn().mockResolvedValue(responseData),
      })

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
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Map([['content-type', 'application/json']]),
        json: vi.fn().mockResolvedValue(errorResponse),
      })

      await expect(get('/api/invalid')).rejects.toThrow('バリデーションエラー')
      await expect(get('/api/invalid')).rejects.toBeInstanceOf(ApiError)
    })

    it('ネットワークエラーでApiErrorを投げる', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(get('/api/test')).rejects.toThrow(ApiError)
    })
  })

  describe('レスポンス処理', () => {
    it('JSON以外のレスポンスをテキストとして処理する', async () => {
      const textResponse = 'Plain text response'
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'text/plain']]),
        text: vi.fn().mockResolvedValue(textResponse),
      })

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