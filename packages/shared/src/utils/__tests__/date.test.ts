/**
 * 日付・時刻関連ユーティリティ関数のテスト
 *
 * 日付操作、フォーマット、相対時間計算などの
 * 共通関数の動作を検証する。
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getCurrentISOString,
  isValidDateString,
  parseISOString,
  formatDateString,
  getRelativeTimeString,
  getDueDateInfo,
  validateDateRange,
} from '../date';

describe('日付・時刻ユーティリティ関数', () => {
  // 各テスト前に時刻をリセット
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getCurrentISOString', () => {
    it('ISO 8601形式の文字列を返すこと', () => {
      const fixedDate = new Date('2024-07-24T12:00:00.000Z');
      vi.setSystemTime(fixedDate);

      const result = getCurrentISOString();

      expect(result).toBe('2024-07-24T12:00:00.000Z');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('現在時刻に近い値を返すこと', () => {
      vi.useRealTimers(); // 実際の時刻を使用
      const before = Date.now();
      const result = getCurrentISOString();
      const after = Date.now();

      const resultTime = new Date(result).getTime();
      expect(resultTime).toBeGreaterThanOrEqual(before);
      expect(resultTime).toBeLessThanOrEqual(after);
    });
  });

  describe('isValidDateString', () => {
    it('有効な日付文字列でtrueを返すこと', () => {
      expect(isValidDateString('2024-07-24')).toBe(true);
      expect(isValidDateString('2024-12-31')).toBe(true);
      expect(isValidDateString('2024-01-01')).toBe(true);
    });

    it('無効な日付文字列でfalseを返すこと', () => {
      expect(isValidDateString('2024-13-01')).toBe(false); // 13月
      expect(isValidDateString('2024-02-30')).toBe(false); // 2月30日
      expect(isValidDateString('invalid-date')).toBe(false);
      expect(isValidDateString('2024/07/24')).toBe(false); // スラッシュ形式
    });

    it('空文字列でfalseを返すこと', () => {
      expect(isValidDateString('')).toBe(false);
    });
  });

  describe('parseISOString', () => {
    it('有効なISO文字列をDateオブジェクトに変換', () => {
      const isoString = '2024-07-24T12:00:00.000Z';
      const result = parseISOString(isoString);

      expect(result).toBeInstanceOf(Date);
      expect(result?.toISOString()).toBe(isoString);
    });

    it('無効な文字列でnullを返すこと', () => {
      expect(parseISOString('invalid-date')).toBeNull();
      expect(parseISOString('')).toBeNull();
      expect(parseISOString('2024-13-01')).toBeNull();
    });
  });

  describe('formatDateString', () => {
    it('デフォルト設定で日本語形式にフォーマット', () => {
      const result = formatDateString('2024-07-24T12:00:00.000Z');
      
      // 日本語ロケールでの日付フォーマットを検証
      expect(result).toContain('2024');
      expect(result).toContain('24');
      // "年"、"月"、"日"のいずれかが含まれることを確認
      expect(result).toMatch(/年|月|日/);
    });

    it('時刻付きフォーマット', () => {
      const result = formatDateString('2024-07-24T12:30:00.000Z', {
        includeTime: true,
      });

      expect(result).toContain('2024');
      expect(result).toContain('24');
      // 時刻が含まれることを確認
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });

    it('無効な日付で「無効な日付」を返すこと', () => {
      const result = formatDateString('invalid-date');
      expect(result).toBe('無効な日付');
    });
  });

  describe('getRelativeTimeString', () => {
    it('「たった今」を返すこと', () => {
      const now = new Date('2024-07-24T12:00:00.000Z');
      vi.setSystemTime(now);

      const result = getRelativeTimeString('2024-07-24T12:00:00.000Z');
      expect(result).toBe('たった今');
    });

    it('「〜分前」を返すこと', () => {
      const now = new Date('2024-07-24T12:05:00.000Z');
      vi.setSystemTime(now);

      const result = getRelativeTimeString('2024-07-24T12:00:00.000Z');
      expect(result).toBe('5分前');
    });

    it('「〜時間前」を返すこと', () => {
      const now = new Date('2024-07-24T14:00:00.000Z');
      vi.setSystemTime(now);

      const result = getRelativeTimeString('2024-07-24T12:00:00.000Z');
      expect(result).toBe('2時間前');
    });

    it('「〜日前」を返すこと', () => {
      const now = new Date('2024-07-26T12:00:00.000Z');
      vi.setSystemTime(now);

      const result = getRelativeTimeString('2024-07-24T12:00:00.000Z');
      expect(result).toBe('2日前');
    });

    it('無効な日付で「無効な日付」を返すこと', () => {
      const result = getRelativeTimeString('invalid-date');
      expect(result).toBe('無効な日付');
    });
  });

  describe('getDueDateInfo', () => {
    beforeEach(() => {
      const now = new Date('2024-07-24T12:00:00.000Z');
      vi.setSystemTime(now);
    });

    it('期限切れの判定', () => {
      const result = getDueDateInfo('2024-07-22T12:00:00.000Z'); // 2日前

      expect(result.isOverdue).toBe(true);
      expect(result.daysUntilDue).toBe(-2);
      expect(result.statusText).toBe('2日遅れ');
    });

    it('緊急度の判定', () => {
      const result = getDueDateInfo('2024-07-26T12:00:00.000Z'); // 2日後

      expect(result.isUrgent).toBe(true);
      expect(result.isOverdue).toBe(false);
      expect(result.daysUntilDue).toBe(2);
      expect(result.statusText).toBe('あと2日');
    });

    it('今日が期限の場合', () => {
      // より厳密な今日の時刻設定
      const result = getDueDateInfo('2024-07-24T12:00:00.000Z'); // 同じ時刻

      expect(result.daysUntilDue).toBe(0);
      expect(result.statusText).toBe('今日が期限');
    });

    it('明日が期限の場合', () => {
      const result = getDueDateInfo('2024-07-25T12:00:00.000Z'); // 明日

      expect(result.daysUntilDue).toBe(1);
      expect(result.statusText).toBe('明日が期限');
    });

    it('無効な日付の処理', () => {
      const result = getDueDateInfo('invalid-date');

      expect(result.daysUntilDue).toBe(0);
      expect(result.isOverdue).toBe(false);
      expect(result.isUrgent).toBe(false);
      expect(result.statusText).toBe('無効な期限日');
    });
  });

  describe('validateDateRange', () => {
    it('有効な日付範囲の検証', () => {
      const result = validateDateRange(
        '2024-07-20T00:00:00.000Z',
        '2024-07-25T00:00:00.000Z'
      );

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('開始日>終了日の検証', () => {
      const result = validateDateRange(
        '2024-07-25T00:00:00.000Z',
        '2024-07-20T00:00:00.000Z'
      );

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('開始日は終了日より前である必要があります');
    });

    it('無効な開始日の検証', () => {
      const result = validateDateRange(
        'invalid-date',
        '2024-07-25T00:00:00.000Z'
      );

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('開始日が無効です');
    });

    it('無効な終了日の検証', () => {
      const result = validateDateRange(
        '2024-07-20T00:00:00.000Z',
        'invalid-date'
      );

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('終了日が無効です');
    });
  });
});