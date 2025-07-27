/**
 * Firebase認証関連の型定義とヘルパー関数
 *
 * firebase-auth-cloudflare-workersライブラリの型を拡張し、
 * アプリケーション固有の型安全性を確保する。
 */

// firebase-auth-cloudflare-workersライブラリの型をre-export
export type { FirebaseIdToken } from 'firebase-auth-cloudflare-workers';

/**
 * 認証に必要なFirebase ID Tokenの型ガード関数
 *
 * firebase-auth-cloudflare-workersのFirebaseIdTokenに加えて、
 * アプリケーションで必須とするフィールド（sub, email）の存在をチェック。
 *
 * @param token - 検証対象のFirebaseIdToken
 * @returns アプリケーションで有効なトークンかどうか
 */
export function isValidFirebaseIdToken(
  token: unknown
): token is import('firebase-auth-cloudflare-workers').FirebaseIdToken & {
  sub: string;
  email: string;
} {
  if (!token || typeof token !== 'object') {
    return false;
  }

  const candidate = token as Record<string, unknown>;

  // 必須フィールドの型チェック（アプリケーション要件）
  return (
    typeof candidate.sub === 'string' &&
    candidate.sub.length > 0 &&
    typeof candidate.email === 'string' &&
    candidate.email.length > 0 &&
    typeof candidate.iss === 'string' &&
    typeof candidate.aud === 'string' &&
    typeof candidate.iat === 'number' &&
    typeof candidate.exp === 'number'
  );
}
