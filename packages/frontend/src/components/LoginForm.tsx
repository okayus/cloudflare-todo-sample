/**
 * ログインフォームコンポーネント
 * 
 * Firebase認証を使用したログイン機能を提供。
 * フォームバリデーションとエラーハンドリングを含む。
 */
import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

/**
 * フォーム入力値の型定義
 */
interface LoginFormData {
  email: string
  password: string
}

/**
 * フォームエラーの型定義
 */
interface FormErrors {
  email?: string
  password?: string
  general?: string
}

/**
 * ログインフォームコンポーネント
 * 
 * メールアドレスとパスワードによるログイン機能。
 * バリデーション、エラーハンドリング、ローディング状態を管理。
 * 
 * @returns JSX.Element
 */
export const LoginForm: React.FC = () => {
  /** ナビゲーション関数 */
  const navigate = useNavigate()
  /** 現在の位置情報（リダイレクト前のページ情報） */
  const location = useLocation()
  /** 認証コンテキスト */
  const { login } = useAuth()

  /** フォーム入力値の状態 */
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  })

  /** フォームエラーの状態 */
  const [errors, setErrors] = useState<FormErrors>({})
  /** ローディング状態 */
  const [isLoading, setIsLoading] = useState(false)

  /**
   * フォーム入力値の変更ハンドラー
   * 
   * 入力値の更新とリアルタイムバリデーション。
   * エラーがある場合はクリアする。
   * 
   * @param e - 入力イベント
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // エラーをクリア
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  /**
   * フォームバリデーション
   * 
   * 必須項目とメール形式のチェック。
   * 
   * @returns バリデーション結果
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // メールアドレスの検証
    if (!formData.email.trim()) {
      newErrors.email = 'メールアドレスを入力してください'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '正しいメールアドレス形式を入力してください'
    }

    // パスワードの検証
    if (!formData.password) {
      newErrors.password = 'パスワードを入力してください'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /**
   * フォーム送信ハンドラー
   * 
   * バリデーション後、Firebase認証でログイン実行。
   * 成功時は適切なページにリダイレクト。
   * 
   * @param e - フォーム送信イベント
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // バリデーション
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      // Firebase認証でログイン
      await login(formData.email, formData.password)

      // ログイン成功：リダイレクト先を決定
      const from = (location.state as any)?.from || '/dashboard'
      navigate(from)
    } catch (error) {
      console.error('ログインエラー:', error)
      setErrors({
        general: 'ログインに失敗しました。メールアドレスとパスワードをご確認ください。'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div data-testid="login-page" className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* ヘッダー */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            アカウントにログイン
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            または{' '}
            <Link
              to="/signup"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              サインアップ
            </Link>
          </p>
        </div>

        {/* ログインフォーム */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* 全般エラー表示 */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {errors.general}
            </div>
          )}

          <div className="space-y-4">
            {/* メールアドレス入力 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                メールアドレス
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder="your@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* パスワード入力 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                パスワード
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleInputChange}
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder="パスワード"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>
          </div>

          {/* ログインボタン */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'ログイン中...' : 'ログイン'}
            </button>
          </div>

          {/* サインアップリンク */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              アカウントをお持ちでない場合
            </p>
            <Link
              to="/signup"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              こちらからサインアップ
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}