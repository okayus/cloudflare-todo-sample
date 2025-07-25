/**
 * バリデーション関連のユーティリティ関数
 *
 * Zodスキーマを使用したデータ検証の
 * 共通ユーティリティ関数。
 * バックエンドとフロントエンドで共通利用される。
 */
import { ZodSchema, ZodError } from 'zod';

/**
 * バリデーション結果の型定義
 *
 * 成功時はデータを、失敗時はエラー情報を返す。
 */
export interface ValidationResult<T> {
  /** バリデーション成功フラグ */
  success: boolean;
  
  /** バリデーション成功時のデータ */
  data?: T;
  
  /** バリデーション失敗時のエラー情報 */
  errors?: ValidationError[];
}

/**
 * バリデーションエラーの詳細情報
 */
export interface ValidationError {
  /** エラーが発生したフィールドのパス */
  field: string;
  
  /** エラーメッセージ */
  message: string;
  
  /** 入力された値 */
  receivedValue?: unknown;
}

/**
 * Zodスキーマを使用したデータバリデーション
 *
 * スキーマに基づいてデータを検証し、
 * 統一されたフォーマットで結果を返す。
 *
 * @param schema - 検証に使用するZodスキーマ
 * @param data - 検証対象のデータ
 * @returns バリデーション結果
 */
export function validateData<T>(
  schema: ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const validatedData = schema.parse(data);
    return {
      success: true,
      data: validatedData,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      const errors: ValidationError[] = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        receivedValue: 'input' in err ? err.input : undefined,
      }));
      
      return {
        success: false,
        errors,
      };
    }
    
    // Zod以外のエラーの場合
    return {
      success: false,
      errors: [{
        field: 'unknown',
        message: error instanceof Error ? error.message : 'バリデーションエラーが発生しました',
      }],
    };
  }
}

/**
 * 安全なパース関数
 *
 * Zodスキーマを使用してデータを安全にパースする。
 * エラーが発生した場合はnullを返す。
 *
 * @param schema - 検証に使用するZodスキーマ
 * @param data - パース対象のデータ
 * @returns パース成功時はデータ、失敗時はnull
 */
export function safeParse<T>(
  schema: ZodSchema<T>,
  data: unknown
): T | null {
  const result = schema.safeParse(data);
  return result.success ? result.data : null;
}

/**
 * バリデーションエラーメッセージのフォーマット
 *
 * バリデーションエラーの配列を
 * ユーザー向けのメッセージ文字列に変換する。
 *
 * @param errors - バリデーションエラーの配列
 * @param separator - エラーメッセージの区切り文字
 * @returns フォーマットされたエラーメッセージ
 */
export function formatValidationErrors(
  errors: ValidationError[],
  separator: string = '\n'
): string {
  return errors
    .map(error => {
      if (error.field === 'unknown') {
        return error.message;
      }
      return `${error.field}: ${error.message}`;
    })
    .join(separator);
}

/**
 * 部分的バリデーション
 *
 * オブジェクトの一部のフィールドのみを検証する。
 * PATCH操作などで使用される。
 *
 * @param schema - 検証に使用するZodスキーマ
 * @param data - 検証対象のデータ
 * @param fields - 検証するフィールド名の配列
 * @returns バリデーション結果
 */
export function validatePartial<T extends Record<string, unknown>>(
  schema: ZodSchema<T>,
  data: unknown,
  fields: (keyof T)[]
): ValidationResult<Partial<T>> {
  if (typeof data !== 'object' || data === null) {
    return {
      success: false,
      errors: [{
        field: 'root',
        message: 'データはオブジェクトである必要があります',
      }],
    };
  }
  
  const partialData: Record<string, unknown> = {};
  const dataObj = data as Record<string, unknown>;
  
  // 指定されたフィールドのみを抽出
  for (const field of fields) {
    const fieldKey = field as string;
    if (fieldKey in dataObj) {
      partialData[fieldKey] = dataObj[fieldKey];
    }
  }
  
  // 部分的スキーマを作成して検証
  // ZodObjectの場合のみpartial()を使用
  if ('partial' in schema && typeof schema.partial === 'function') {
    const partialSchema = (schema as any).partial();
    return validateData(partialSchema, partialData);
  }
  
  // ZodObjectでない場合は通常の検証
  return validateData(schema, partialData);
}