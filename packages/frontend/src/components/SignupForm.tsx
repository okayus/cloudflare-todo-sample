/**
 * サインアップフォームコンポーネント
 * 
 * モダンデザインによる新規ユーザー登録機能。
 * Tailwind CSSスタイリング、アニメーション、
 * アクセシビリティ対応を含む。
 */
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

/**
 * フォーム入力値の型定義
 */
interface SignupFormData {
  email: string
  password: string
  confirmPassword: string
}

/**
 * フォームエラーの型定義
 */
interface FormErrors {
  email?: string
  password?: string
  confirmPassword?: string
  general?: string
}

/**
 * サインアップフォームコンポーネント
 * 
 * メールアドレスとパスワードによる新規ユーザー登録機能。
 * バリデーション、エラーハンドリング、ローディング状態を管理。
 * 
 * @returns JSX.Element
 */
export const SignupForm: React.FC = () => {
  /** ナビゲーション関数 */
  const navigate = useNavigate()
  /** 認証コンテキスト */
  const { signup } = useAuth()

  /** フォーム入力値の状態 */
  const [formData, setFormData] = useState<SignupFormData>({
    email: '',
    password: '',
    confirmPassword: ''
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
   * 必須項目、メール形式、パスワード強度のチェック。
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
    } else if (formData.password.length < 6) {
      newErrors.password = 'パスワードは6文字以上で入力してください'
    }

    // パスワード確認の検証
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'パスワード確認を入力してください'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'パスワードが一致しません'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /**
   * フォーム送信ハンドラー
   * 
   * バリデーション後、Firebase認証でサインアップ実行。
   * 成功時はダッシュボードにリダイレクト。
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
    setErrors({}) // バリデーション成功時のみエラーをクリア

    try {
      // Firebase認証でサインアップ
      await signup(formData.email, formData.password)

      // サインアップ成功：ダッシュボードにリダイレクト
      navigate('/dashboard')
    } catch (error) {
      console.error('サインアップエラー:', error)
      setErrors({
        general: 'アカウント作成に失敗しました。しばらく時間をおいて再度お試しください。'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div data-testid="signup-page" className="min-h-screen bg-gradient-hero flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* メインカード */}
        <div className="card-soft p-8 animate-fade-in">
          {/* ヘッダー */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-success-500 to-primary-500 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-secondary-900 mb-2">
              始めましょう
            </h2>
            <p className="text-secondary-600">
              新しいアカウントを作成してTODO管理を開始
            </p>
          </div>

          {/* サインアップフォーム */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* 全般エラー表示 */}
            {errors.general && (
              <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg animate-slide-down flex items-start">
                <svg className="w-4 h-4 mr-3 mt-0.5 text-error-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {errors.general}
              </div>
            )}

            <div className="space-y-5">
              {/* メールアドレス入力 */}
              <div>
                <label htmlFor="email" className="form-label">
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-secondary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                    メールアドレス
                  </span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={errors.email ? 'form-input-error' : 'form-input'}
                  placeholder="your@example.com"
                />
                {errors.email && (
                  <p className="form-error animate-slide-down">{errors.email}</p>
                )}
              </div>

              {/* パスワード入力 */}
              <div>
                <label htmlFor="password" className="form-label">
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-secondary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    パスワード
                  </span>
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={errors.password ? 'form-input-error' : 'form-input'}
                  placeholder="6文字以上のパスワード"
                />
                {errors.password && (
                  <p className="form-error animate-slide-down">{errors.password}</p>
                )}
              </div>

              {/* パスワード確認入力 */}
              <div>
                <label htmlFor="confirmPassword" className="form-label">
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-secondary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    パスワード確認
                  </span>
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={errors.confirmPassword ? 'form-input-error' : 'form-input'}
                  placeholder="パスワードを再入力"
                />
                {errors.confirmPassword && (
                  <p className="form-error animate-slide-down">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* サインアップボタン */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-success w-full py-3 text-base relative overflow-hidden group transform hover:scale-[1.02] transition-all duration-200"
            >
              <span className="relative z-10 flex items-center justify-center">
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    アカウント作成中...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    アカウント作成
                  </>
                )}
              </span>
              {!isLoading && (
                <div className="absolute inset-0 bg-gradient-to-r from-success-600 to-success-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              )}
            </button>

            {/* ログインリンク */}
            <div className="text-center pt-4 border-t border-secondary-200">
              <p className="text-sm text-secondary-600 mb-2">
                既にアカウントをお持ちの場合
              </p>
              <Link
                to="/login"
                className="inline-flex items-center font-medium text-primary-600 hover:text-primary-500 transition-colors duration-200"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                ログインはこちら
              </Link>
            </div>
          </form>
        </div>
        
        {/* ホームリンク */}
        <div className="text-center mt-6">
          <Link
            to="/"
            className="inline-flex items-center text-sm text-secondary-500 hover:text-secondary-700 transition-colors duration-200"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  )
}