/**
 * Firebase モック共通設定
 * 
 * 全てのテストファイルで共通して使用するFirebaseモック設定。
 * テスト間の干渉を防ぐため、一元管理する。
 */
import { vi } from 'vitest'
import { User } from 'firebase/auth'

/**
 * テスト用ユーザーオブジェクト
 * 
 * 複数のテストで使用される標準的なモックユーザー。
 * 実際のFirebase Userオブジェクトと同じ構造を持つ。
 */
export const mockUser: Partial<User> = {
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  emailVerified: true,
}

/**
 * Firebase Auth モック関数群
 * 
 * 全テストで共通して使用するFirebase Auth関数のモック。
 * 各テストで個別にモックを作成する必要がなくなる。
 */
export const mockFirebaseAuth = {
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  getAuth: vi.fn(),
  connectAuthEmulator: vi.fn(),
}

/**
 * Firebase App モック関数群
 * 
 * Firebase App初期化関連のモック関数。
 * テスト環境でのFirebaseアプリ初期化をシミュレート。
 */
export const mockFirebaseApp = {
  initializeApp: vi.fn(() => ({ name: 'test-app' })),
  getApps: vi.fn(() => []),
  getApp: vi.fn(() => ({ name: 'test-app' })),
}

/**
 * Firebase認証インスタンスモック
 * 
 * テスト用のFirebase認証インスタンス。
 * globalAuth変数の干渉を防ぐため、テスト間でリセット可能。
 */
export const mockAuthInstance = {
  name: 'test-auth-instance',
  currentUser: null,
}

/**
 * Firebase モック設定をリセット
 * 
 * テスト間でモック状態をクリーンにするためのリセット関数。
 * beforeEach で呼び出してテスト分離を確保する。
 */
export function resetFirebaseMocks() {
  // 全てのモック関数をクリア
  Object.values(mockFirebaseAuth).forEach(mock => {
    if (vi.isMockFunction(mock)) {
      mock.mockClear()
    }
  })
  
  Object.values(mockFirebaseApp).forEach(mock => {
    if (vi.isMockFunction(mock)) {
      mock.mockClear()
    }
  })

  // デフォルトの動作を再設定
  mockFirebaseAuth.getAuth.mockReturnValue(mockAuthInstance)
  mockFirebaseAuth.onAuthStateChanged.mockImplementation((_auth, callback) => {
    // デフォルトでは未認証状態
    setTimeout(() => callback(null), 0)
    return vi.fn() // unsubscribe function
  })
}

/**
 * Firebase モジュールの標準モック設定
 * 
 * vi.mock() で使用する標準的なモック設定。
 * 全テストファイルでこの設定を使用する。
 */
export const standardFirebaseAuthMock = () => ({
  signInWithEmailAndPassword: mockFirebaseAuth.signInWithEmailAndPassword,
  createUserWithEmailAndPassword: mockFirebaseAuth.createUserWithEmailAndPassword,
  signOut: mockFirebaseAuth.signOut,
  onAuthStateChanged: mockFirebaseAuth.onAuthStateChanged,
  getAuth: mockFirebaseAuth.getAuth,
  connectAuthEmulator: mockFirebaseAuth.connectAuthEmulator,
  User: {} as User,
})

export const standardFirebaseAppMock = () => ({
  initializeApp: mockFirebaseApp.initializeApp,
  getApps: mockFirebaseApp.getApps,
  getApp: mockFirebaseApp.getApp,
})