/**
 * 認証関連エンドポイント
 *
 * Firebase認証の統合と、認証済みユーザー情報の管理を行う。
 * JWT検証とデータベースユーザー情報の同期処理を含む。
 */
import { OpenAPIRoute, Str } from 'chanfana';
import { z } from 'zod';
import type { AppContext } from '../types';
import { UserService } from '../services/userService';
import { getDatabase } from '../database/connection';
import {
  initializeFirebaseAuth,
  extractTokenFromHeader,
  normalizeAuthError,
  isFirebaseAuthError,
} from '../utils/auth';

/**
 * JWT検証リクエストスキーマ
 */
const VerifyTokenSchema = z.object({
  /** Firebase ID Token */
  idToken: Str({ description: 'Firebase ID Token for verification' }),
});

/**
 * 認証レスポンススキーマ
 */
const AuthResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  user: z
    .object({
      id: z.string(),
      email: z.string(),
      displayName: z.string().optional(),
      createdAt: z.string(),
      updatedAt: z.string(),
    })
    .optional(),
  error: z.string().optional(),
});

/**
 * POST /api/auth/verify - 認証トークン検証エンドポイント
 *
 * Firebase ID Tokenを検証し、ユーザー情報をデータベースに同期する。
 * 新規ユーザーの場合は自動的にユーザーレコードを作成。
 */
export class VerifyAuth extends OpenAPIRoute {
  schema = {
    tags: ['Authentication'],
    summary: 'Verify Firebase ID Token',
    description: 'Verify Firebase ID Token and sync user information with database',
    request: {
      body: {
        content: {
          'application/json': {
            schema: VerifyTokenSchema,
          },
        },
      },
    },
    responses: {
      '200': {
        description: 'Authentication successful',
        content: {
          'application/json': {
            schema: AuthResponseSchema,
          },
        },
      },
      '401': {
        description: 'Invalid or expired token',
        content: {
          'application/json': {
            schema: AuthResponseSchema,
          },
        },
      },
      '500': {
        description: 'Server error',
        content: {
          'application/json': {
            schema: AuthResponseSchema,
          },
        },
      },
    },
  };

  async handle(c: AppContext): Promise<Response> {
    try {
      // リクエストボディを取得・検証
      const data = await this.getValidatedData<typeof this.schema>();
      const { idToken } = data.body;

      // Firebase Authインスタンスを初期化
      const auth = initializeFirebaseAuth(c.env);

      // JWT ID tokenを検証
      const decodedToken = await auth.verifyIdToken(idToken);

      if (!decodedToken) {
        return c.json(
          {
            success: false,
            error: '無効な認証トークンです。',
          },
          401
        );
      }

      // 必須フィールドの検証
      if (!decodedToken.sub || !decodedToken.email) {
        return c.json(
          {
            success: false,
            error: '認証トークンに必要な情報が含まれていません。',
          },
          401
        );
      }

      // データベース接続とユーザーサービス初期化
      const db = getDatabase(c);
      const userService = new UserService(db, c.env);

      // ユーザー情報をデータベースに同期（存在しない場合は作成）
      const user = await userService.findOrCreateUser(
        decodedToken.sub,
        decodedToken.email,
        decodedToken.name || decodedToken.display_name
      );

      return c.json({
        success: true,
        message: '認証に成功しました。',
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName || undefined,
          createdAt: user.createdAt || '',
          updatedAt: user.updatedAt || '',
        },
      });
    } catch (error) {
      // エラーログ出力（本番環境では適切なロガーを使用）
      // eslint-disable-next-line no-console
      console.error('認証検証エラー:', error);

      // Firebase認証エラーの場合は適切なメッセージを返す
      if (isFirebaseAuthError(error)) {
        return c.json(
          {
            success: false,
            error: normalizeAuthError(error),
          },
          401
        );
      }

      // その他のサーバーエラー
      return c.json(
        {
          success: false,
          error: '認証処理中にエラーが発生しました。',
        },
        500
      );
    }
  }
}

/**
 * GET /api/auth/me - 認証済みユーザー情報取得エンドポイント
 *
 * Authorization headerからJWTを検証し、ユーザー情報を返す。
 * ユーザーセッション確認やプロフィール表示で使用。
 */
export class GetCurrentUser extends OpenAPIRoute {
  schema = {
    tags: ['Authentication'],
    summary: 'Get current authenticated user',
    description: 'Get information of the currently authenticated user',
    security: [{ bearerAuth: [] }],
    responses: {
      '200': {
        description: 'User information retrieved successfully',
        content: {
          'application/json': {
            schema: AuthResponseSchema,
          },
        },
      },
      '401': {
        description: 'Not authenticated',
        content: {
          'application/json': {
            schema: AuthResponseSchema,
          },
        },
      },
      '500': {
        description: 'Server error',
        content: {
          'application/json': {
            schema: AuthResponseSchema,
          },
        },
      },
    },
  };

  async handle(c: AppContext): Promise<Response> {
    try {
      // Authorization headerからJWTトークンを取得
      const authHeader = c.req.header('Authorization');
      const token = extractTokenFromHeader(authHeader);

      if (!token) {
        return c.json(
          {
            success: false,
            error:
              '認証トークンが必要です。Authorization headerに "Bearer <token>" 形式で指定してください。',
          },
          401
        );
      }

      // Firebase Authインスタンスを初期化
      const auth = initializeFirebaseAuth(c.env);

      // JWT ID tokenを検証
      const decodedToken = await auth.verifyIdToken(token);

      if (!decodedToken || !decodedToken.sub || !decodedToken.email) {
        return c.json(
          {
            success: false,
            error: '無効な認証トークンです。',
          },
          401
        );
      }

      // データベースから最新のユーザー情報を取得
      const db = getDatabase(c);
      const userService = new UserService(db, c.env);
      const user = await userService.getUserById(decodedToken.sub);

      if (!user) {
        return c.json(
          {
            success: false,
            error: 'ユーザー情報が見つかりません。',
          },
          404
        );
      }

      return c.json({
        success: true,
        message: 'ユーザー情報を取得しました。',
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName || undefined,
          createdAt: user.createdAt || '',
          updatedAt: user.updatedAt || '',
        },
      });
    } catch (error) {
      // エラーログ出力
      // eslint-disable-next-line no-console
      console.error('ユーザー情報取得エラー:', error);

      // Firebase認証エラーの場合は適切なメッセージを返す
      if (isFirebaseAuthError(error)) {
        return c.json(
          {
            success: false,
            error: normalizeAuthError(error),
          },
          401
        );
      }

      return c.json(
        {
          success: false,
          error: 'ユーザー情報の取得中にエラーが発生しました。',
        },
        500
      );
    }
  }
}
