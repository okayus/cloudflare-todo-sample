/**
 * データベース接続設定
 *
 * Cloudflare D1データベースへの接続を管理する。
 * ローカル開発環境と本番環境で異なる接続方法を使い分ける。
 */
import { drizzle } from 'drizzle-orm/d1';
import { type AppContext } from '../types';
import * as schema from './schema';

/**
 * データベース接続インスタンスを取得
 *
 * Cloudflare Workers環境のContextからD1バインディングを取得し、
 * Drizzle ORMのインスタンスを生成する。
 *
 * @param context - Cloudflare Workers App Context（D1バインディング含む）
 * @returns Drizzle ORM database instance
 */
export function getDatabase(context: AppContext): ReturnType<typeof drizzle> {
  // wrangler.jsonc で設定したD1バインディング（DB）を取得
  const d1Database = context.env.DB;

  if (!d1Database) {
    throw new Error(
      'D1 database binding not found. ' + 'wrangler.jsonc の d1_databases 設定を確認してください。'
    );
  }

  // Drizzle ORMインスタンスを生成（スキーマ情報を含む）
  // スキーマを含めることで型安全性とリレーション機能が有効になる
  return drizzle(d1Database, { schema });
}

/**
 * データベース接続の型定義
 *
 * getDatabase関数の戻り値の型を定義。
 * サービス層やテストで使用する。
 */
export type Database = ReturnType<typeof getDatabase>;
