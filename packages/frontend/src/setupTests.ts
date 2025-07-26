/**
 * テスト環境セットアップファイル
 * 
 * 全てのテストファイルで使用される共通設定を定義。
 * testing-library/jest-domを import して DOM マッチャーを追加する。
 * 
 * テスト間干渉を防ぐための統一設定を含む。
 */
import '@testing-library/jest-dom'
import { vi, beforeEach, afterEach } from 'vitest'
// 動的インポートで循環参照を防ぐ
// モック設定は下部で定義

/**
 * ブラウザ環境のモック設定
 * 
 * テスト環境でのブラウザAPIのモック。
 * window.locationなどの基本的なブラウザAPIを提供。
 * React Routerが必要とするpropertiesを完全に提供。
 */
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000/',
    origin: 'http://localhost:3000',
    protocol: 'http:',
    host: 'localhost:3000',
    hostname: 'localhost',
    port: '3000',
    pathname: '/',
    search: '',
    hash: '',
    // React Router が必要とするメソッド
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
  },
  writable: true,
})

// ResizeObserver のモック（React コンポーネントで使用される可能性）
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

/**
 * Firebase設定に必要な環境変数をテスト環境で設定
 * 
 * 全てのテストで共通して使用されるFirebase環境変数を定義。
 * 各テストファイルで個別に設定する必要がなくなる。
 */
vi.stubEnv('VITE_FIREBASE_API_KEY', 'test-api-key')
vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', 'test-project.firebaseapp.com')
vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project')
vi.stubEnv('VITE_FIREBASE_STORAGE_BUCKET', 'test-project.appspot.com')
vi.stubEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', '123456789')
vi.stubEnv('VITE_FIREBASE_APP_ID', '1:123456789:web:abcdef')
vi.stubEnv('VITE_USE_AUTH_EMULATOR', 'false')
vi.stubEnv('DEV', false)

/**
 * Firebase モジュールの統一モック設定
 * 
 * 全てのテストファイルで一貫したFirebaseモックを使用。
 * テスト間でのモック状態干渉を防ぐ。
 */
vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn().mockImplementation((_auth, callback) => {
    // E2Eテストでも確実にコールバックが実行されるよう、即座に実行
    // 非同期処理をシミュレートしつつ、確実に完了させる
    Promise.resolve().then(() => {
      callback(null) // デフォルトで未認証
    })
    return vi.fn() // unsubscribe
  }),
  getAuth: vi.fn().mockReturnValue({ name: 'test-auth-instance', emulatorConfig: null }),
  connectAuthEmulator: vi.fn(),
  User: {},
}))

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({ name: 'test-app' })),
  getApps: vi.fn(() => []),
  getApp: vi.fn(() => ({ name: 'test-app' })),
}))

/**
 * React Router モジュールの統一モック設定
 * 
 * 全てのテストファイルで一貫したReact Routerモックを使用。
 * Router状態の干渉を防ぐ。
 */
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  const mockNavigate = vi.fn()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/', search: '', hash: '', state: null, key: 'default' }),
    useParams: () => ({}),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  }
})

/**
 * グローバルなモックインスタンス
 * 
 * 全テストで一貫した Firebase auth インスタンスを使用。
 */
const mockAuthInstance = { 
  name: 'test-auth-instance', 
  emulatorConfig: null,
  currentUser: null
}

/**
 * Firebase config モジュールのモック
 * 
 * globalAuth変数の干渉を防ぐため、config/firebaseを共通でモック。
 * 各テストで個別にモックする必要がなくなる。
 */
vi.mock('./config/firebase', async (importOriginal) => {
  // 実際の実装を取得して部分モック
  const actual = await importOriginal()
  return {
    ...actual,
    // auth関数のみモックし、他は実装を使用。グローバルauth変数があっても、このモックが優先される
    auth: vi.fn().mockResolvedValue(mockAuthInstance),
  }
})

/**
 * 全テスト共通のbeforeEach設定
 * 
 * 各テスト実行前に呼び出される共通クリーンアップ処理。
 * テスト間の干渉を防ぎ、独立したテスト実行を保証。
 */
beforeEach(async () => {
  // ブラウザストレージをクリア
  localStorage.clear()
  sessionStorage.clear()
  
  // History状態をリセット（React Router用）
  if (typeof window !== 'undefined' && window.history) {
    window.history.replaceState(null, '', '/')
  }
  
  // タイマーをクリア
  vi.clearAllTimers()
  vi.useRealTimers()
  
  // Firebase config の auth 関数モックを再設定して確実に動作させる
  const { auth } = await import('./config/firebase')
  vi.mocked(auth).mockResolvedValue(mockAuthInstance)
  
  // E2Eテスト用に Firebase Auth モックも再設定
  const { onAuthStateChanged } = await import('firebase/auth')
  vi.mocked(onAuthStateChanged).mockImplementation((_auth, callback) => {
    // E2Eテストでも確実にコールバックが実行されるよう、Promise.resolve()を使用
    Promise.resolve().then(() => {
      callback(null) // デフォルトで未認証
    })
    return vi.fn() // unsubscribe
  })
})

/**
 * 全テスト共通のafterEach設定
 * 
 * 各テスト実行後のクリーンアップ処理。
 * 非同期処理の完了を待ち、残留状態をクリア。
 */
afterEach(async () => {
  // 非同期処理の完了を待機
  await new Promise(resolve => setTimeout(resolve, 0))
  
  // 全てのタイマーをクリア
  vi.clearAllTimers()
  vi.useRealTimers()
})