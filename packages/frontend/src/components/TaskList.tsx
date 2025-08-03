/**
 * タスク一覧表示コンポーネント
 *
 * モダンデザインのタスク一覧表示。
 * アニメーション、アイコン、美しいカードデザインで
 * 直感的なタスク管理体験を提供。
 */
import React, { useState, useEffect } from 'react'
import type { Todo } from '@cloudflare-todo-sample/shared'
import { getTodos, toggleTodoCompletion } from '../utils/todoApi'
import { useAuth } from '../contexts/AuthContext'

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

  /** 認証状態を取得 */
  const { user, isLoading: authLoading } = useAuth()
  
  // 認証状態のログ出力
  useEffect(() => {
    console.log('🔍 TaskList: 認証状態変更', {
      authLoading,
      userExists: !!user,
      userEmail: user?.email,
      timestamp: new Date().toISOString()
    })
  }, [authLoading, user])

  /**
   * タスクデータ取得
   *
   * APIからタスク一覧を取得し、状態を更新する。
   * エラー時はエラーメッセージを設定。
   * useCallbackでメモ化してuseEffect依存関係を最適化。
   */
  const fetchTodos = async () => {
    try {
      console.log('🔄 TaskList: fetchTodos開始', {
        authLoading,
        userExists: !!user,
        userEmail: user?.email,
        timestamp: new Date().toISOString()
      })
      
      setIsLoading(true)
      setErrorMessage(null)
      
      console.log('🔄 TaskList: getTodos API呼び出し開始')
      const response = await getTodos()
      console.log('✅ TaskList: getTodos API呼び出し成功', response)
      
      if (response.success) {
        console.log('🔍 TaskList: レスポンスデータ構造確認', {
          dataKeys: Object.keys(response.data),
          hasItems: 'items' in response.data,
          hasTotal: 'total' in response.data,
          itemsLength: response.data.items?.length || 0,
          total: response.data.total
        })
        
        setTodos(response.data.items || [])
        setTotalCount(response.data.total || 0)
        console.log('✅ TaskList: データ更新完了', {
          todoCount: response.data.items?.length || 0,
          total: response.data.total || 0
        })
      } else {
        throw new Error('データの読み込みに失敗しました')
      }
    } catch (error) {
      console.error('❌ TaskList: データ取得エラー:', error)
      
      // 認証エラーの場合は専用メッセージ
      if (error instanceof Error && error.message.includes('認証')) {
        setErrorMessage('ログインが必要です。再度ログインしてください。')
      } else {
        setErrorMessage('データの読み込みに失敗しました')
      }
    } finally {
      setIsLoading(false)
      console.log('🏁 TaskList: fetchTodos完了')
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
   * 認証状態が確定してからAPI呼び出しを実行
   */
  useEffect(() => {
    console.log('🔄 TaskList: useEffect[authLoading]実行', {
      authLoading,
      userExists: !!user,
      shouldFetch: !authLoading,
      timestamp: new Date().toISOString()
    })
    
    // Firebase認証の初期化が完了してからデータ取得
    if (!authLoading) {
      console.log('✅ TaskList: 認証完了、データ取得開始')
      fetchTodos()
    } else {
      console.log('⏳ TaskList: 認証確認中、データ取得待機')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading])

  /**
   * ローディング状態の表示
   * 認証状態確認中またはデータ取得中の場合に表示
   */
  if (authLoading || isLoading) {
    return (
      <div data-testid="task-list-loading" className={`space-y-6 ${className}`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-5 h-5 bg-secondary-100 rounded-lg animate-pulse mr-3"></div>
            <div className="h-6 bg-secondary-200 rounded w-24 animate-pulse"></div>
          </div>
          <div className="flex items-center text-sm text-secondary-500">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            読み込み中...
          </div>
        </div>
        
        {/* スケルトンローダー */}
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="flex items-start space-x-3">
                <div className="w-4 h-4 bg-secondary-200 rounded mt-1"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-secondary-200 rounded w-3/4"></div>
                  <div className="h-3 bg-secondary-100 rounded w-1/2"></div>
                  <div className="flex space-x-4">
                    <div className="h-3 bg-secondary-100 rounded w-16"></div>
                    <div className="h-3 bg-secondary-100 rounded w-12"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  /**
   * エラー状態の表示
   */
  if (errorMessage && !authLoading && !isLoading) {
    return (
      <div data-testid="task-list-error" className={`space-y-6 ${className}`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-5 h-5 bg-error-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-error-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-secondary-900">タスク一覧</h2>
          </div>
        </div>
        
        <div className="card p-8 text-center animate-slide-up">
          <div className="w-12 h-12 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-5 h-5 text-error-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">エラーが発生しました</h3>
          <p className="text-secondary-600 mb-6">{errorMessage}</p>
          <button
            onClick={fetchTodos}
            className="btn-primary px-6 py-2 shadow-colored hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            再試行
          </button>
        </div>
      </div>
    )
  }

  /**
   * 空状態の表示
   */
  if (todos.length === 0 && !errorMessage && !authLoading && !isLoading) {
    return (
      <div data-testid="task-list-empty" className={`space-y-6 ${className}`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-5 h-5 bg-secondary-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-4 h-4 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-secondary-900">タスク一覧</h2>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-100 text-secondary-800">
            0件
          </span>
        </div>
        
        <div className="card p-12 text-center animate-fade-in">
          <div className="w-12 h-12 bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-5 h-5 text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-secondary-900 mb-2">まだタスクがありません</h3>
          <p className="text-secondary-600 mb-6">新しいタスクを作成して、生産性を向上させましょう。</p>
          <div className="inline-flex items-center text-sm text-secondary-500">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            左側の「作成」ボタンから始めてみてください
          </div>
        </div>
      </div>
    )
  }

  /**
   * メインコンテンツの表示
   */
  return (
    <div data-testid="task-list" className={`space-y-6 ${className}`}>
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <div className="w-5 h-5 bg-secondary-100 rounded-lg flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-secondary-900">タスク一覧</h2>
        </div>
        <div className="flex items-center space-x-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            totalCount > 0 ? 'bg-primary-100 text-primary-800' : 'bg-secondary-100 text-secondary-800'
          }`}>
            {totalCount}件
          </span>
          {totalCount > 0 && (
            <div className="text-xs text-secondary-500">
              完了: {todos.filter(t => t.completed).length}件
            </div>
          )}
        </div>
      </div>

      {/* エラーメッセージ（更新エラー等） */}
      {errorMessage && (
        <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg animate-slide-down flex items-start">
          <svg className="w-4 h-4 mr-3 mt-0.5 text-error-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {errorMessage}
        </div>
      )}

      {/* タスク一覧 */}
      <div className="space-y-3">
        {todos.map((todo, index) => (
          <div
            key={todo.id}
            className={`card-hover p-5 animate-slide-up transition-all duration-200 ${
              todo.completed 
                ? 'bg-gradient-to-r from-secondary-50 to-secondary-100 border-secondary-200' 
                : 'hover:shadow-colored'
            }`}
            style={{animationDelay: `${index * 0.05}s`}}
          >
            <div className="flex items-start space-x-4">
              {/* 完了チェックボックス */}
              <div className="flex-shrink-0 mt-1">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    disabled={disabled || updatingTodoIds.has(todo.id)}
                    onChange={() => handleToggleCompletion(todo)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                    todo.completed
                      ? 'bg-success-500 border-success-500'
                      : updatingTodoIds.has(todo.id)
                      ? 'border-primary-300 bg-primary-50'
                      : 'border-secondary-300 hover:border-primary-400'
                  } ${
                    disabled || updatingTodoIds.has(todo.id) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                  }`}>
                    {todo.completed && (
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    {updatingTodoIds.has(todo.id) && !todo.completed && (
                      <svg className="w-4 h-4 text-primary-500 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                  </div>
                </label>
              </div>

              {/* タスク内容 */}
              <div className="flex-1 min-w-0">
                {/* タイトル */}
                <h3 className={`text-base font-medium leading-6 transition-all duration-200 ${
                  todo.completed
                    ? 'text-secondary-500 line-through'
                    : 'text-secondary-900'
                }`}>
                  {todo.title}
                </h3>

                {/* 説明（存在する場合のみ） */}
                {todo.description && (
                  <p className={`mt-2 text-sm leading-5 transition-all duration-200 ${
                    todo.completed ? 'text-secondary-400' : 'text-secondary-600'
                  }`}>
                    {todo.description}
                  </p>
                )}

                {/* メタ情報 */}
                <div className="mt-3 flex items-center space-x-4 text-xs">
                  <div className="flex items-center text-secondary-500">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDate(todo.dueDate)}
                  </div>
                  <div className="flex items-center text-secondary-400">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {formatRelativeTime(todo.createdAt!)}
                  </div>
                  {updatingTodoIds.has(todo.id) && (
                    <div className="flex items-center text-primary-600">
                      <svg className="w-4 h-4 mr-1 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      更新中
                    </div>
                  )}
                </div>
              </div>

              {/* ステータスバッジ */}
              <div className="flex-shrink-0">
                {todo.completed ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-100 text-success-800">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    完了
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-warning-100 text-warning-800">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    進行中
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}