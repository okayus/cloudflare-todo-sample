/**
 * API関連の型定義
 *
 * RESTful APIのリクエスト・レスポンス形式の
 * 型定義とバリデーションスキーマ。
 * バックエンドとフロントエンドで共通利用される。
 */
import { z } from 'zod';

/**
 * 基本的なAPIレスポンス用のスキーマ
 *
 * 全てのAPIエンドポイントで使用される標準的なレスポンス形式。
 * 成功・失敗の判定とデータ・エラーメッセージを含む。
 */
export const ApiResponseSchema = z.object({
  /** 処理成功フラグ */
  success: z.boolean(),
  
  /** 成功時のメッセージ（任意） */
  message: z.string().optional(),
  
  /** 成功時のデータ（任意、型は動的） */
  data: z.unknown().optional(),
  
  /** 失敗時のエラーメッセージ（任意） */
  error: z.string().optional(),
});

/**
 * ページネーション情報付きレスポンス用のスキーマ
 *
 * 一覧系APIで使用される。
 * データと共にページネーション情報を含む。
 */
export const PaginatedResponseSchema = z.object({
  /** 処理成功フラグ */
  success: z.boolean(),
  
  /** データオブジェクト（配列と集計情報を含む） */
  data: z.object({
    /** データ配列 */
    items: z.array(z.unknown()),
    
    /** 全体の件数 */
    total: z.number().int().min(0),
    
    /** 現在のページ番号（0ベース） */
    page: z.number().int().min(0),
    
    /** 1ページあたりの件数 */
    limit: z.number().int().min(1),
    
    /** 全ページ数 */
    totalPages: z.number().int().min(0),
  }),
  
  /** ページネーション情報（互換性のため） */
  pagination: z.object({
    /** 全体の件数 */
    total: z.number().int().min(0),
    
    /** 現在のページ番号（0ベース） */
    page: z.number().int().min(0),
    
    /** 1ページあたりの件数 */
    limit: z.number().int().min(1),
    
    /** 全ページ数 */
    totalPages: z.number().int().min(0),
  }),
  
  /** 失敗時のエラーメッセージ（任意） */
  error: z.string().optional(),
});

/**
 * 認証関連のレスポンス用スキーマ
 */

/**
 * 認証検証レスポンススキーマ
 *
 * POST /api/auth/verify エンドポイントのレスポンス形式。
 * Firebase ID Token検証とユーザー同期の結果を返す。
 */
export const AuthVerifyResponseSchema = z.object({
  /** 処理成功フラグ */
  success: z.boolean(),
  
  /** 認証成功時のユーザー情報 */
  data: z.object({
    /** Firebase UID */
    userId: z.string(),
    
    /** メールアドレス */
    email: z.string().email(),
    
    /** 表示名（任意） */
    displayName: z.string().nullable().optional(),
    
    /** 新規作成フラグ */
    isNewUser: z.boolean(),
  }).optional(),
  
  /** 失敗時のエラーメッセージ（任意） */
  error: z.string().optional(),
});

/**
 * ユーザー情報取得レスポンススキーマ
 *
 * GET /api/auth/me エンドポイントのレスポンス形式。
 * 認証済みユーザーの詳細情報を返す。
 */
export const UserInfoResponseSchema = z.object({
  /** 処理成功フラグ */
  success: z.boolean(),
  
  /** ユーザー情報 */
  data: z.object({
    /** Firebase UID */
    id: z.string(),
    
    /** メールアドレス */
    email: z.string().email(),
    
    /** 表示名（任意） */
    displayName: z.string().nullable().optional(),
    
    /** 作成日時 */
    createdAt: z.string(),
    
    /** 更新日時 */
    updatedAt: z.string(),
  }).optional(),
  
  /** 失敗時のエラーメッセージ（任意） */
  error: z.string().optional(),
});

/**
 * エラーレスポンス用スキーマ
 *
 * HTTPエラーステータス（4xx, 5xx）で使用される
 * 統一されたエラーレスポンス形式。
 */
export const ErrorResponseSchema = z.object({
  /** 処理成功フラグ（常にfalse） */
  success: z.literal(false),
  
  /** エラーメッセージ */
  error: z.string(),
  
  /** エラー詳細情報（任意） */
  details: z.object({
    /** HTTPステータスコード */
    status: z.number().int().min(400).max(599),
    
    /** エラーコード（アプリケーション固有） */
    code: z.string().optional(),
    
    /** 開発者向けの詳細メッセージ */
    developerMessage: z.string().optional(),
    
    /** バリデーションエラーの場合のフィールド情報 */
    validationErrors: z.array(z.object({
      field: z.string(),
      message: z.string(),
    })).optional(),
  }).optional(),
});

/**
 * TypeScript型定義
 *
 * Zodスキーマから自動生成される型。
 * APIクライアントやレスポンスハンドラーで使用。
 */

/** 基本的なAPIレスポンスの型 */
export type ApiResponse<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
};

/** ページネーション情報付きレスポンスの型 */
export type PaginatedResponse<T = unknown> = {
  success: boolean;
  data: {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  error?: string;
};

/** 認証検証レスポンスの型 */
export type AuthVerifyResponse = z.infer<typeof AuthVerifyResponseSchema>;

/** ユーザー情報取得レスポンスの型 */
export type UserInfoResponse = z.infer<typeof UserInfoResponseSchema>;

/** エラーレスポンスの型 */
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

/**
 * HTTPステータスコード定数
 *
 * APIレスポンスで使用される標準的なHTTPステータスコード。
 * フロントエンドでのエラーハンドリングに使用。
 */
export const HttpStatus = {
  /** 成功 */
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  
  /** クライアントエラー */
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  
  /** サーバーエラー */
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * API エンドポイント定数
 *
 * フロントエンドでのAPI呼び出しに使用される
 * エンドポイントパスの定数定義。
 */
export const ApiEndpoints = {
  /** 認証関連 */
  AUTH: {
    VERIFY: '/api/auth/verify',
    USER_INFO: '/api/auth/me',
  },
  
  /** TODO関連 */
  TODOS: {
    LIST: '/api/todos',
    CREATE: '/api/todos',
    DETAIL: (slug: string) => `/api/todos/${slug}`,
    UPDATE: (slug: string) => `/api/todos/${slug}`,
    DELETE: (slug: string) => `/api/todos/${slug}`,
  },
} as const;