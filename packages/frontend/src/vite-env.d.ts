/// <reference types="vite/client" />

/**
 * Vite環境変数の型定義
 *
 * import.meta.envで利用可能な環境変数の型を定義する。
 * Firebase認証に必要な環境変数を含む。
 */
interface ImportMetaEnv {
  /** Firebase API Key */
  readonly VITE_FIREBASE_API_KEY: string
  /** Firebase Auth Domain */
  readonly VITE_FIREBASE_AUTH_DOMAIN: string
  /** Firebase Project ID */
  readonly VITE_FIREBASE_PROJECT_ID: string
  /** Firebase Storage Bucket */
  readonly VITE_FIREBASE_STORAGE_BUCKET: string
  /** Firebase Messaging Sender ID */
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string
  /** Firebase App ID */
  readonly VITE_FIREBASE_APP_ID: string
  /** Firebase Auth Emulator URL (development only) */
  readonly VITE_FIREBASE_AUTH_EMULATOR_URL?: string
}

// ImportMeta interface extension for Vite environment variables
// Export to prevent TS error about unused interface
export {};

declare global {
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
}