/**
 * APIクライアントユーティリティ
 *
 * Firebase認証トークンを自動付与するHTTPクライアント。
 * バックエンドAPIとの通信で共通的に使用される。
 * エラーハンドリングとレスポンス正規化を提供。
 */
import { auth } from '../config/firebase'

/**
 * APIエラークラス
 *
 * HTTPエラーレスポンスを表現するカスタムエラー。
 * ステータスコードとエラーメッセージを保持。
 */
export class ApiError extends Error {
  constructor(
    /** HTTPステータスコード */
    public readonly status: number,
    /** エラーメッセージ */
    message: string,
    /** レスポンスボディ（任意） */
    public readonly response?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * 認証ヘッダー取得
 *
 * Firebase認証からIDトークンを取得し、
 * Authorization ヘッダー用の文字列を返す。
 * 未認証の場合はnullを返す。
 *
 * @returns Promise<string | null> - "Bearer {token}" 形式、または null
 */
async function getAuthHeader(): Promise<string | null> {
  try {
    const authInstance = await auth()
    const currentUser = authInstance.currentUser

    if (!currentUser) {
      return null
    }

    const token = await currentUser.getIdToken()
    return `Bearer ${token}`
  } catch (error) {
    console.error('認証トークン取得エラー:', error)
    return null
  }
}

/**
 * APIレスポンス処理
 *
 * fetchのResponseオブジェクトを処理し、
 * エラーレスポンスの場合はApiErrorを投げる。
 * 正常レスポンスの場合はJSONパースして返す。
 *
 * @param response - fetch Response オブジェクト
 * @returns Promise<T> - パースされたレスポンスボディ
 * @throws ApiError - HTTPエラーレスポンスの場合
 */
async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type')
  const isJson = contentType && contentType.includes('application/json')

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`
    let errorResponse: unknown = null

    if (isJson) {
      try {
        errorResponse = await response.json()
        // エラーレスポンスからメッセージを抽出
        if (typeof errorResponse === 'object' && errorResponse !== null && 'error' in errorResponse) {
          errorMessage = (errorResponse as { error: string }).error
        }
      } catch (parseError) {
        console.error('エラーレスポンスのパースに失敗:', parseError)
      }
    }

    throw new ApiError(response.status, errorMessage, errorResponse)
  }

  if (isJson) {
    return await response.json()
  }

  // JSONでない場合はテキストとして返す
  return (await response.text()) as unknown as T
}

/**
 * 汎用APIクライアント
 *
 * Firebase認証トークンを自動付与するfetchラッパー。
 * 共通的なヘッダー設定とエラーハンドリングを提供。
 *
 * @param url - リクエストURL
 * @param options - fetch オプション
 * @returns Promise<T> - レスポンスデータ
 * @throws ApiError - HTTPエラーまたはネットワークエラーの場合
 */
export async function apiClient<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    // 認証ヘッダーを取得
    const authHeader = await getAuthHeader()

    // デフォルトヘッダーを設定
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...Object.fromEntries(
        Object.entries(options.headers || {}).map(([key, value]) => [key, String(value)])
      ),
    }

    // 認証ヘッダーが取得できた場合は追加
    if (authHeader) {
      headers.Authorization = authHeader
    }

    // API呼び出し実行
    const response = await fetch(url, {
      ...options,
      headers,
    })

    return await handleResponse<T>(response)
  } catch (error) {
    // ApiErrorはそのまま再スロー
    if (error instanceof ApiError) {
      throw error
    }

    // ネットワークエラーなどの場合
    console.error('API呼び出しエラー:', error)
    throw new ApiError(
      0,
      error instanceof Error ? error.message : 'ネットワークエラーが発生しました'
    )
  }
}

/**
 * GET リクエスト
 *
 * @param url - リクエストURL
 * @returns Promise<T> - レスポンスデータ
 */
export function get<T>(url: string): Promise<T> {
  return apiClient<T>(url, { method: 'GET' })
}

/**
 * POST リクエスト
 *
 * @param url - リクエストURL
 * @param data - リクエストボディ
 * @returns Promise<T> - レスポンスデータ
 */
export function post<T>(url: string, data?: unknown): Promise<T> {
  return apiClient<T>(url, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  })
}

/**
 * PATCH リクエスト
 *
 * @param url - リクエストURL
 * @param data - リクエストボディ
 * @returns Promise<T> - レスポンスデータ
 */
export function patch<T>(url: string, data: unknown): Promise<T> {
  return apiClient<T>(url, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

/**
 * DELETE リクエスト
 *
 * @param url - リクエストURL
 * @returns Promise<T> - レスポンスデータ
 */
export function del<T>(url: string): Promise<T> {
  return apiClient<T>(url, { method: 'DELETE' })
}