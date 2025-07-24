/**
 * Firebase認証ヘルパー関数テスト
 *
 * Firebase認証関連のユーティリティ関数の単体テストを実装。
 * JWTトークン抽出、エラーハンドリング、Auth初期化を検証する。
 * 型安全性を重視し、any型を一切使用しない実装。
 */
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import type { Env } from '../../types';

// Firebase認証エラーのモック（テスト内で使用）
class MockFirebaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FirebaseAuthError';
  }
}

// モック関数の作成
const mockGetOrInitializeAuth = vi.fn();
const mockGetOrInitializeKV = vi.fn();

// firebase-auth-cloudflare-workersライブラリをモック
vi.mock('firebase-auth-cloudflare-workers', () => ({
  Auth: {
    getOrInitialize: mockGetOrInitializeAuth,
  },
  WorkersKVStoreSingle: {
    getOrInitialize: mockGetOrInitializeKV,
  },
}));

// テスト後にモジュールをインポート
const { initializeFirebaseAuth, extractTokenFromHeader, isFirebaseAuthError, normalizeAuthError } =
  await import('../auth');

// 型安全なモック環境変数
const mockEnv: Env = {
  FIREBASE_PROJECT_ID: 'test-project-id',
  PUBLIC_JWK_CACHE_KEY: 'test-cache-key',
  JWT_CACHE: {} as KVNamespace,
  DB: {} as D1Database,
};

// モックAuthインスタンス
interface MockAuth {
  verifyIdToken: Mock<(token: string) => Promise<unknown>>;
}

const mockAuthInstance: MockAuth = {
  verifyIdToken: vi.fn(),
};

// モックKVStoreインスタンス
interface MockKVStore {
  get: Mock<() => Promise<string | null>>;
  put: Mock<(value: string, ttl?: number) => Promise<void>>;
}

const mockKVStoreInstance: MockKVStore = {
  get: vi.fn(),
  put: vi.fn(),
};

describe('Firebase認証ヘルパー関数', () => {
  beforeEach(() => {
    // 各テスト前にモックをリセット
    vi.clearAllMocks();
  });

  describe('initializeFirebaseAuth', () => {
    it('正常な環境変数でFirebase Authインスタンスを初期化', () => {
      // Arrange: モックの戻り値設定
      mockGetOrInitializeKV.mockReturnValue(mockKVStoreInstance);
      mockGetOrInitializeAuth.mockReturnValue(mockAuthInstance);

      // Act: Firebase Auth初期化実行
      const result = initializeFirebaseAuth(mockEnv);

      // Assert: 期待する動作の検証
      expect(mockGetOrInitializeKV).toHaveBeenCalledWith(
        mockEnv.PUBLIC_JWK_CACHE_KEY,
        mockEnv.JWT_CACHE
      );
      expect(mockGetOrInitializeAuth).toHaveBeenCalledWith(
        mockEnv.FIREBASE_PROJECT_ID,
        mockKVStoreInstance
      );
      expect(result).toBe(mockAuthInstance);
    });

    it('KVStoreSingleとAuthの両方が正しく呼び出される', () => {
      // Arrange
      mockGetOrInitializeKV.mockReturnValue(mockKVStoreInstance);
      mockGetOrInitializeAuth.mockReturnValue(mockAuthInstance);

      // Act
      initializeFirebaseAuth(mockEnv);

      // Assert: 両方の関数が呼び出されることを確認
      expect(mockGetOrInitializeKV).toHaveBeenCalledTimes(1);
      expect(mockGetOrInitializeAuth).toHaveBeenCalledTimes(1);
    });

    it('Singletonパターンで同じインスタンスを返却', () => {
      // Arrange: 同一インスタンス返却の設定
      mockGetOrInitializeKV.mockReturnValue(mockKVStoreInstance);
      mockGetOrInitializeAuth.mockReturnValue(mockAuthInstance);

      // Act: 複数回初期化実行
      const result1 = initializeFirebaseAuth(mockEnv);
      const result2 = initializeFirebaseAuth(mockEnv);

      // Assert: 同一インスタンス確認
      expect(result1).toBe(result2);
      expect(result1).toBe(mockAuthInstance);
    });
  });

  describe('extractTokenFromHeader', () => {
    describe('正常ケース', () => {
      it('正しいBearer形式からトークンを抽出', () => {
        // Arrange
        const authHeader = 'Bearer validtoken123';
        const expectedToken = 'validtoken123';

        // Act
        const result = extractTokenFromHeader(authHeader);

        // Assert
        expect(result).toBe(expectedToken);
      });

      it('Bearer後の空白を含むトークンを正しく抽出', () => {
        // Arrange
        const authHeader = 'Bearer   token-with-spaces  ';
        const expectedToken = 'token-with-spaces';

        // Act
        const result = extractTokenFromHeader(authHeader);

        // Assert
        expect(result).toBe(expectedToken);
      });

      it('長いJWTトークンを正しく抽出', () => {
        // Arrange
        const longToken =
          'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWV9';
        const authHeader = `Bearer ${longToken}`;

        // Act
        const result = extractTokenFromHeader(authHeader);

        // Assert
        expect(result).toBe(longToken);
      });
    });

    describe('異常ケース', () => {
      it.each([
        ['null値', null],
        ['undefined値', undefined],
        ['空文字列', ''],
        ['空白のみ', '   '],
      ])('%s の場合はnullを返す', (_description, input) => {
        // Act
        const result = extractTokenFromHeader(input as string | null);

        // Assert
        expect(result).toBeNull();
      });

      it.each([
        ['無効なプレフィックス', 'Token validtoken123'],
        ['小文字bearer', 'bearer validtoken123'],
        ['Bearerのみ', 'Bearer'],
        ['Bearerと空白のみ', 'Bearer   '],
        ['スペースなし', 'Bearervalidtoken123'],
        ['大文字小文字混在', 'BEARER validtoken123'],
      ])('%s の場合はnullを返す', (_description, input) => {
        // Act
        const result = extractTokenFromHeader(input);

        // Assert
        expect(result).toBeNull();
      });
    });
  });

  describe('isFirebaseAuthError', () => {
    describe('Firebase認証エラー判定', () => {
      it.each([
        ['token関連エラー', new Error('Invalid token provided')],
        ['expired関連エラー', new Error('Token has expired')],
        ['invalid関連エラー', new Error('Invalid JWT format')],
        ['firebase関連エラー', new Error('Firebase authentication failed')],
        ['jwt関連エラー', new Error('JWT verification error')],
        ['auth関連エラー', new Error('Authentication error occurred')],
        ['MockFirebaseError', new MockFirebaseError('Firebase test error')],
      ])('%s はFirebase認証エラーと判定', (_description, error) => {
        // Act
        const result = isFirebaseAuthError(error);

        // Assert
        expect(result).toBe(true);
      });

      it('大文字小文字混在のエラーメッセージも正しく判定', () => {
        // Arrange
        const error = new Error('TOKEN EXPIRED - Invalid Authentication');

        // Act
        const result = isFirebaseAuthError(error);

        // Assert
        expect(result).toBe(true);
      });
    });

    describe('非Firebase認証エラー判定', () => {
      it.each([
        ['データベースエラー', new Error('Database connection failed')],
        ['ネットワークエラー', new Error('Network timeout occurred')],
        ['一般的なエラー', new Error('Something went wrong')],
        ['空メッセージ', new Error('')],
      ])('%s はFirebase認証エラーではないと判定', (_description, error) => {
        // Act
        const result = isFirebaseAuthError(error);

        // Assert
        expect(result).toBe(false);
      });

      it.each([
        ['null', null],
        ['undefined', undefined],
        ['文字列', 'error message'],
        ['数値', 123],
        ['オブジェクト', { message: 'error' }],
        ['配列', ['error']],
      ])('非Errorオブジェクト (%s) はfalseを返す', (_description, input) => {
        // Act
        const result = isFirebaseAuthError(input);

        // Assert
        expect(result).toBe(false);
      });
    });
  });

  describe('normalizeAuthError', () => {
    describe('特定エラーメッセージの正規化', () => {
      it.each([
        ['Token expired', 'トークンの有効期限が切れています。再度ログインしてください。'],
        ['JWT has expired', 'トークンの有効期限が切れています。再度ログインしてください。'],
        ['Session expired', 'トークンの有効期限が切れています。再度ログインしてください。'],
      ])('期限切れエラー "%s" を適切に正規化', (errorMessage, expectedMessage) => {
        // Arrange
        const error = new Error(errorMessage);

        // Act
        const result = normalizeAuthError(error);

        // Assert
        expect(result).toBe(expectedMessage);
      });

      it('MockFirebaseError の期限切れも正しく正規化', () => {
        // Arrange
        const error = new MockFirebaseError('Token expired in test');

        // Act
        const result = normalizeAuthError(error);

        // Assert
        expect(result).toBe('トークンの有効期限が切れています。再度ログインしてください。');
      });

      it.each([
        ['Invalid token', '無効なトークンです。'],
        ['Malformed JWT', '無効なトークンです。'],
        ['Token is invalid', '無効なトークンです。'],
        ['JWT malformed', '無効なトークンです。'],
      ])('無効トークンエラー "%s" を適切に正規化', (errorMessage, expectedMessage) => {
        // Arrange
        const error = new Error(errorMessage);

        // Act
        const result = normalizeAuthError(error);

        // Assert
        expect(result).toBe(expectedMessage);
      });

      it.each([
        ['Token missing', '認証トークンが必要です。'],
        ['Required field missing', '認証トークンが必要です。'],
        ['Authorization required', '認証トークンが必要です。'],
      ])('不足エラー "%s" を適切に正規化', (errorMessage, expectedMessage) => {
        // Arrange
        const error = new Error(errorMessage);

        // Act
        const result = normalizeAuthError(error);

        // Assert
        expect(result).toBe(expectedMessage);
      });

      it('大文字小文字混在のエラーメッセージも正しく処理', () => {
        // Arrange
        const error = new Error('TOKEN EXPIRED - Please Login Again');

        // Act
        const result = normalizeAuthError(error);

        // Assert
        expect(result).toBe('トークンの有効期限が切れています。再度ログインしてください。');
      });
    });

    describe('デフォルトエラーメッセージ', () => {
      it.each([
        ['認識されないエラー', new Error('Unknown error occurred')],
        ['空メッセージ', new Error('')],
        ['データベースエラー', new Error('Database connection failed')],
      ])('%s はデフォルトメッセージを返す', (_description, error) => {
        // Act
        const result = normalizeAuthError(error);

        // Assert
        expect(result).toBe('認証に失敗しました。');
      });

      it.each([
        ['null', null],
        ['undefined', undefined],
        ['文字列', 'error message'],
        ['数値', 123],
        ['オブジェクト', { message: 'error' }],
      ])('非Errorオブジェクト (%s) はデフォルトメッセージを返す', (_description, input) => {
        // Act
        const result = normalizeAuthError(input);

        // Assert
        expect(result).toBe('認証に失敗しました。');
      });
    });

    describe('複合条件のテスト', () => {
      it('複数キーワードを含む場合は最初にマッチした条件を適用', () => {
        // Arrange: expiredとinvalidの両方を含む
        const error = new Error('Token expired and invalid format detected');

        // Act
        const result = normalizeAuthError(error);

        // Assert: expired が先に処理される
        expect(result).toBe('トークンの有効期限が切れています。再度ログインしてください。');
      });

      it('部分一致でも正しく動作', () => {
        // Arrange
        const error = new Error('JWT token has been expired due to timeout');

        // Act
        const result = normalizeAuthError(error);

        // Assert
        expect(result).toBe('トークンの有効期限が切れています。再度ログインしてください。');
      });
    });
  });
});
