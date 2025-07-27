/**
 * Firebase認証ミドルウェア
 *
 * JWTトークンを検証し、認証されたユーザー情報をコンテキストに設定する。
 * 保護されたAPIエンドポイントで使用される。
 */
import type { MiddlewareHandler } from 'hono';
import type { Env } from '../types';
import {
  initializeFirebaseAuth,
  extractTokenFromHeader,
  normalizeAuthError,
  isFirebaseAuthError,
} from '../utils/auth';

/**
 * 認証済みユーザー情報をコンテキストに追加する型拡張
 */
declare module 'hono' {
  interface ContextVariableMap {
    /** 認証済みユーザーのFirebase UID */
    userId: string;
    /** 認証済みユーザーのメールアドレス */
    userEmail: string;
    /** Firebase ID tokenのクレーム情報 */
    firebaseToken: unknown;
  }
}

/**
 * JWT認証ミドルウェア
 *
 * Authorization headerからJWTを抽出し、Firebase認証で検証する。
 * 認証に成功した場合、ユーザー情報をコンテキストに設定。
 * 認証に失敗した場合、401 Unauthorizedを返す。
 *
 * @returns Honoミドルウェア関数
 */
export const authMiddleware: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  try {
    // デバッグログ: 認証プロセス開始
    console.log('🔄 authMiddleware: 認証プロセス開始', {
      method: c.req.method,
      url: c.req.url,
      timestamp: new Date().toISOString()
    });

    // Authorization headerからJWTトークンを取得
    const authHeader = c.req.header('Authorization');
    console.log('🔍 authMiddleware: Authorization header確認', {
      headerExists: !!authHeader,
      headerPreview: authHeader ? authHeader.substring(0, 20) + '...' : null
    });
    
    const token = extractTokenFromHeader(authHeader);
    console.log('🔍 authMiddleware: トークン抽出結果', {
      tokenExtracted: !!token,
      tokenLength: token?.length || 0,
      tokenPreview: token ? token.substring(0, 20) + '...' : null
    });

    if (!token) {
      console.log('❌ authMiddleware: トークンなし');
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
    console.log('🔄 authMiddleware: Firebase Auth初期化');
    const auth = initializeFirebaseAuth(c.env);

    // JWT ID tokenを検証
    console.log('🔄 authMiddleware: JWT検証開始');
    const decodedToken = await auth.verifyIdToken(token);
    console.log('🔍 authMiddleware: JWT検証結果', {
      tokenValid: !!decodedToken,
      hasSubject: !!(decodedToken as any)?.sub,
      hasEmail: !!(decodedToken as any)?.email
    });

    if (!decodedToken) {
      console.log('❌ authMiddleware: JWT検証失敗');
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
      console.log('❌ authMiddleware: 必須フィールド不足', {
        hasSub: !!decodedToken.sub,
        hasEmail: !!decodedToken.email
      });
      return c.json(
        {
          success: false,
          error: '認証トークンに必要な情報が含まれていません。',
        },
        401
      );
    }

    // 認証済みユーザー情報をコンテキストに設定
    c.set('userId', decodedToken.sub);
    c.set('userEmail', decodedToken.email);
    c.set('firebaseToken', decodedToken);
    
    console.log('✅ authMiddleware: 認証成功、ユーザー情報設定完了', {
      userId: decodedToken.sub,
      userEmail: decodedToken.email
    });

    // 次のミドルウェア/ハンドラーに処理を渡す
    await next();
  } catch (error) {
    // エラーログ出力（本番環境では適切なロガーを使用）
    // eslint-disable-next-line no-console
    console.error('❌ authMiddleware: 認証ミドルウェアエラー:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      isFirebaseError: isFirebaseAuthError(error)
    });

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
};

/**
 * 認証オプショナルミドルウェア
 *
 * 認証トークンがある場合は検証するが、ない場合でも処理を続行する。
 * パブリック/プライベート両方に対応するエンドポイントで使用。
 *
 * @returns Honoミドルウェア関数
 */
export const optionalAuthMiddleware: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  try {
    const authHeader = c.req.header('Authorization');
    const token = extractTokenFromHeader(authHeader);

    // トークンがない場合は認証なしで続行
    if (!token) {
      await next();
      return;
    }

    // トークンがある場合は検証を試行
    const auth = initializeFirebaseAuth(c.env);
    const decodedToken = await auth.verifyIdToken(token);

    if (decodedToken && decodedToken.sub && decodedToken.email) {
      // 認証成功時はユーザー情報を設定
      c.set('userId', decodedToken.sub);
      c.set('userEmail', decodedToken.email);
      c.set('firebaseToken', decodedToken);
    }

    await next();
  } catch (error) {
    // 認証オプショナルの場合はエラーでも続行
    // eslint-disable-next-line no-console
    console.warn('オプショナル認証ミドルウェア警告:', error);
    await next();
  }
};
