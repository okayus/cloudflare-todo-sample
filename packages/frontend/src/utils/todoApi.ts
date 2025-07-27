/**
 * Todo API クライアント
 *
 * バックエンドのTodo関連APIとの通信を担当する。
 * shared packageの型定義を使用して型安全性を確保。
 * CRUD操作とフィルタリング・ページネーションに対応。
 */
import type {
  Todo,
  CreateTodo,
  UpdateTodo,
  TodoFilters,
  TodoSort,
  Pagination,
  PaginatedResponse,
  ApiResponse,
} from '@cloudflare-todo-sample/shared'
import { get, post, patch, del } from './api'

/**
 * バックエンドAPIのベースURL
 *
 * 開発環境では localhost、本番環境では実際のWorkers URLを使用。
 * 環境変数 VITE_API_BASE_URL で設定可能。
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787'

/**
 * Todo一覧取得のクエリパラメータ型
 *
 * フィルタリング、ソート、ページネーションの
 * 全オプションを含む検索条件。
 */
export interface TodoListQuery extends Partial<TodoFilters>, Partial<TodoSort>, Partial<Pagination> {}

/**
 * Todo一覧取得
 *
 * 認証済みユーザーのTodo一覧を取得する。
 * フィルタリング、ソート、ページネーションに対応。
 *
 * @param query - 検索条件（任意）
 * @returns Promise<PaginatedResponse<Todo>> - ページネーション情報付きTodo一覧
 * @throws ApiError - API呼び出しエラーの場合
 */
export async function getTodos(query: TodoListQuery = {}): Promise<PaginatedResponse<Todo>> {
  // クエリパラメータを構築
  const searchParams = new URLSearchParams()
  
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value))
    }
  })

  const queryString = searchParams.toString()
  const url = `${API_BASE_URL}/api/todos${queryString ? `?${queryString}` : ''}`

  return get<PaginatedResponse<Todo>>(url)
}

/**
 * Todo詳細取得
 *
 * 指定されたスラッグのTodo詳細を取得する。
 * 自分が作成したTodoのみ取得可能。
 *
 * @param slug - TodoのURL用スラッグ
 * @returns Promise<ApiResponse<Todo>> - Todo詳細データ
 * @throws ApiError - Todo が見つからない場合や権限がない場合
 */
export async function getTodo(slug: string): Promise<ApiResponse<Todo>> {
  const url = `${API_BASE_URL}/api/todos/${encodeURIComponent(slug)}`
  return get<ApiResponse<Todo>>(url)
}

/**
 * Todo作成
 *
 * 新しいTodoを作成する。
 * ユーザーIDは認証トークンから自動取得される。
 *
 * @param todoData - 作成するTodoのデータ
 * @returns Promise<ApiResponse<Todo>> - 作成されたTodo
 * @throws ApiError - バリデーションエラーや認証エラーの場合
 */
export async function createTodo(todoData: CreateTodo): Promise<ApiResponse<Todo>> {
  const url = `${API_BASE_URL}/api/todos`
  return post<ApiResponse<Todo>>(url, todoData)
}

/**
 * Todo更新
 *
 * 既存のTodoを部分更新する。
 * 自分が作成したTodoのみ更新可能。
 *
 * @param slug - 更新対象TodoのURL用スラッグ
 * @param updateData - 更新するフィールドのデータ
 * @returns Promise<ApiResponse<Todo>> - 更新されたTodo
 * @throws ApiError - Todo が見つからない場合や権限がない場合
 */
export async function updateTodo(slug: string, updateData: UpdateTodo): Promise<ApiResponse<Todo>> {
  const url = `${API_BASE_URL}/api/todos/${encodeURIComponent(slug)}`
  return patch<ApiResponse<Todo>>(url, updateData)
}

/**
 * Todo削除
 *
 * 指定されたTodoを論理削除する。
 * 自分が作成したTodoのみ削除可能。
 *
 * @param slug - 削除対象TodoのURL用スラッグ
 * @returns Promise<ApiResponse<void>> - 削除完了レスポンス
 * @throws ApiError - Todo が見つからない場合や権限がない場合
 */
export async function deleteTodo(slug: string): Promise<ApiResponse<void>> {
  const url = `${API_BASE_URL}/api/todos/${encodeURIComponent(slug)}`
  return del<ApiResponse<void>>(url)
}

/**
 * Todo完了状態トグル
 *
 * Todoの完了状態を切り替える便利メソッド。
 * 内部的には updateTodo を使用。
 *
 * @param slug - 対象TodoのURL用スラッグ
 * @param completed - 新しい完了状態
 * @returns Promise<ApiResponse<Todo>> - 更新されたTodo
 */
export async function toggleTodoCompletion(slug: string, completed: boolean): Promise<ApiResponse<Todo>> {
  return updateTodo(slug, { completed })
}

/**
 * デフォルトの検索条件
 *
 * Todo一覧取得時のデフォルト設定。
 * 作成日時の降順で20件ずつ表示。
 */
export const DEFAULT_TODO_QUERY: TodoListQuery = {
  page: 0,
  limit: 20,
  field: 'createdAt',
  order: 'desc',
}