/**
 * React Router モック共通設定
 * 
 * 全てのテストファイルで共通して使用するReact Routerモック設定。
 * テスト間でのRouter状態干渉を防ぐため、一元管理する。
 */
import { vi } from 'vitest'

/**
 * React Router モック関数群
 * 
 * 全テストで共通して使用するReact Router関数のモック。
 * ナビゲーション、ロケーション管理をシミュレート。
 */
export const mockReactRouter = {
  useNavigate: vi.fn(),
  useLocation: vi.fn(),
  useParams: vi.fn(),
  useSearchParams: vi.fn(),
}

/**
 * デフォルトのナビゲーション関数モック
 * 
 * useNavigate()で返されるナビゲーション関数のモック。
 * ルート変更をシミュレートし、テストで検証可能。
 */
export const mockNavigate = vi.fn()

/**
 * デフォルトのロケーションオブジェクト
 * 
 * useLocation()で返されるロケーションオブジェクトのモック。
 * 現在のパスやstate情報をシミュレート。
 */
export const mockLocation = {
  pathname: '/',
  search: '',
  hash: '',
  state: null,
  key: 'default',
}

/**
 * React Router モック設定をリセット
 * 
 * テスト間でRouter状態をクリーンにするためのリセット関数。
 * beforeEach で呼び出してテスト分離を確保する。
 */
export function resetReactRouterMocks() {
  // 全てのモック関数をクリア
  Object.values(mockReactRouter).forEach(mock => {
    if (vi.isMockFunction(mock)) {
      mock.mockClear()
    }
  })
  
  mockNavigate.mockClear()

  // デフォルトの動作を再設定
  mockReactRouter.useNavigate.mockReturnValue(mockNavigate)
  mockReactRouter.useLocation.mockReturnValue(mockLocation)
  mockReactRouter.useParams.mockReturnValue({})
  mockReactRouter.useSearchParams.mockReturnValue([new URLSearchParams(), vi.fn()])
}

/**
 * React Router モジュールの標準モック設定
 * 
 * vi.mock() で使用する標準的なモック設定。
 * 全テストファイルでこの設定を使用する。
 */
export const standardReactRouterMock = async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: mockReactRouter.useNavigate,
    useLocation: mockReactRouter.useLocation,
    useParams: mockReactRouter.useParams,
    useSearchParams: mockReactRouter.useSearchParams,
  }
}