/**
 * Firebase設定ファイル
 *
 * Firebase Authenticationの初期化と設定を管理する。
 * 環境変数からFirebase設定を読み込み、適切に初期化する。
 * Cloudflare Pagesデプロイメントに最適化されている。
 */
import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth'

/**
 * Firebase設定の型定義
 */
interface FirebaseConfig {
  /** Firebase API Key */
  apiKey: string
  /** Firebase Auth Domain */
  authDomain: string  
  /** Firebase Project ID */
  projectId: string
  /** Firebase Storage Bucket */
  storageBucket: string
  /** Firebase Messaging Sender ID */
  messagingSenderId: string
  /** Firebase App ID */
  appId: string
}

/**
 * 環境変数からFirebase設定を取得する
 *
 * Viteの環境変数（VITE_*）から必要な設定値を読み込む。
 * すべての必須項目が設定されていない場合はエラーを投げる。
 *
 * @returns Firebase設定オブジェクト
 * @throws {Error} 必須環境変数が不足している場合
 */
export function getFirebaseConfig(): FirebaseConfig {
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  }

  // 必須項目の検証
  const requiredFields = Object.entries(config).filter(([, value]) => !value)
  if (requiredFields.length > 0) {
    const missingFields = requiredFields.map(([key]) => key).join(', ')
    throw new Error(`Firebase設定環境変数が不足しています: ${missingFields}`)
  }

  return config
}

/**
 * Firebase Appを初期化する
 *
 * 既にアプリが初期化されている場合は既存のアプリを返す。
 * 初期化されていない場合は新しくアプリを作成する。
 *
 * @returns 初期化されたFirebase App
 */
export async function initializeFirebase() {
  const config = getFirebaseConfig()

  // 既に初期化されている場合は既存のアプリを使用
  if (getApps().length > 0) {
    return getApp()
  }

  // 新しいアプリを初期化
  return initializeApp(config)
}

/**
 * Firebase Authenticationを初期化する
 *
 * Firebase Appが初期化されていることを前提とする。
 * 開発環境ではAuth Emulatorに接続する。
 *
 * @returns 初期化されたAuth インスタンス
 */
export async function initializeAuth(): Promise<Auth> {
  // Firebase Appが初期化されていることを確認
  await initializeFirebase()

  const authInstance = getAuth()

  // 開発環境でのEmulator接続
  if (
    import.meta.env.DEV &&
    import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_URL &&
    !(authInstance as any).emulatorConfig
  ) {
    connectAuthEmulator(authInstance, import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_URL)
  }

  return authInstance
}

/**
 * グローバルで使用するAuth インスタンス
 *
 * アプリケーション全体で同一のAuth インスタンスを使用するため、
 * 初期化後はこの変数を通してアクセスする。
 */
let globalAuth: Auth | null = null

/**
 * Auth インスタンスを取得する
 *
 * 初回呼び出し時に初期化を行い、以降は同じインスタンスを返す。
 * Reactコンポーネント内での使用を想定している。
 *
 * @returns Auth インスタンス
 */
export async function auth(): Promise<Auth> {
  if (!globalAuth) {
    globalAuth = await initializeAuth()
  }
  return globalAuth
}