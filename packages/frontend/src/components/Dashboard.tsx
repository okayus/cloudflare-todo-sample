/**
 * ダッシュボードコンポーネント
 * 
 * 認証済みユーザー向けのメインページ。
 * ユーザー情報の表示とログアウト機能を提供。
 */
import React from 'react'
import { useAuth } from '../contexts/AuthContext'

/**
 * ダッシュボードページ
 * 
 * 認証済みユーザーのメインダッシュボード。
 * ユーザー情報の表示とログアウト機能を提供。
 * 
 * @returns JSX.Element
 */
export const Dashboard: React.FC = () => {
  /** 認証コンテキストから認証情報を取得 */
  const { user, logout } = useAuth()

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
        <main className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            ユーザー情報
          </h2>
          <div className="space-y-3">
            <div>
              <span className="font-medium text-gray-700">ユーザーID:</span>
              <span className="ml-2 text-gray-900">{user?.uid}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">メールアドレス:</span>
              <span className="ml-2 text-gray-900">{user?.email}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">表示名:</span>
              <span className="ml-2 text-gray-900">
                {user?.displayName || '未設定'}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">メール認証:</span>
              <span className={`ml-2 ${user?.emailVerified ? 'text-green-600' : 'text-red-600'}`}>
                {user?.emailVerified ? '認証済み' : '未認証'}
              </span>
            </div>
          </div>
        </main>

        {/* フッター情報 */}
        <footer className="mt-8 text-center text-gray-500">
          <p>Cloudflare Todo Sample Application</p>
        </footer>
      </div>
    </div>
  )
}