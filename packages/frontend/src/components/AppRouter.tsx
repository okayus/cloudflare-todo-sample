/**
 * アプリケーションルーターコンポーネント
 * 
 * React Routerを使用してアプリケーション全体のルーティングを管理。
 * 認証状態に基づく条件付きルーティングを実装。
 */
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ProtectedRoute } from './ProtectedRoute'
import Landing from './Landing'
import { LoginForm } from './LoginForm'
import { SignupForm } from './SignupForm'
import { Dashboard } from './Dashboard'

/**
 * 認証済みユーザー用リダイレクトコンポーネント
 * 
 * 認証済みユーザーがログイン・サインアップページにアクセスした場合、
 * ダッシュボードにリダイレクトする。
 */
const AuthenticatedRedirect: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth()
  
  if (isLoading) {
    return <div data-testid="app-loading" className="flex justify-center items-center min-h-screen">読み込み中...</div>
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />
  }
  
  return <>{children}</>
}

/**
 * 404ページコンポーネント
 */
const NotFoundPage: React.FC = () => (
  <div data-testid="not-found-page" className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
      <p className="text-gray-600 mb-4">ページが見つかりません</p>
      <a href="/" className="text-blue-600 hover:text-blue-500">
        ホームに戻る
      </a>
    </div>
  </div>
)

/**
 * アプリケーションルーター
 * 
 * アプリケーション全体のルーティング設定。
 * 認証状態に応じた条件付きルーティングを実装。
 * 
 * @returns JSX.Element
 */
export const AppRouter: React.FC = () => {
  const { isLoading } = useAuth()

  // 認証状態確認中はローディング表示
  if (isLoading) {
    return (
      <div data-testid="app-loading" className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">読み込み中...</span>
      </div>
    )
  }

  return (
    <Routes>
      {/* パブリックルート（認証済みユーザーはダッシュボードにリダイレクト） */}
      <Route 
        path="/" 
        element={
          <AuthenticatedRedirect>
            <Landing />
          </AuthenticatedRedirect>
        } 
      />
      
      <Route 
        path="/login" 
        element={
          <AuthenticatedRedirect>
            <LoginForm />
          </AuthenticatedRedirect>
        } 
      />
      
      <Route 
        path="/signup" 
        element={
          <AuthenticatedRedirect>
            <SignupForm />
          </AuthenticatedRedirect>
        } 
      />

      {/* プライベートルート（認証が必要） */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />

      {/* 404ページ */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}