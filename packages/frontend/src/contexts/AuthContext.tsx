/**
 * 認証コンテキスト
 * 
 * Firebase認証状態をReactアプリケーション全体で管理する。
 * ログイン・サインアップ・ログアウト機能とローディング状態を提供。
 */
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  UserCredential
} from 'firebase/auth'
import { auth } from '../config/firebase'

/**
 * 認証コンテキストの型定義
 * 
 * アプリケーション内で使用される認証機能とデータを定義。
 * 全てのコンポーネントからアクセス可能にする。
 */
interface AuthContextType {
  /** 現在のログインユーザー（未ログインの場合はnull） */
  user: User | null
  /** 認証状態確認中のローディングフラグ */
  isLoading: boolean
  /** 
   * メールアドレスとパスワードでログイン
   * @param email メールアドレス
   * @param password パスワード
   * @returns Promise<UserCredential> Firebase認証結果
   */
  login: (_email: string, _password: string) => Promise<UserCredential>
  /** 
   * メールアドレスとパスワードでサインアップ
   * @param email メールアドレス  
   * @param password パスワード
   * @returns Promise<UserCredential> Firebase認証結果
   */
  signup: (_email: string, _password: string) => Promise<UserCredential>
  /** 
   * ログアウト
   * @returns Promise<void>
   */
  logout: () => Promise<void>
}

/**
 * 認証コンテキスト
 * 
 * 初期値はundefinedとし、プロバイダー外での使用を検出できるようにする。
 * useAuthフック内でエラーハンドリングを行う。
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * 認証プロバイダーのプロパティ型
 */
interface AuthProviderProps {
  /** 子コンポーネント */
  children: ReactNode
}

/**
 * 認証プロバイダーコンポーネント
 * 
 * Firebase認証状態を管理し、アプリケーション全体に提供する。
 * 認証状態の変更を監視し、自動的にコンテキストを更新する。
 * 
 * @param props - プロバイダーのプロパティ
 * @returns JSX.Element
 */
export function AuthProvider({ children }: AuthProviderProps) {
  /** 現在の認証済みユーザー */
  const [user, setUser] = useState<User | null>(null)
  /** 認証状態確認中のローディング状態 */
  const [isLoading, setIsLoading] = useState<boolean>(true)

  /**
   * Firebase認証状態監視の副作用
   * 
   * コンポーネントマウント時に認証状態の監視を開始。
   * ユーザーのログイン・ログアウトを自動検出し、状態を更新する。
   * アンマウント時にリスナーを削除してメモリリークを防ぐ。
   */
  useEffect(() => {
    let unsubscribe: (() => void) | undefined

    const setupAuthListener = async () => {
      const authInstance = await auth()
      unsubscribe = onAuthStateChanged(authInstance, (user) => {
        setUser(user)
        setIsLoading(false)
      })
    }

    setupAuthListener()

    // クリーンアップ関数：コンポーネントアンマウント時にリスナー削除
    return () => unsubscribe?.()
  }, [])

  /**
   * メールアドレス・パスワードでログイン
   * 
   * Firebase Authentication のメール認証を使用。
   * 認証に失敗した場合はFirebaseのエラーをそのまま上位に伝播。
   * 
   * @param email ユーザーのメールアドレス
   * @param password ユーザーのパスワード
   * @returns Promise<UserCredential> Firebase認証結果
   */
  const login = async (email: string, password: string): Promise<UserCredential> => {
    const authInstance = await auth()
    return signInWithEmailAndPassword(authInstance, email, password)
  }

  /**
   * メールアドレス・パスワードでサインアップ
   * 
   * Firebase Authentication で新規ユーザーアカウント作成。
   * 作成に失敗した場合はFirebaseのエラーをそのまま上位に伝播。
   * 
   * @param email ユーザーのメールアドレス
   * @param password ユーザーのパスワード
   * @returns Promise<UserCredential> Firebase認証結果
   */
  const signup = async (email: string, password: string): Promise<UserCredential> => {
    const authInstance = await auth()
    return createUserWithEmailAndPassword(authInstance, email, password)
  }

  /**
   * ログアウト
   * 
   * Firebase Authentication からログアウト。
   * ログアウト後は認証状態監視により自動的にuser状態がnullに更新される。
   * 
   * @returns Promise<void>
   */
  const logout = async (): Promise<void> => {
    const authInstance = await auth()
    return signOut(authInstance)
  }

  /**
   * コンテキスト値
   * 
   * 子コンポーネントに提供される認証機能とデータ。
   * useMemoを使用せずシンプルな実装とし、必要に応じて最適化。
   */
  const value: AuthContextType = {
    user,
    isLoading,
    login,
    signup,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * 認証コンテキスト使用フック
 * 
 * 認証状態と機能にアクセスするためのカスタムフック。
 * プロバイダー外での使用を検出し、適切なエラーメッセージを表示。
 * 
 * @returns AuthContextType 認証機能とデータ
 * @throws プロバイダー外で使用された場合にエラー
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}