/**
 * ダッシュボードコンポーネント
 * 
 * 認証済みユーザー向けのメインページ。
 * タスク作成・一覧表示機能を統合したTodo管理ダッシュボード。
 */
import React, { useState, useEffect } from 'react'
import type { Todo } from '@cloudflare-todo-sample/shared'
import { useAuth } from '../contexts/AuthContext'
import { TaskCreateForm } from './TaskCreateForm'
import { TaskList } from './TaskList'

/**
 * ダッシュボードページ
 * 
 * 認証済みユーザーのメインダッシュボード。
 * タスク作成・一覧表示・ユーザー情報表示・ログアウト機能を提供。
 * 
 * @returns JSX.Element
 */
export const Dashboard: React.FC = () => {
  /** 認証コンテキストから認証情報を取得 */
  const { user, logout } = useAuth()
  
  /** タスクリスト更新フラグ */
  const [taskListKey, setTaskListKey] = useState<number>(0)
  
  /** タスク作成フォームの表示/非表示 */
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false)
  
  // Dashboard認証状態のログ出力
  useEffect(() => {
    console.log('🔍 Dashboard: ユーザー状態変更', {
      userExists: !!user,
      userEmail: user?.email,
      userEmailVerified: user?.emailVerified,
      userDisplayName: user?.displayName,
      timestamp: new Date().toISOString()
    })
  }, [user])

  /**
   * ログアウト処理
   * 
   * Firebase認証からログアウトし、
   * AuthContextの状態も自動的に更新される。
   */
  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('ログアウトエラー:', error)
    }
  }

  /**
   * タスク作成成功時のハンドラー
   * 
   * 作成フォームを閉じ、タスクリストを更新する。
   */
  const handleTaskCreated = (_todo: Todo) => {
    setShowCreateForm(false)
    setTaskListKey(prev => prev + 1) // TaskListを強制再レンダリング
  }

  /**
   * タスクリスト更新ハンドラー
   * 
   * タスク完了トグル等でリストの再取得を実行。
   */
  const handleTaskListRefresh = () => {
    setTaskListKey(prev => prev + 1)
  }

  return (
    <div data-testid="dashboard-page" className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <header className="bg-white shadow rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                ダッシュボード
              </h1>
              <p className="text-gray-600 mt-1">
                ようこそ、{user?.displayName || user?.email}さん
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              ログアウト
            </button>
          </div>
        </header>

        {/* メインコンテンツ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* タスク作成エリア */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  新しいタスク
                </h2>
                <button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    showCreateForm
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {showCreateForm ? '閉じる' : '作成'}
                </button>
              </div>

              {showCreateForm && (
                <TaskCreateForm
                  onSuccess={handleTaskCreated}
                  onError={(error) => console.error('Task creation error:', error)}
                />
              )}

              {!showCreateForm && (
                <div className="text-center py-8 text-gray-500">
                  <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <p>「作成」ボタンを押して<br />新しいタスクを追加</p>
                </div>
              )}
            </div>

            {/* ユーザー情報 */}
            <div className="bg-white shadow rounded-lg p-6 mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                ユーザー情報
              </h2>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">メール:</span>
                  <span className="ml-2 text-gray-900">{user?.email}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">表示名:</span>
                  <span className="ml-2 text-gray-900">
                    {user?.displayName || '未設定'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">認証状態:</span>
                  <span className={`ml-2 ${user ? 'text-green-600' : 'text-red-600'}`}>
                    {user ? 'ログイン済み' : '未ログイン'}
                  </span>
                  {user && (
                    <span className={`ml-2 text-sm ${user.emailVerified ? 'text-green-500' : 'text-orange-500'}`}>
                      ({user.emailVerified ? 'メール確認済み' : 'メール未確認'})
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* タスク一覧エリア */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg p-6">
              <TaskList
                key={taskListKey}
                onRefresh={handleTaskListRefresh}
              />
            </div>
          </div>
        </div>

        {/* フッター情報 */}
        <footer className="mt-8 text-center text-gray-500">
          <p>Cloudflare Todo Sample Application</p>
        </footer>
      </div>
    </div>
  )
}