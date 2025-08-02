/**
 * ダッシュボードコンポーネント
 * 
 * モダンデザインのメインダッシュボード。
 * タスク作成・一覧表示・ユーザー情報を統合した
 * 直感的なTodo管理インターフェース。
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
    <div data-testid="dashboard-page" className="min-h-screen bg-gradient-hero">
      <div className="container-app py-8">
        {/* ヘッダー */}
        <header className="card-soft p-6 mb-8 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-success-500 rounded-xl flex items-center justify-center mr-4">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-secondary-900">
                  ダッシュボード
                </h1>
                <p className="text-secondary-600 mt-1">
                  おかえりなさい、{user?.displayName || user?.email?.split('@')[0]}さん
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="btn-error px-6 py-2 shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              ログアウト
            </button>
          </div>
        </header>

        {/* メインコンテンツ */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* タスク作成エリア */}
          <div className="xl:col-span-1">
            <div className="card-hover p-6 animate-slide-up">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-secondary-900">
                    新しいタスク
                  </h2>
                </div>
                <button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    showCreateForm
                      ? 'btn-secondary'
                      : 'btn-primary shadow-colored hover:shadow-lg transform hover:scale-105'
                  }`}
                >
                  {showCreateForm ? (
                    <>
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      閉じる
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      作成
                    </>
                  )}
                </button>
              </div>

              {showCreateForm ? (
                <div className="animate-slide-down">
                  <TaskCreateForm
                    onSuccess={handleTaskCreated}
                    onError={(error) => console.error('Task creation error:', error)}
                  />
                </div>
              ) : (
                <div className="text-center py-12 text-secondary-400">
                  <div className="w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-5 h-5 text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <p className="text-sm leading-relaxed">
                    「作成」ボタンをクリックして<br />
                    新しいタスクを追加しましょう
                  </p>
                </div>
              )}
            </div>

            {/* ユーザー情報カード */}
            <div className="card-hover p-6 mt-6 animate-slide-up" style={{animationDelay: '0.1s'}}>
              <div className="flex items-center mb-4">
                <div className="w-6 h-6 bg-success-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-secondary-900">
                  ユーザー情報
                </h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-4 h-4 mt-1 mr-3 text-secondary-400">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-secondary-700">メールアドレス</p>
                    <p className="text-sm text-secondary-900 break-all">{user?.email}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-4 h-4 mt-1 mr-3 text-secondary-400">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-secondary-700">表示名</p>
                    <p className="text-sm text-secondary-900">
                      {user?.displayName || '未設定'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-4 h-4 mt-1 mr-3 text-secondary-400">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-secondary-700">認証状態</p>
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        user ? 'bg-success-100 text-success-800' : 'bg-error-100 text-error-800'
                      }`}>
                        <span className={`w-1.5 h-1.5 mr-1.5 rounded-full ${
                          user ? 'bg-success-400' : 'bg-error-400'
                        }`}></span>
                        {user ? 'ログイン済み' : '未ログイン'}
                      </span>
                      {user && (
                        <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          user.emailVerified ? 'bg-primary-100 text-primary-800' : 'bg-warning-100 text-warning-800'
                        }`}>
                          <span className={`w-1.5 h-1.5 mr-1.5 rounded-full ${
                            user.emailVerified ? 'bg-primary-400' : 'bg-warning-400'
                          }`}></span>
                          {user.emailVerified ? 'メール確認済み' : 'メール未確認'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* タスク一覧エリア */}
          <div className="xl:col-span-3">
            <div className="card-hover p-6 animate-slide-up" style={{animationDelay: '0.2s'}}>
              <div className="flex items-center mb-6">
                <div className="w-6 h-6 bg-secondary-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-secondary-900">
                  タスク一覧
                </h2>
              </div>
              <TaskList
                key={taskListKey}
                onRefresh={handleTaskListRefresh}
              />
            </div>
          </div>
        </div>

        {/* フッター情報 */}
        <footer className="mt-12 text-center">
          <div className="flex justify-center items-center text-sm text-secondary-500">
            <div className="w-5 h-5 bg-gradient-to-r from-primary-500 to-success-500 rounded-lg flex items-center justify-center mr-2">
              <span className="text-white text-xs font-bold">T</span>
            </div>
            <span>Cloudflare Todo Sample Application</span>
            <span className="mx-2">•</span>
            <span>モダンUIデザイン</span>
          </div>
        </footer>
      </div>
    </div>
  )
}