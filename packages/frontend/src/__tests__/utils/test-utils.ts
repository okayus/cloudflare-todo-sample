/**
 * テストユーティリティ共通設定
 * 
 * 全テストで使用される共通機能とクリーンアップ処理。
 * テスト間の干渉を防ぎ、安定したテスト実行を確保する。
 */
import { vi } from 'vitest'
import { resetFirebaseMocks } from '../mocks/firebase'
import { resetReactRouterMocks } from '../mocks/react-router'

/**
 * グローバル状態クリーンアップ
 * 
 * テスト間でブラウザやDOM状態をクリーンにする。
 * 前のテストの影響を受けないよう、全ての状態をリセット。
 */
export function cleanupGlobalState() {
  // ブラウザストレージをクリア
  localStorage.clear()
  sessionStorage.clear()
  
  // History状態をリセット（React Router用）
  if (typeof window !== 'undefined' && window.history) {
    // 初期状態に戻す
    window.history.replaceState(null, '', '/')
  }
  
  // 環境変数の追加設定をクリア（setupTests.tsの設定は維持）
  // vi.unstubAllEnvs() // 全てリセットすると setupTests.ts の設定も失われるので使用しない
  
  // タイマーをクリア（未完了のsetTimeout/setIntervalなど）
  vi.clearAllTimers()
  vi.useRealTimers()
}

/**
 * モジュールキャッシュクリーンアップ
 * 
 * Vitestのモジュールキャッシュをクリアして、
 * 動的インポートによるモジュール状態の持続を防ぐ。
 */
export function cleanupModuleCache() {
  // 特定のモジュールキャッシュをクリア
  vi.resetModules()
}

/**
 * 全てのモック状態をリセット
 * 
 * Firebase、React Router、その他のモック状態を
 * 初期状態にリセットしてテスト分離を確保。
 */
export function resetAllMocks() {
  resetFirebaseMocks()
  resetReactRouterMocks()
  
  // 全てのモック関数をクリア（ただし実装は維持）
  vi.clearAllMocks()
}

/**
 * 包括的テストクリーンアップ
 * 
 * 全てのクリーンアップ処理をまとめて実行。
 * beforeEach で呼び出してテスト分離を確保する。
 */
export function comprehensiveTestCleanup() {
  cleanupGlobalState()
  cleanupModuleCache()
  resetAllMocks()
}

/**
 * 非同期処理の完了を待機
 * 
 * テスト内の非同期処理が完了するまで待機。
 * React の状態更新やPromiseの完了を確実に待つ。
 */
export async function waitForAsyncOperations() {
  // マイクロタスクキューを空にする
  await new Promise(resolve => setTimeout(resolve, 0))
  
  // 追加でReactの更新サイクルを待つ
  await new Promise(resolve => setTimeout(resolve, 0))
}

/**
 * コンソールエラー/警告をキャプチャ
 * 
 * テスト中のコンソール出力をキャプチャして、
 * テストの検証に使用できるようにする。
 */
export function captureConsoleOutput() {
  const originalError = console.error
  const originalWarn = console.warn
  const errors: string[] = []
  const warnings: string[] = []

  console.error = (...args: unknown[]) => {
    errors.push(args.join(' '))
  }

  console.warn = (...args: unknown[]) => {
    warnings.push(args.join(' '))
  }

  return {
    errors,
    warnings,
    restore: () => {
      console.error = originalError
      console.warn = originalWarn
    }
  }
}