/**
 * アプリケーション全体で使用される定数定義
 *
 * バックエンドとフロントエンドで共通利用される
 * 定数値をまとめて定義する。
 */

/**
 * APIバージョン情報
 */
export const API_VERSION = {
  /** 現在のAPIバージョン */
  CURRENT: 'v1',
  
  /** サポートされているAPIバージョン */
  SUPPORTED: ['v1'] as const,
} as const;

/**
 * ページネーション関連の定数
 */
export const PAGINATION = {
  /** デフォルトのページサイズ */
  DEFAULT_LIMIT: 20,
  
  /** 最大ページサイズ */
  MAX_LIMIT: 100,
  
  /** 最小ページサイズ */
  MIN_LIMIT: 1,
  
  /** デフォルトのページ番号（0ベース） */
  DEFAULT_PAGE: 0,
} as const;

/**
 * バリデーション関連の定数
 */
export const VALIDATION = {
  /** TODOタイトルの最大文字数 */
  TODO_TITLE_MAX_LENGTH: 200,
  
  /** TODO説明の最大文字数 */
  TODO_DESCRIPTION_MAX_LENGTH: 1000,
  
  /** ユーザー表示名の最大文字数 */
  USER_DISPLAY_NAME_MAX_LENGTH: 100,
  
  /** 検索クエリの最大文字数 */
  SEARCH_QUERY_MAX_LENGTH: 100,
} as const;

/**
 * ソート関連の定数
 */
export const SORT = {
  /** デフォルトのソートフィールド */
  DEFAULT_FIELD: 'createdAt',
  
  /** デフォルトのソート順 */
  DEFAULT_ORDER: 'desc',
  
  /** 利用可能なソートフィールド */
  AVAILABLE_FIELDS: ['createdAt', 'dueDate', 'title', 'completed'] as const,
  
  /** 利用可能なソート順 */
  AVAILABLE_ORDERS: ['asc', 'desc'] as const,
} as const;

/**
 * キャッシュ関連の定数
 */
export const CACHE = {
  /** JWT公開鍵のキャッシュ時間（秒） */
  JWT_CACHE_TTL: 3600, // 1時間
  
  /** APIレスポンスのキャッシュ時間（秒） */
  API_CACHE_TTL: 300, // 5分
} as const;

/**
 * 認証関連の定数
 */
export const AUTH = {
  /** JWTトークンの有効期限（秒） */
  JWT_EXPIRY: 3600, // 1時間
  
  /** 認証ヘッダーのプレフィックス */
  BEARER_PREFIX: 'Bearer ',
  
  /** Firebase Project IDの環境変数名 */
  FIREBASE_PROJECT_ID_ENV: 'FIREBASE_PROJECT_ID',
} as const;

/**
 * エラーメッセージの定数
 */
export const ERROR_MESSAGES = {
  /** 一般的なエラー */
  GENERIC: 'エラーが発生しました。しばらくしてから再度お試しください。',
  
  /** 認証エラー */
  AUTHENTICATION_REQUIRED: '認証が必要です。ログインしてください。',
  INVALID_TOKEN: '認証トークンが無効です。',
  TOKEN_EXPIRED: '認証トークンが期限切れです。再度ログインしてください。',
  
  /** 認可エラー */
  FORBIDDEN: 'この操作を実行する権限がありません。',
  
  /** バリデーションエラー */
  VALIDATION_FAILED: '入力データに問題があります。',
  REQUIRED_FIELD_MISSING: '必須フィールドが不足しています。',
  
  /** リソースエラー */
  NOT_FOUND: '指定されたリソースが見つかりません。',
  ALREADY_EXISTS: '指定されたリソースは既に存在します。',
  
  /** サーバーエラー */
  INTERNAL_SERVER_ERROR: 'サーバー内部でエラーが発生しました。',
  SERVICE_UNAVAILABLE: 'サービスが一時的に利用できません。',
} as const;

/**
 * 成功メッセージの定数
 */
export const SUCCESS_MESSAGES = {
  /** CRUD操作 */
  CREATED: '正常に作成されました。',
  UPDATED: '正常に更新されました。',
  DELETED: '正常に削除されました。',
  
  /** 認証操作 */
  LOGIN_SUCCESS: 'ログインしました。',
  LOGOUT_SUCCESS: 'ログアウトしました。',
  
  /** 一般操作 */
  OPERATION_SUCCESS: '操作が正常に完了しました。',
} as const;