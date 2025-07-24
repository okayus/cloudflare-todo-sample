/**
 * 日付・時刻関連のユーティリティ関数
 *
 * ISO 8601形式の日付文字列の操作や
 * フォーマット変換を行う共通関数。
 * バックエンドとフロントエンドで共通利用される。
 */

/**
 * 現在の日時をISO 8601形式で取得
 *
 * データベースの作成・更新日時として使用される
 * 標準的な日時形式を返す。
 *
 * @returns ISO 8601形式の現在日時文字列
 */
export function getCurrentISOString(): string {
  return new Date().toISOString();
}

/**
 * 日付文字列の妥当性チェック
 *
 * 文字列がISO 8601形式の有効な日付かどうかを判定する。
 * バリデーション関数で使用される。
 *
 * @param dateString - チェック対象の日付文字列
 * @returns 有効な日付の場合true
 */
export function isValidDateString(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && dateString === date.toISOString().split('T')[0];
}

/**
 * ISO 8601日時文字列をDate オブジェクトに変換
 *
 * データベースから取得した日時文字列を
 * JavaScriptのDateオブジェクトに安全に変換する。
 *
 * @param isoString - ISO 8601形式の日時文字列
 * @returns Dateオブジェクト、無効な場合はnull
 */
export function parseISOString(isoString: string): Date | null {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      return null;
    }
    return date;
  } catch {
    return null;
  }
}

/**
 * 日付文字列を人間が読みやすい形式にフォーマット
 *
 * ISO 8601形式の日付をユーザー向けの
 * 日本語形式でフォーマットする。
 *
 * @param dateString - ISO 8601形式の日付文字列
 * @param options - フォーマットオプション
 * @returns フォーマットされた日付文字列
 */
export function formatDateString(
  dateString: string,
  options: {
    includeTime?: boolean;
    locale?: string;
  } = {}
): string {
  const { 
    includeTime = false, 
    locale = 'ja-JP' 
  } = options;
  
  const date = parseISOString(dateString);
  if (!date) {
    return '無効な日付';
  }
  
  const formatOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  
  if (includeTime) {
    formatOptions.hour = '2-digit';
    formatOptions.minute = '2-digit';
  }
  
  return new Intl.DateTimeFormat(locale, formatOptions).format(date);
}

/**
 * 相対時間の表示
 *
 * 指定された日時から現在までの経過時間を
 * 「〜前」「〜後」の形式で表示する。
 *
 * @param dateString - ISO 8601形式の日時文字列
 * @returns 相対時間の文字列
 */
export function getRelativeTimeString(dateString: string): string {
  const date = parseISOString(dateString);
  if (!date) {
    return '無効な日付';
  }
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMinutes < 1) {
    return 'たった今';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}分前`;
  } else if (diffHours < 24) {
    return `${diffHours}時間前`;
  } else if (diffDays < 7) {
    return `${diffDays}日前`;
  } else {
    return formatDateString(dateString);
  }
}

/**
 * 期限までの残り時間チェック
 *
 * 指定された期限日時が現在から何日後かを計算し、
 * 期限切れや緊急度を判定する。
 *
 * @param dueDateString - ISO 8601形式の期限日時文字列
 * @returns 期限情報オブジェクト
 */
export function getDueDateInfo(dueDateString: string): {
  daysUntilDue: number;
  isOverdue: boolean;
  isUrgent: boolean;
  statusText: string;
} {
  const dueDate = parseISOString(dueDateString);
  if (!dueDate) {
    return {
      daysUntilDue: 0,
      isOverdue: false,
      isUrgent: false,
      statusText: '無効な期限日',
    };
  }
  
  const now = new Date();
  const diffMs = dueDate.getTime() - now.getTime();
  const daysUntilDue = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  const isOverdue = daysUntilDue < 0;
  const isUrgent = daysUntilDue <= 3 && daysUntilDue >= 0;
  
  let statusText: string;
  if (isOverdue) {
    statusText = `${Math.abs(daysUntilDue)}日遅れ`;
  } else if (daysUntilDue === 0) {
    statusText = '今日が期限';
  } else if (daysUntilDue === 1) {
    statusText = '明日が期限';
  } else {
    statusText = `あと${daysUntilDue}日`;
  }
  
  return {
    daysUntilDue,
    isOverdue,
    isUrgent,
    statusText,
  };
}

/**
 * 日付範囲の妥当性チェック
 *
 * 開始日と終了日の妥当性を検証する。
 * フィルタリング機能で使用される。
 *
 * @param startDate - 開始日（ISO 8601形式）
 * @param endDate - 終了日（ISO 8601形式）
 * @returns 妥当性チェック結果
 */
export function validateDateRange(
  startDate: string,
  endDate: string
): {
  isValid: boolean;
  error?: string;
} {
  const start = parseISOString(startDate);
  const end = parseISOString(endDate);
  
  if (!start) {
    return { isValid: false, error: '開始日が無効です' };
  }
  
  if (!end) {
    return { isValid: false, error: '終了日が無効です' };
  }
  
  if (start.getTime() > end.getTime()) {
    return { isValid: false, error: '開始日は終了日より前である必要があります' };
  }
  
  return { isValid: true };
}