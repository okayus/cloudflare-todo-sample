/**
 * バリデーション関連ユーティリティ関数のテスト
 *
 * Zodスキーマを使用したデータ検証機能の
 * 動作を検証する。
 */
import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import {
  validateData,
  safeParse,
  formatValidationErrors,
  validatePartial,
  type ValidationError,
} from '../validation';

describe('バリデーション関連ユーティリティ関数', () => {
  // テスト用のZodスキーマ
  const testSchema = z.object({
    name: z.string().min(1, '名前は必須です'),
    age: z.number().min(0, '年齢は0以上である必要があります'),
    email: z.string().email('有効なメールアドレスを入力してください'),
  });

  const simpleSchema = z.string().min(3, '3文字以上である必要があります');

  describe('validateData', () => {
    it('有効なデータのバリデーション成功', () => {
      const validData = {
        name: 'John Doe',
        age: 25,
        email: 'john@example.com',
      };

      const result = validateData(testSchema, validData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
      expect(result.errors).toBeUndefined();
    });

    it('無効なデータのバリデーション失敗', () => {
      const invalidData = {
        name: '', // 空文字列（無効）
        age: -1, // 負の値（無効）
        email: 'invalid-email', // 無効なメール形式
      };

      const result = validateData(testSchema, invalidData);

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.errors).toBeDefined();
      expect(result.errors).toHaveLength(3);
    });

    it('Zodエラーの適切なフォーマット', () => {
      const invalidData = {
        name: '',
        age: 25,
        email: 'john@example.com',
      };

      const result = validateData(testSchema, invalidData);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      
      const nameError = result.errors?.find(err => err.field === 'name');
      expect(nameError).toBeDefined();
      expect(nameError?.message).toBe('名前は必須です');
    });

    it('非Zodエラーの処理', () => {
      // より安全な方法: 既存のスキーマをモック化
      const parseSpySchema = z.string();
      const parseSpy = vi.spyOn(parseSpySchema, 'parse');
      parseSpy.mockImplementation(() => {
        throw new Error('予期しないエラー');
      });

      const result = validateData(parseSpySchema, 'test data');

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors).toHaveLength(1);
      expect(result.errors?.[0].field).toBe('unknown');
      expect(result.errors?.[0].message).toBe('予期しないエラー');

      // スパイをリストア
      parseSpy.mockRestore();
    });
  });

  describe('safeParse', () => {
    it('有効なデータでデータを返すこと', () => {
      const result = safeParse(simpleSchema, 'valid string');

      expect(result).toBe('valid string');
    });

    it('無効なデータでnullを返すこと', () => {
      const result = safeParse(simpleSchema, 'ab'); // 3文字未満

      expect(result).toBeNull();
    });

    it('複雑なスキーマでの成功ケース', () => {
      const validData = {
        name: 'John Doe',
        age: 25,
        email: 'john@example.com',
      };

      const result = safeParse(testSchema, validData);

      expect(result).toEqual(validData);
    });

    it('複雑なスキーマでの失敗ケース', () => {
      const invalidData = {
        name: '',
        age: -1,
        email: 'invalid',
      };

      const result = safeParse(testSchema, invalidData);

      expect(result).toBeNull();
    });
  });

  describe('formatValidationErrors', () => {
    it('エラー配列の文字列フォーマット', () => {
      const errors: ValidationError[] = [
        { field: 'name', message: '名前は必須です' },
        { field: 'email', message: '有効なメールアドレスを入力してください' },
      ];

      const result = formatValidationErrors(errors);

      expect(result).toBe('name: 名前は必須です\nemail: 有効なメールアドレスを入力してください');
    });

    it('カスタム区切り文字での結合', () => {
      const errors: ValidationError[] = [
        { field: 'name', message: '名前は必須です' },
        { field: 'email', message: '有効なメールアドレスを入力してください' },
      ];

      const result = formatValidationErrors(errors, ' | ');

      expect(result).toBe('name: 名前は必須です | email: 有効なメールアドレスを入力してください');
    });

    it('\'unknown\'フィールドの特別処理', () => {
      const errors: ValidationError[] = [
        { field: 'unknown', message: '予期しないエラーが発生しました' },
        { field: 'name', message: '名前は必須です' },
      ];

      const result = formatValidationErrors(errors);

      expect(result).toBe('予期しないエラーが発生しました\nname: 名前は必須です');
    });

    it('空の配列の処理', () => {
      const result = formatValidationErrors([]);

      expect(result).toBe('');
    });
  });

  describe('validatePartial', () => {
    it('指定フィールドのみの部分バリデーション', () => {
      const partialData = {
        name: 'John Doe',
        extra: 'should be ignored', // 指定されていないフィールド
      };

      const result = validatePartial(testSchema, partialData, ['name']);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ name: 'John Doe' });
    });

    it('複数フィールドの部分バリデーション', () => {
      const partialData = {
        name: 'John Doe',
        age: 25,
        extra: 'should be ignored',
      };

      const result = validatePartial(testSchema, partialData, ['name', 'age']);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ name: 'John Doe', age: 25 });
    });

    it('非オブジェクトデータのエラー処理', () => {
      const result = validatePartial(testSchema, 'not an object', ['name']);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0].field).toBe('root');
      expect(result.errors?.[0].message).toBe('データはオブジェクトである必要があります');
    });

    it('nullデータのエラー処理', () => {
      const result = validatePartial(testSchema, null, ['name']);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0].field).toBe('root');
    });

    it('partialメソッドを持たないスキーマでの検証', () => {
      // partialメソッドを持たないスキーマを型安全に作成
      const baseSchema = z.object({
        value: z.string().min(3),
      });
      
      // vi.spyOnを使用してpartialメソッドを無効化
      const partialSpy = vi.spyOn(baseSchema, 'partial');
      // partialメソッドをundefinedに設定
      Object.defineProperty(baseSchema, 'partial', {
        value: undefined,
        configurable: true,
      });
      
      const testData = { value: 'test' };
      const result = validatePartial(baseSchema, testData, ['value']);

      // partialメソッドが存在しない場合は通常の検証が実行される
      expect(result.success).toBe(true);
      expect(result.data).toEqual(testData);

      // スパイをリストア
      partialSpy.mockRestore();
    });

    it('部分バリデーションでの無効データ', () => {
      const partialData = {
        name: '', // 無効（空文字列）
        age: 25,
      };

      const result = validatePartial(testSchema, partialData, ['name']);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      
      const nameError = result.errors?.find(err => err.field === 'name');
      expect(nameError).toBeDefined();
      expect(nameError?.message).toBe('名前は必須です');
    });
  });
});