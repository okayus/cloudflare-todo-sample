/**
 * セキュアロガーユーティリティ
 *
 * 開発環境でのデバッグログと機密情報のマスキングを管理する。
 * 本番環境では機密情報を含むログを出力しない。
 */

/**
 * 環境変数
 */
interface Environment {
  ENVIRONMENT?: string;
}

/**
 * ログデータの値として許可される型
 *
 * プリミティブ型と、それらを含むオブジェクト・配列の組み合わせ。
 * 循環参照や関数などの危険な値は除外される。
 */
type LogValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Date
  | LogValue[]
  | { [key: string]: LogValue };

/**
 * ログデータのオブジェクト型
 *
 * 機密情報のマスキングや型安全なログ出力で使用される。
 */
type LogData = Record<string, LogValue>;

/**
 * ユーザーIDをマスキングする
 *
 * Firebase UIDや内部ユーザーIDを安全にログ出力するためマスキングする。
 *
 * @param userId - マスキング対象のユーザーID
 * @returns マスキングされたユーザーID
 */
export function maskUserId(userId?: LogValue): string {
  if (!userId || typeof userId !== 'string') return '***null***';
  // 最初の4文字のみ表示、残りはマスキング
  return userId.length > 4 ? `${userId.substring(0, 4)}***` : '***short***';
}

/**
 * メールアドレスをマスキングする
 *
 * ユーザーのメールアドレスを安全にログ出力するためマスキングする。
 *
 * @param email - マスキング対象のメールアドレス
 * @returns マスキングされたメールアドレス
 */
export function maskEmail(email?: LogValue): string {
  if (!email || typeof email !== 'string') return '***null***';
  const atIndex = email.indexOf('@');
  if (atIndex === -1) return '***invalid***';

  const localPart = email.substring(0, atIndex);
  const domain = email.substring(atIndex + 1);

  // ローカル部の最初の2文字のみ表示
  const maskedLocal = localPart.length > 2 ? `${localPart.substring(0, 2)}***` : '***';
  // ドメインの最初の2文字のみ表示
  const maskedDomain = domain.length > 2 ? `${domain.substring(0, 2)}***.***` : '***.***';

  return `${maskedLocal}@${maskedDomain}`;
}

/**
 * 機密情報を含むオブジェクトをマスキングする
 *
 * ログ出力時に機密情報を自動的にマスキングする。
 *
 * @param data - マスキング対象のオブジェクト
 * @returns マスキング済みオブジェクト
 */
export function maskSensitiveData(data: LogData): LogData {
  const masked: LogData = {};

  for (const [key, value] of Object.entries(data)) {
    if (key.toLowerCase().includes('userid') || key.toLowerCase().includes('uid')) {
      masked[key] = maskUserId(value);
    } else if (key.toLowerCase().includes('email')) {
      masked[key] = maskEmail(value);
    } else if (key.toLowerCase().includes('password') || key.toLowerCase().includes('token')) {
      masked[key] = '***hidden***';
    } else {
      masked[key] = value;
    }
  }

  return masked;
}

/**
 * 開発環境限定のセキュアロガー
 *
 * 本番環境では何も出力せず、開発環境でのみ機密情報をマスキングしてログ出力する。
 */
export class SecureLogger {
  private isDevelopment: boolean;

  constructor(env: Environment) {
    this.isDevelopment = env.ENVIRONMENT === 'development';
  }

  /**
   * 開発環境限定のログ出力
   *
   * @param message - ログメッセージ
   * @param data - ログデータ（自動的にマスキングされる）
   */
  log(message: string, data?: LogData): void {
    if (!this.isDevelopment) return;

    if (data) {
      const maskedData = maskSensitiveData(data);
      console.log(message, maskedData);
    } else {
      console.log(message);
    }
  }

  /**
   * 開発環境限定のエラーログ出力
   *
   * エラー情報は本番環境でも必要なため、機密情報のみマスキング。
   *
   * @param message - エラーメッセージ
   * @param error - エラーオブジェクト
   * @param data - 追加データ（自動的にマスキングされる）
   */
  error(message: string, error?: Error | unknown, data?: LogData): void {
    const errorInfo = {
      message: error instanceof Error ? error.message : String(error),
      // スタックトレースは開発環境でのみ出力
      ...(this.isDevelopment && error instanceof Error && { stack: error.stack }),
      errorType: error?.constructor?.name,
    };

    if (data) {
      const maskedData = maskSensitiveData(data);
      console.error(message, { ...errorInfo, ...maskedData });
    } else {
      console.error(message, errorInfo);
    }
  }

  /**
   * 開発環境限定の情報ログ出力
   *
   * @param message - ログメッセージ
   * @param data - ログデータ（自動的にマスキングされる）
   */
  info(message: string, data?: LogData): void {
    if (!this.isDevelopment) return;

    if (data) {
      const maskedData = maskSensitiveData(data);
      console.info(message, maskedData);
    } else {
      console.info(message);
    }
  }
}

/**
 * グローバルロガーインスタンス作成ヘルパー
 *
 * @param env - 環境変数オブジェクト
 * @returns SecureLoggerインスタンス
 */
export function createSecureLogger(env: Environment): SecureLogger {
  return new SecureLogger(env);
}
