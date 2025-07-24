/**
 * ユーザー関連の型定義
 *
 * Firebase AuthenticationとD1データベースで使用される
 * ユーザー情報の型定義とバリデーションスキーマ。
 * バックエンドとフロントエンドで共通利用される。
 */
import { z } from 'zod';

/**
 * ユーザー情報のZodスキーマ
 *
 * データベースから取得されるユーザー情報の完全なスキーマ。
 * Firebase UIDを主キーとして使用する。
 */
export const UserSchema = z.object({
  /** Firebase UID（主キー） */
  id: z.string().min(1, 'ユーザーIDは必須です'),
  
  /** メールアドレス（一意制約） */
  email: z.string().email('有効なメールアドレスを入力してください'),
  
  /** 表示名（Firebase DisplayName由来、任意） */
  displayName: z.string().nullable().optional(),
  
  /** 作成日時（ISO 8601形式） */
  createdAt: z.string().optional(),
  
  /** 更新日時（ISO 8601形式） */
  updatedAt: z.string().optional(),
});

/**
 * ユーザー作成用のスキーマ
 *
 * 新規ユーザー登録時に使用される。
 * createdAt, updatedAtは自動設定されるため除外。
 */
export const CreateUserSchema = UserSchema.omit({
  createdAt: true,
  updatedAt: true,
});

/**
 * ユーザー更新用のスキーマ
 *
 * 現在は表示名のみ更新可能。
 * メールアドレスの変更はFirebase側で管理。
 */
export const UpdateUserSchema = UserSchema.pick({
  displayName: true,
}).partial();

/**
 * TypeScript型定義
 *
 * Zodスキーマから自動生成される型。
 * フロントエンドのコンポーネントやAPIクライアントで使用。
 */

/** ユーザー情報の完全な型 */
export type User = z.infer<typeof UserSchema>;

/** ユーザー作成用の型 */
export type CreateUser = z.infer<typeof CreateUserSchema>;

/** ユーザー更新用の型 */
export type UpdateUser = z.infer<typeof UpdateUserSchema>;

/**
 * 認証済みユーザー情報の型
 *
 * Firebase AuthenticationのJWTトークンから取得される
 * 最小限のユーザー情報。ミドルウェアで使用される。
 */
export interface AuthenticatedUser {
  /** Firebase UID */
  userId: string;
  
  /** メールアドレス */
  userEmail: string;
  
  /** Firebase ID tokenの生のクレーム情報 */
  firebaseToken: unknown;
}