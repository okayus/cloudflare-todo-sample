/**
 * 共通パッケージのメインエクスポートファイル
 *
 * バックエンドとフロントエンドで共通利用される
 * 型定義、ユーティリティ関数、定数をエクスポートする。
 */

// 型定義のエクスポート
export * from './types/user';
export * from './types/todo';
export * from './types/api';

// ユーティリティ関数のエクスポート
export * from './utils/validation';
export * from './utils/date';

// 定数のエクスポート
export * from './constants/index';

// バージョン情報
export const SHARED_PACKAGE_VERSION = '0.1.0';