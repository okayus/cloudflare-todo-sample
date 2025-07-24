/**
 * Firebase認証ヘルパー関数
 *
 * firebase-auth-cloudflare-workersライブラリを使用して、
 * Firebase ID tokenの検証とユーザー情報の取得を行う。
 */
import { Auth, WorkersKVStoreSingle } from 'firebase-auth-cloudflare-workers';
import type { Env } from '../types';

/**
 * Firebase Authインスタンスを初期化
 *
 * プロジェクトIDとKVストレージを使用してAuthインスタンスを作成。
 * JWT公開鍵のキャッシュにCloudflare KVを使用する。
 *
 * @param env - Cloudflare Workers環境変数
 * @returns 初期化されたAuthインスタンス
 */
export function initializeFirebaseAuth(env: Env): Auth {
  // KVストレージを使用したキーストア初期化
  // JWT公開鍵をキャッシュして検証性能を向上させる
  const keyStore = WorkersKVStoreSingle.getOrInitialize(env.PUBLIC_JWK_CACHE_KEY, env.JWT_CACHE);

  // Firebase Authインスタンスを初期化
  // Singletonパターンで同一インスタンスを再利用
  return Auth.getOrInitialize(env.FIREBASE_PROJECT_ID, keyStore);
}

/**
 * Authorization headerからJWTトークンを抽出
 *
 * "Bearer <token>" 形式のヘッダーからJWT部分のみを取得する。
 * フロントエンドから送信されるFirebase ID tokenを想定。
 *
 * @param authHeader - Authorization header値
 * @returns JWTトークン文字列またはnull（無効な形式の場合）
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) {
    return null;
  }

  // "Bearer " プレフィックスをチェック
  const bearerPrefix = 'Bearer ';
  if (!authHeader.startsWith(bearerPrefix)) {
    return null;
  }

  // JWT部分のみを抽出
  const token = authHeader.slice(bearerPrefix.length).trim();
  return token || null;
}

/**
 * Firebase認証エラーかどうかを判定
 *
 * firebase-auth-cloudflare-workersライブラリから発生する
 * 認証関連エラーを識別する。
 *
 * @param error - 判定対象のエラー
 * @returns Firebase認証エラーの場合true
 */
export function isFirebaseAuthError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('token') ||
      message.includes('expired') ||
      message.includes('invalid') ||
      message.includes('firebase') ||
      message.includes('jwt') ||
      message.includes('auth')
    );
  }
  return false;
}

/**
 * 認証エラーメッセージを統一化
 *
 * 様々な認証エラーを分類し、適切なユーザー向けメッセージに変換。
 * セキュリティ上、詳細なエラー情報は返さない。
 *
 * @param error - 元のエラー
 * @returns 統一化されたエラーメッセージ
 */
export function normalizeAuthError(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('expired')) {
      return 'トークンの有効期限が切れています。再度ログインしてください。';
    }

    if (message.includes('invalid') || message.includes('malformed')) {
      return '無効なトークンです。';
    }

    if (message.includes('missing') || message.includes('required')) {
      return '認証トークンが必要です。';
    }
  }

  // デフォルトのエラーメッセージ
  return '認証に失敗しました。';
}
