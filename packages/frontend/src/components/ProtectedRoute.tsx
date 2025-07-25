/**
 * プロテクトルートコンポーネント
 * 
 * 認証状態に基づいてコンテンツの表示を制御する。
 * 未認証ユーザーはログインページにリダイレクトされる。
 */
import React, { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

/**
 * プロテクトルートのプロパティ型定義
 */
interface ProtectedRouteProps {
  /** 保護対象の子コンポーネント */
  children: ReactNode
  /** 未認証時に表示するフォールバックコンポーネント（オプション） */
  fallback?: ReactNode
  /** リダイレクト先のパス（デフォルト: '/login'） */
  redirectTo?: string
}

/**
 * ローディングスピナーコンポーネント
 * 
 * 認証状態確認中に表示される。
 * シンプルなCSS animationを使用。
 */
const LoadingSpinner: React.FC = () => (
  <div 
    data-testid="loading-spinner"
    className="flex items-center justify-center min-h-screen"
  >
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="ml-2">読み込み中...</span>
  </div>
)

/**
 * プロテクトルートコンポーネント
 * 
 * 認証状態に基づいてルートアクセスを制御する。
 * - 認証済み: 子コンポーネントを表示
 * - ローディング中: ローディングスピナーを表示
 * - 未認証: ログインページにリダイレクト（現在のパスを保存）
 * 
 * @param props - プロテクトルートのプロパティ
 * @returns JSX.Element
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback,
  redirectTo = '/login'
}) => {
  /** AuthContextから認証状態を取得 */
  const { user, isLoading } = useAuth()
  /** 現在の位置情報を取得（リダイレクト後の復帰用） */
  const location = useLocation()

  /**
   * ローディング中の処理
   * 
   * Firebase認証状態の初期化中はローディング表示。
   * ユーザー体験を向上させるため、即座に未認証と判断しない。
   */
  if (isLoading) {
    return <LoadingSpinner />
  }

  /**
   * 未認証時の処理
   * 
   * カスタムフォールバックが指定されている場合はそれを表示。
   * そうでなければログインページにリダイレクト。
   * 現在のパスをstateとして保存し、ログイン後に元のページに戻れるようにする。
   */
  if (!user) {
    // カスタムフォールバックが指定されている場合
    if (fallback) {
      return <>{fallback}</>
    }

    // ログインページにリダイレクト
    return (
      <Navigate
        to={redirectTo}
        state={{ from: location.pathname }}
        replace
      />
    )
  }

  /**
   * 認証済みの場合
   * 
   * 保護されたコンテンツ（子コンポーネント）を表示。
   */
  return <>{children}</>
}