/**
 * Drizzle ORM設定ファイル
 * 
 * Cloudflare D1データベースのマイグレーション管理を行う設定。
 * ローカル開発ではSQLiteファイル、本番環境ではCloudflare D1を使用する。
 */
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  /** スキーマファイルの場所を指定 */
  schema: './src/database/schema.ts',
  
  /** マイグレーションファイルの出力先ディレクトリ */
  out: './migrations',
  
  /** 使用するデータベースの種類（D1はSQLiteベース） */
  dialect: 'sqlite',
  
  /** データベース接続設定 */
  dbCredentials: {
    // ローカル開発用のSQLiteファイルパス
    // wrangler devコマンドで自動作成される.wranglerディレクトリ内のローカルD1を使用
    url: './.wrangler/state/v3/d1/miniflare-D1DatabaseObject/07aab756fe4a40429e12177b680ed67d.sqlite',
  },
  
  /** 詳細なログ出力を有効化（マイグレーション時のデバッグ用） */
  verbose: true,
  
  /** 厳密なモードを有効化（型安全性向上） */
  strict: true,
});