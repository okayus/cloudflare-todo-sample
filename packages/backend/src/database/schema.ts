/**
 * データベーススキーマ定義
 *
 * Drizzle ORMを使用してCloudflare D1データベースのテーブル構造を定義。
 * 設計書（docs/system-design.md）に準拠したスキーマを実装している。
 */
import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

/**
 * USERSテーブル
 *
 * ユーザー情報を管理するテーブル。
 * Firebase UIDを主キーとして使用し、認証システムと連携する。
 */
export const users = sqliteTable(
  'users',
  {
    /** Firebase UID（主キー） */
    id: text('id').primaryKey(),

    /** メールアドレス（一意制約） */
    email: text('email').notNull().unique(),

    /** 表示名（Firebase DisplayName由来） */
    displayName: text('display_name'),

    /** 作成日時（自動設定） */
    createdAt: text('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),

    /** 更新日時（自動設定） */
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  table => ({
    /** メールアドレスの一意インデックス */
    emailIdx: index('idx_users_email').on(table.email),

    /** 作成日時のインデックス（日付範囲検索用） */
    createdAtIdx: index('idx_users_created_at').on(table.createdAt),
  })
);

/**
 * TODOSテーブル
 *
 * TODO項目を管理するテーブル。
 * ユーザーとの関連（外部キー）、論理削除、全文検索に対応。
 */
export const todos = sqliteTable(
  'todos',
  {
    /** UUID（主キー） */
    id: text('id').primaryKey(),

    /** ユーザーID（Firebase UID、外部キー） */
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    /** タスクタイトル */
    title: text('title').notNull(),

    /** タスク説明（任意） */
    description: text('description'),

    /** 完了状態（デフォルト: false） */
    completed: integer('completed', { mode: 'boolean' }).notNull().default(false),

    /** 期限日時 */
    dueDate: text('due_date').notNull(),

    /** 作成日時（自動設定） */
    createdAt: text('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),

    /** 更新日時（自動設定） */
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),

    /** 削除日時（論理削除用、NULL = 未削除） */
    deletedAt: text('deleted_at'),

    /** URL用スラッグ（一意制約） */
    slug: text('slug').notNull().unique(),
  },
  table => ({
    /** ユーザーIDのインデックス（ユーザー別TODO検索用） */
    userIdIdx: index('idx_todos_user_id').on(table.userId),

    /** 完了状態のインデックス（完了・未完了フィルタ用） */
    completedIdx: index('idx_todos_completed').on(table.completed),

    /** 期限日時のインデックス（期限順ソート用） */
    dueDateIdx: index('idx_todos_due_date').on(table.dueDate),

    /** 作成日時のインデックス（作成順ソート用） */
    createdAtIdx: index('idx_todos_created_at').on(table.createdAt),

    /** 論理削除のインデックス（削除済み除外用） */
    deletedAtIdx: index('idx_todos_deleted_at').on(table.deletedAt),

    /** スラッグの一意インデックス */
    slugIdx: index('idx_todos_slug').on(table.slug),

    /** ユーザーID + スラッグの複合インデックス（ユーザー別スラッグ検索用） */
    userSlugIdx: index('idx_todos_user_slug').on(table.userId, table.slug),
  })
);

/**
 * 型定義のエクスポート
 *
 * Drizzleから自動生成される型を使用してTypeScript型安全性を確保。
 * サービス層やエンドポイントで使用する。
 */
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Todo = typeof todos.$inferSelect;
export type NewTodo = typeof todos.$inferInsert;

/**
 * TODO検索用の条件型
 *
 * フィルタリング、ソート、ページネーション用のオプション型定義。
 */
export type TodoFilters = {
  /** 完了状態でフィルタ（true: 完了のみ、false: 未完了のみ、undefined: 全て） */
  completed?: boolean;

  /** 期限日でフィルタ（YYYY-MM-DD形式） */
  dueDateFrom?: string;
  dueDateTo?: string;

  /** タイトル・説明での部分一致検索 */
  search?: string;
};

/**
 * ソート用のオプション型
 */
export type TodoSortOptions = {
  /** ソートフィールド */
  field: 'createdAt' | 'dueDate' | 'title' | 'completed';

  /** ソート順（asc: 昇順、desc: 降順） */
  order: 'asc' | 'desc';
};

/**
 * ページネーション用のオプション型
 */
export type PaginationOptions = {
  /** ページ番号（0ベース） */
  page: number;

  /** 1ページあたりの件数 */
  limit: number;
};
