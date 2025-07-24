/**
 * 認証ミドルウェアテスト
 *
 * Firebase認証ミドルウェアの単体テストを実装。
 * JWTトークン検証、エラーハンドリング、コンテキスト設定を検証する。
 * 型安全性を重視し、any型を一切使用しない実装。
 */
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import type { Context } from 'hono';
import type { Env } from '../../types';

// Firebase認証エラーのモック（モック定義より前に配置）
class MockFirebaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FirebaseAuthError';
  }
}

// モック関数の作成
const mockVerifyIdToken = vi.fn();
const mockInitializeFirebaseAuth = vi.fn(() => ({ verifyIdToken: mockVerifyIdToken }));
const mockExtractTokenFromHeader = vi.fn();
const mockNormalizeAuthError = vi.fn((_error: unknown) => 'Firebase認証エラー');
const mockIsFirebaseAuthError = vi.fn((error: unknown) => error instanceof MockFirebaseError);

// firebase-auth-cloudflare-workersライブラリをモック
vi.mock('firebase-auth-cloudflare-workers', () => ({
  Auth: {
    getOrInitialize: vi.fn(() => ({ verifyIdToken: mockVerifyIdToken })),
  },
  WorkersKVStoreSingle: {
    getOrInitialize: vi.fn(() => ({
      get: vi.fn(),
      put: vi.fn(),
    })),
  },
}));

// 認証ヘルパー関数をモック
vi.mock('../../utils/auth', () => ({
  initializeFirebaseAuth: mockInitializeFirebaseAuth,
  extractTokenFromHeader: mockExtractTokenFromHeader,
  normalizeAuthError: mockNormalizeAuthError,
  isFirebaseAuthError: mockIsFirebaseAuthError,
}));

// テスト後にモジュールをインポート
const { authMiddleware, optionalAuthMiddleware } = await import('../auth');

const mockEnv: Env = {
  FIREBASE_PROJECT_ID: 'test-project',
  PUBLIC_JWK_CACHE_KEY: 'test-cache-key',
  JWT_CACHE: {} as KVNamespace,
  DB: {} as D1Database,
};

// 有効なデコードされたトークンのモック
const validDecodedToken = {
  sub: 'firebase-uid-123',
  email: 'test@example.com',
  aud: 'test-project',
  iss: 'https://securetoken.google.com/test-project',
  exp: Math.floor(Date.now() / 1000) + 3600, // 1時間後に期限切れ
  iat: Math.floor(Date.now() / 1000),
};

// Contextの型定義
interface ContextVariableMap {
  userId: string;
  userEmail: string;
  firebaseToken: unknown;
}

// モックコンテキストの型定義
interface MockContextBase {
  req: {
    header: Mock<(name: string) => string | undefined>;
  };
  env: Env;
  set: Mock<(key: keyof ContextVariableMap, value: unknown) => void>;
  json: Mock<(data: object, status?: number) => Response>;
  get: Mock<(key: keyof ContextVariableMap) => unknown>;
}

// 型安全なモックコンテキストを作成するヘルパー
const createMockContext = (authHeader?: string): MockContextBase => {
  return {
    req: {
      header: vi.fn((name: string) => (name === 'Authorization' ? authHeader : undefined)),
    },
    env: mockEnv,
    set: vi.fn(),
    json: vi.fn((_data: object, _status?: number) => new Response()),
    get: vi.fn(),
  };
};

const createMockNext = (): Mock<() => Promise<void>> => vi.fn().mockResolvedValue(undefined);

describe('認証ミドルウェア', () => {
  beforeEach(() => {
    // 各テスト前にモックをリセット
    vi.clearAllMocks();
  });

  describe('authMiddleware', () => {
    describe('認証成功ケース', () => {
      it('有効なJWTトークンで認証成功', async () => {
        // Arrange: 有効なトークンとモックの設定
        const validToken = 'valid-jwt-token';
        const authHeader = `Bearer ${validToken}`;
        const context = createMockContext(authHeader);
        const next = createMockNext();

        // モックの戻り値設定
        mockExtractTokenFromHeader.mockReturnValue(validToken);
        mockVerifyIdToken.mockResolvedValue(validDecodedToken);

        // Act: ミドルウェア実行
        await authMiddleware(context as unknown as Context<{ Bindings: Env }>, next);

        // Assert: 期待する動作の検証
        expect(mockExtractTokenFromHeader).toHaveBeenCalledWith(authHeader);
        expect(mockVerifyIdToken).toHaveBeenCalledWith(validToken);
        expect(next).toHaveBeenCalled();
      });

      it('認証成功時にコンテキスト変数が正しく設定される', async () => {
        // Arrange
        const validToken = 'valid-jwt-token';
        const context = createMockContext(`Bearer ${validToken}`);
        const next = createMockNext();

        mockExtractTokenFromHeader.mockReturnValue(validToken);
        mockVerifyIdToken.mockResolvedValue(validDecodedToken);

        // Act
        await authMiddleware(context as unknown as Context<{ Bindings: Env }>, next);

        // Assert: コンテキスト変数の設定を確認
        expect(context.set).toHaveBeenCalledWith('userId', validDecodedToken.sub);
        expect(context.set).toHaveBeenCalledWith('userEmail', validDecodedToken.email);
        expect(context.set).toHaveBeenCalledWith('firebaseToken', validDecodedToken);
      });

      it('認証成功後にnext()が呼び出される', async () => {
        // Arrange
        const validToken = 'valid-jwt-token';
        const context = createMockContext(`Bearer ${validToken}`);
        const next = createMockNext();

        mockExtractTokenFromHeader.mockReturnValue(validToken);
        mockVerifyIdToken.mockResolvedValue(validDecodedToken);

        // Act
        await authMiddleware(context as unknown as Context<{ Bindings: Env }>, next);

        // Assert
        expect(next).toHaveBeenCalledTimes(1);
      });

      it('Firebase UIDとemailが正しく抽出される', async () => {
        // Arrange
        const customToken = {
          sub: 'custom-uid-456',
          email: 'custom@example.com',
          aud: 'test-project',
          iss: 'https://securetoken.google.com/test-project',
          exp: Math.floor(Date.now() / 1000) + 3600,
          iat: Math.floor(Date.now() / 1000),
        };
        const validToken = 'custom-jwt-token';
        const context = createMockContext(`Bearer ${validToken}`);
        const next = createMockNext();

        mockExtractTokenFromHeader.mockReturnValue(validToken);
        mockVerifyIdToken.mockResolvedValue(customToken);

        // Act
        await authMiddleware(context as unknown as Context<{ Bindings: Env }>, next);

        // Assert
        expect(context.set).toHaveBeenCalledWith('userId', 'custom-uid-456');
        expect(context.set).toHaveBeenCalledWith('userEmail', 'custom@example.com');
      });
    });

    describe('認証失敗ケース', () => {
      it('Authorization headerなしでエラー', async () => {
        // Arrange: Authorization headerなし
        const context = createMockContext(); // authHeaderを渡さない
        const next = createMockNext();

        mockExtractTokenFromHeader.mockReturnValue(null);

        // Act
        await authMiddleware(context as unknown as Context<{ Bindings: Env }>, next);

        // Assert
        expect(context.json).toHaveBeenCalledWith(
          {
            success: false,
            error:
              '認証トークンが必要です。Authorization headerに "Bearer <token>" 形式で指定してください。',
          },
          401
        );
        expect(next).not.toHaveBeenCalled();
      });

      it('無効なBearer形式でエラー', async () => {
        // Arrange: 無効なBearer形式
        const context = createMockContext('InvalidFormat token-value');
        const next = createMockNext();

        mockExtractTokenFromHeader.mockReturnValue(null);

        // Act
        await authMiddleware(context as unknown as Context<{ Bindings: Env }>, next);

        // Assert
        expect(context.json).toHaveBeenCalledWith(
          {
            success: false,
            error:
              '認証トークンが必要です。Authorization headerに "Bearer <token>" 形式で指定してください。',
          },
          401
        );
        expect(next).not.toHaveBeenCalled();
      });

      it('JWTトークンが空でエラー', async () => {
        // Arrange: 空のトークン
        const context = createMockContext('Bearer ');
        const next = createMockNext();

        mockExtractTokenFromHeader.mockReturnValue('');

        // Act
        await authMiddleware(context as unknown as Context<{ Bindings: Env }>, next);

        // Assert
        expect(context.json).toHaveBeenCalledWith(
          {
            success: false,
            error:
              '認証トークンが必要です。Authorization headerに "Bearer <token>" 形式で指定してください。',
          },
          401
        );
        expect(next).not.toHaveBeenCalled();
      });

      it('Firebase Auth検証失敗でエラー', async () => {
        // Arrange: Firebase検証失敗
        const invalidToken = 'invalid-jwt-token';
        const context = createMockContext(`Bearer ${invalidToken}`);
        const next = createMockNext();

        mockExtractTokenFromHeader.mockReturnValue(invalidToken);
        mockVerifyIdToken.mockResolvedValue(null);

        // Act
        await authMiddleware(context as unknown as Context<{ Bindings: Env }>, next);

        // Assert
        expect(context.json).toHaveBeenCalledWith(
          {
            success: false,
            error: '無効な認証トークンです。',
          },
          401
        );
        expect(next).not.toHaveBeenCalled();
      });

      it('JWTにsub(UID)が含まれていない場合エラー', async () => {
        // Arrange: subフィールドなし
        const tokenWithoutSub = {
          email: 'test@example.com',
          aud: 'test-project',
          iss: 'https://securetoken.google.com/test-project',
          exp: Math.floor(Date.now() / 1000) + 3600,
          iat: Math.floor(Date.now() / 1000),
        };
        const validToken = 'token-without-sub';
        const context = createMockContext(`Bearer ${validToken}`);
        const next = createMockNext();

        mockExtractTokenFromHeader.mockReturnValue(validToken);
        mockVerifyIdToken.mockResolvedValue(tokenWithoutSub);

        // Act
        await authMiddleware(context as unknown as Context<{ Bindings: Env }>, next);

        // Assert
        expect(context.json).toHaveBeenCalledWith(
          {
            success: false,
            error: '認証トークンに必要な情報が含まれていません。',
          },
          401
        );
        expect(next).not.toHaveBeenCalled();
      });

      it('JWTにemailが含まれていない場合エラー', async () => {
        // Arrange: emailフィールドなし
        const tokenWithoutEmail = {
          sub: 'firebase-uid-123',
          aud: 'test-project',
          iss: 'https://securetoken.google.com/test-project',
          exp: Math.floor(Date.now() / 1000) + 3600,
          iat: Math.floor(Date.now() / 1000),
        };
        const validToken = 'token-without-email';
        const context = createMockContext(`Bearer ${validToken}`);
        const next = createMockNext();

        mockExtractTokenFromHeader.mockReturnValue(validToken);
        mockVerifyIdToken.mockResolvedValue(tokenWithoutEmail);

        // Act
        await authMiddleware(context as unknown as Context<{ Bindings: Env }>, next);

        // Assert
        expect(context.json).toHaveBeenCalledWith(
          {
            success: false,
            error: '認証トークンに必要な情報が含まれていません。',
          },
          401
        );
        expect(next).not.toHaveBeenCalled();
      });
    });

    describe('エラーハンドリング', () => {
      it('Firebase認証エラーの適切な処理', async () => {
        // Arrange: Firebase認証エラー
        const validToken = 'token-that-causes-firebase-error';
        const context = createMockContext(`Bearer ${validToken}`);
        const next = createMockNext();
        const firebaseError = new MockFirebaseError('Firebase認証に失敗しました');

        mockExtractTokenFromHeader.mockReturnValue(validToken);
        mockVerifyIdToken.mockRejectedValue(firebaseError);
        mockIsFirebaseAuthError.mockReturnValue(true);

        // Act
        await authMiddleware(context as unknown as Context<{ Bindings: Env }>, next);

        // Assert
        expect(context.json).toHaveBeenCalledWith(
          {
            success: false,
            error: 'Firebase認証エラー',
          },
          401
        );
        expect(next).not.toHaveBeenCalled();
      });

      it('サーバーエラーの適切な処理', async () => {
        // Arrange: 一般的なサーバーエラー
        const validToken = 'token-that-causes-server-error';
        const context = createMockContext(`Bearer ${validToken}`);
        const next = createMockNext();
        const serverError = new Error('データベース接続エラー');

        mockExtractTokenFromHeader.mockReturnValue(validToken);
        mockVerifyIdToken.mockRejectedValue(serverError);
        mockIsFirebaseAuthError.mockReturnValue(false);

        // Act
        await authMiddleware(context as unknown as Context<{ Bindings: Env }>, next);

        // Assert
        expect(context.json).toHaveBeenCalledWith(
          {
            success: false,
            error: '認証処理中にエラーが発生しました。',
          },
          500
        );
        expect(next).not.toHaveBeenCalled();
      });

      it('ネットワークエラーの適切な処理', async () => {
        // Arrange: ネットワークエラー
        const validToken = 'token-that-causes-network-error';
        const context = createMockContext(`Bearer ${validToken}`);
        const next = createMockNext();
        const networkError = new Error('NETWORK_ERROR: Connection timeout');

        mockExtractTokenFromHeader.mockReturnValue(validToken);
        mockVerifyIdToken.mockRejectedValue(networkError);
        mockIsFirebaseAuthError.mockReturnValue(false);

        // Act
        await authMiddleware(context as unknown as Context<{ Bindings: Env }>, next);

        // Assert
        expect(context.json).toHaveBeenCalledWith(
          {
            success: false,
            error: '認証処理中にエラーが発生しました。',
          },
          500
        );
        expect(next).not.toHaveBeenCalled();
      });
    });
  });

  describe('optionalAuthMiddleware', () => {
    describe('認証オプショナルケース', () => {
      it('トークンなしでも処理続行', async () => {
        // Arrange: Authorization headerなし
        const context = createMockContext();
        const next = createMockNext();

        mockExtractTokenFromHeader.mockReturnValue(null);

        // Act
        await optionalAuthMiddleware(context as unknown as Context<{ Bindings: Env }>, next);

        // Assert: 認証なしで処理続行
        expect(next).toHaveBeenCalled();
        expect(context.set).not.toHaveBeenCalled(); // ユーザー情報は設定されない
      });

      it('有効トークンで認証情報設定', async () => {
        // Arrange: 有効なトークン
        const validToken = 'valid-jwt-token';
        const context = createMockContext(`Bearer ${validToken}`);
        const next = createMockNext();

        mockExtractTokenFromHeader.mockReturnValue(validToken);
        mockVerifyIdToken.mockResolvedValue(validDecodedToken);

        // Act
        await optionalAuthMiddleware(context as unknown as Context<{ Bindings: Env }>, next);

        // Assert: 認証情報が設定され処理続行
        expect(context.set).toHaveBeenCalledWith('userId', validDecodedToken.sub);
        expect(context.set).toHaveBeenCalledWith('userEmail', validDecodedToken.email);
        expect(context.set).toHaveBeenCalledWith('firebaseToken', validDecodedToken);
        expect(next).toHaveBeenCalled();
      });

      it('無効トークンでも処理続行（エラーなし）', async () => {
        // Arrange: 無効なトークン（Firebase認証エラー）
        const invalidToken = 'invalid-jwt-token';
        const context = createMockContext(`Bearer ${invalidToken}`);
        const next = createMockNext();
        const firebaseError = new MockFirebaseError('Invalid token');

        mockExtractTokenFromHeader.mockReturnValue(invalidToken);
        mockVerifyIdToken.mockRejectedValue(firebaseError);

        // Act
        await optionalAuthMiddleware(context as unknown as Context<{ Bindings: Env }>, next);

        // Assert: エラーでも処理続行
        expect(next).toHaveBeenCalled();
        expect(context.set).not.toHaveBeenCalled(); // ユーザー情報は設定されない
        expect(context.json).not.toHaveBeenCalled(); // エラーレスポンスは返さない
      });
    });
  });
});
