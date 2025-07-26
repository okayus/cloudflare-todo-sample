/**
 * タスク一覧表示コンポーネント
 *
 * 認証済みユーザーのタスク一覧を表示し、
 * 完了状態のトグル機能を提供する。
 * ローディング、エラー、空状態に対応。
 */
import React, { useState, useEffect } from 'react'
import type { Todo } from '@cloudflare-todo-sample/shared'
import { getTodos, toggleTodoCompletion } from '../utils/todoApi'

/**
 * TaskList コンポーネントのProps
 */
interface TaskListProps {
  /** データ更新後のコールバック（任意） */
  onRefresh?: () => void
  
  /** コンポーネントの無効化フラグ（任意） */
  disabled?: boolean
  
  /** カスタムCSSクラス（任意） */
  className?: string
}

/**
 * 日付フォーマット関数
 *
 * ISO日付文字列を読みやすい形式に変換する。
 *
 * @param dateString - ISO形式の日付文字列
 * @returns フォーマットされた日付文字列
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * 相対時間フォーマット関数
 *
 * 作成日時を相対的な時間表現に変換する。
 *
 * @param dateString - ISO形式の日付文字列
 * @returns 相対時間表現
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return '今日'
  } else if (diffDays === 1) {
    return '昨日'
  } else if (diffDays < 7) {
    return `${diffDays}日前`
  } else {
    return formatDate(dateString)
  }
}

/**
 * タスク一覧表示コンポーネント
 *
 * @param props - コンポーネントのProps
 * @returns JSX.Element
 */
export const TaskList: React.FC<TaskListProps> = ({
  onRefresh,
  disabled = false,
  className = '',
}) => {
  /** タスク一覧データ */
  const [todos, setTodos] = useState<Todo[]>([])
  
  /** 総件数 */
  const [totalCount, setTotalCount] = useState<number>(0)
  
  /** ローディング状態 */
  const [isLoading, setIsLoading] = useState<boolean>(true)
  
  /** エラーメッセージ */
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  /** 更新中のタスクID（楽観的UI更新用） */
  const [updatingTodoIds, setUpdatingTodoIds] = useState<Set<string>>(new Set())

  /**
   * タスクデータ取得
   *
   * APIからタスク一覧を取得し、状態を更新する。
   * エラー時はエラーメッセージを設定。
   */
  const fetchTodos = async () => {
    try {
      setIsLoading(true)
      setErrorMessage(null)
      
      const response = await getTodos()
      
      if (response.success) {
        setTodos(response.data)
        setTotalCount(response.pagination.total)
      } else {
        throw new Error('タスクの取得に失敗しました')
      }
    } catch (error) {
      console.error('TaskList: データ取得エラー:', error)
      setErrorMessage('タスクの取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * タスク完了状態トグル
   *
   * 楽観的UI更新を行い、API呼び出し後に
   * 成功時はコールバック実行、失敗時はロールバック。
   *
   * @param todo - 対象のTodoオブジェクト
   */
  const handleToggleCompletion = async (todo: Todo) => {
    if (disabled || updatingTodoIds.has(todo.id)) {
      return
    }

    const newCompleted = !todo.completed
    
    // 楽観的UI更新
    setTodos(prevTodos =>
      prevTodos.map(t =>
        t.id === todo.id ? { ...t, completed: newCompleted } : t
      )
    )
    
    // 更新中状態を追加
    setUpdatingTodoIds(prev => new Set(prev).add(todo.id))

    try {
      const response = await toggleTodoCompletion(todo.slug, newCompleted)
      
      if (response.success) {
        // 成功時はコールバック実行
        if (onRefresh) {
          onRefresh()
        }
      } else {
        throw new Error(response.error || 'タスクの更新に失敗しました')
      }
    } catch (error) {
      console.error('TaskList: 完了トグルエラー:', error)
      
      // 失敗時はロールバック
      setTodos(prevTodos =>
        prevTodos.map(t =>
          t.id === todo.id ? { ...t, completed: todo.completed } : t
        )
      )
      
      // エラーメッセージを一時的に表示
      setErrorMessage('タスクの更新に失敗しました')
      setTimeout(() => setErrorMessage(null), 3000)
    } finally {
      // 更新中状態を削除
      setUpdatingTodoIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(todo.id)
        return newSet
      })
    }
  }

  /**
   * 初期データ取得
   */
  useEffect(() => {
    fetchTodos()
  }, [])

  /**
   * ローディング状態の表示
   */
  if (isLoading) {
    return (
      <div
        data-testid="task-list-loading"
        className={`space-y-4 ${className}`}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">タスク一覧</h2>
          <div className="text-sm text-gray-500">読み込み中...</div>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">タスクを読み込み中...</p>
        </div>
      </div>
    )
  }

  /**
   * エラー状態の表示
   */
  if (errorMessage && todos.length === 0) {
    return (
      <div
        data-testid="task-list-error"
        className={`space-y-4 ${className}`}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">タスク一覧</h2>
        </div>
        <div className="text-center py-8">
          <div className="text-red-600 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">{errorMessage}</p>
          <button
            onClick={fetchTodos}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            再試行
          </button>
        </div>
      </div>
    )
  }

  /**
   * 空状態の表示
   */
  if (todos.length === 0) {
    return (
      <div
        data-testid="task-list-empty"
        className={`space-y-4 ${className}`}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">タスク一覧</h2>
          <div className="text-sm text-gray-500">タスク 0件</div>
        </div>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-gray-600 text-lg font-medium mb-2">タスクがありません</p>
          <p className="text-gray-500">新しいタスクを作成してみましょう</p>
        </div>
      </div>
    )
  }

  /**
   * メインコンテンツの表示
   */
  return (
    <div
      data-testid="task-list"
      className={`space-y-4 ${className}`}
    >
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">タスク一覧</h2>
        <div className="text-sm text-gray-500">タスク {totalCount}件</div>
      </div>

      {/* エラーメッセージ（更新エラー等） */}
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{errorMessage}</p>
        </div>
      )}

      {/* タスク一覧 */}
      <div className="space-y-3">
        {todos.map((todo) => (
          <div
            key={todo.id}
            className={`p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow ${
              todo.completed ? 'bg-gray-50' : ''
            }`}
          >
            <div className="flex items-start space-x-3">
              {/* 完了チェックボックス */}
              <div className="flex-shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  disabled={disabled || updatingTodoIds.has(todo.id)}
                  onChange={() => handleToggleCompletion(todo)}
                  className={`h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 ${
                    disabled || updatingTodoIds.has(todo.id) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                  }`}
                />
              </div>

              {/* タスク内容 */}
              <div className="flex-1 min-w-0">
                {/* タイトル */}
                <h3
                  className={`text-sm font-medium ${
                    todo.completed
                      ? 'text-gray-500 line-through'
                      : 'text-gray-900'
                  }`}
                >
                  {todo.title}
                </h3>

                {/* 説明（存在する場合のみ） */}
                {todo.description && (
                  <p
                    className={`mt-1 text-sm ${
                      todo.completed ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    {todo.description}
                  </p>
                )}

                {/* メタ情報 */}
                <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                  <span>期限: {formatDate(todo.dueDate)}</span>
                  <span>作成: {formatRelativeTime(todo.createdAt!)}</span>
                  {updatingTodoIds.has(todo.id) && (
                    <span className="text-blue-600">更新中...</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}