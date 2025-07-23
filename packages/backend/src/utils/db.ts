/**
 * データベース共通ユーティリティ
 *
 * データベース操作に関する共通的な処理を提供する。
 * エラーハンドリング、ログ出力、ID生成などの機能を含む。
 */

/**
 * UUIDv4生成関数
 *
 * TodoのIDやその他の一意識別子の生成に使用。
 * crypto.randomUUID()がCloudflare Workers環境で利用可能。
 *
 * @returns 生成されたUUIDv4文字列
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * スラッグ生成関数
 *
 * タイトルからURL用のスラッグを生成する。
 * 日本語対応、特殊文字除去、重複チェック機能を含む。
 *
 * @param title - 元となるタイトル文字列
 * @param existingSlugs - 既存のスラッグ一覧（重複チェック用）
 * @returns 生成されたスラッグ
 */
export function generateSlug(title: string, existingSlugs: string[] = []): string {
  // 基本的なスラッグ生成
  let baseSlug = title
    .toLowerCase()
    .trim()
    // 日本語を英語に変換（簡易版）
    .replace(/[ひらがな・カタカナ・漢字]/g, 'task')
    // 英数字とハイフン以外を削除
    .replace(/[^a-z0-9-]/g, '-')
    // 連続するハイフンを一つに
    .replace(/-+/g, '-')
    // 前後のハイフンを削除
    .replace(/^-|-$/g, '');

  // 空文字列の場合はデフォルト値
  if (!baseSlug) {
    baseSlug = 'task';
  }

  // 長すぎる場合は切り詰め（最大50文字）
  if (baseSlug.length > 50) {
    baseSlug = baseSlug.substring(0, 50).replace(/-$/, '');
  }

  // 重複チェックと連番付与
  let slug = baseSlug;
  let counter = 1;

  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

/**
 * 日付文字列をISO形式に変換
 *
 * さまざまな形式の日付文字列をISO 8601形式に統一する。
 * データベース保存時の正規化に使用。
 *
 * @param dateString - 変換する日付文字列
 * @returns ISO 8601形式の日付文字列
 */
export function normalizeDate(dateString: string): string {
  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date format: ${dateString}`);
  }

  return date.toISOString();
}

/**
 * 現在時刻をISO形式で取得
 *
 * created_at、updated_atフィールドの設定に使用。
 * タイムゾーンに依存しないUTC時刻を返す。
 *
 * @returns 現在時刻のISO 8601形式文字列
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * データベースエラーのハンドリング
 *
 * SQLite/D1固有のエラーを解析し、適切なエラーメッセージを生成する。
 * 制約違反、データ型エラーなどを分類して処理。
 *
 * @param error - 発生したエラーオブジェクト
 * @returns ユーザー向けエラーメッセージ
 */
export function handleDatabaseError(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // 一意制約違反
    if (message.includes('unique') || message.includes('primary key')) {
      return 'このデータは既に存在します。異なる値を使用してください。';
    }

    // 外部キー制約違反
    if (message.includes('foreign key')) {
      return '関連するデータが見つかりません。';
    }

    // NOT NULL制約違反
    if (message.includes('not null')) {
      return '必須項目が入力されていません。';
    }

    // その他のデータベースエラー
    if (message.includes('database') || message.includes('sql')) {
      return 'データベース操作中にエラーが発生しました。';
    }
  }

  // 不明なエラー
  return '予期しないエラーが発生しました。';
}

/**
 * ページネーション用のOFFSET計算
 *
 * ページ番号と1ページあたりの件数からSQLのOFFSET値を計算。
 *
 * @param page - ページ番号（0ベース）
 * @param limit - 1ページあたりの件数
 * @returns SQLのOFFSET値
 */
export function calculateOffset(page: number, limit: number): number {
  return Math.max(0, page) * Math.max(1, limit);
}

/**
 * 検索文字列の正規化
 *
 * ユーザー入力の検索文字列を安全にSQL LIKE句で使用できる形式に変換。
 * SQLインジェクション対策とワイルドカード対応。
 *
 * @param searchTerm - 検索文字列
 * @returns 正規化された検索文字列
 */
export function normalizeSearchTerm(searchTerm: string): string {
  return (
    searchTerm
      .trim()
      // SQLの特殊文字をエスケープ
      .replace(/[%_]/g, '\\$&')
      // 前後にワイルドカードを追加
      .replace(/^|$/g, '%')
  );
}
