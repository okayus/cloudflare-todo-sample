/**
 * TODO関連の型定義
 *
 * TODOアプリケーションのタスク管理に関する
 * 型定義とバリデーションスキーマ。
 * CRUD操作、フィルタリング、ソート、ページネーションに対応。
 */
import { z } from 'zod';

/**
 * TODO項目のZodスキーマ
 *
 * データベースから取得されるTODO情報の完全なスキーマ。
 * ユーザー認証と連携し、論理削除に対応。
 */
export const TodoSchema = z.object({
  /** UUID（主キー） */
  id: z.string().min(1, 'TODO IDは必須です'),
  
  /** ユーザーID（Firebase UID、外部キー） */
  userId: z.string().min(1, 'ユーザーIDは必須です'),
  
  /** タスクタイトル */
  title: z
    .string()
    .min(1, 'タイトルは必須です')
    .max(200, 'タイトルは200文字以内で入力してください'),
  
  /** タスク説明（任意） */
  description: z
    .string()
    .max(1000, '説明は1000文字以内で入力してください')
    .nullable()
    .optional(),
  
  /** 完了状態（デフォルト: false） */
  completed: z.boolean().default(false),
  
  /** 期限日時（ISO 8601形式） */
  dueDate: z.string().refine(date => {
    return !isNaN(Date.parse(date));
  }, '有効な日付形式で入力してください'),
  
  /** 作成日時（ISO 8601形式） */
  createdAt: z.string().optional(),
  
  /** 更新日時（ISO 8601形式） */
  updatedAt: z.string().optional(),
  
  /** 削除日時（論理削除用、NULL = 未削除） */
  deletedAt: z.string().nullable().optional(),
  
  /** URL用スラッグ（一意制約） */
  slug: z.string().min(1, 'スラッグは必須です'),
});

/**
 * TODO作成用のスキーマ
 *
 * 新規TODO作成時に使用される。
 * id, userId, slug, createdAt, updatedAt, deletedAtは
 * サーバー側で自動生成される。
 */
export const CreateTodoSchema = z.object({
  /** タスクタイトル */
  title: z
    .string()
    .min(1, 'タイトルは必須です')
    .max(200, 'タイトルは200文字以内で入力してください'),
  
  /** タスク説明（任意） */
  description: z
    .string()
    .max(1000, '説明は1000文字以内で入力してください')
    .nullable()
    .optional(),
  
  /** 完了状態（デフォルト: false） */
  completed: z.boolean().default(false).optional(),
  
  /** 期限日時（ISO 8601形式） */
  dueDate: z.string().refine(date => {
    return !isNaN(Date.parse(date));
  }, '有効な日付形式で入力してください'),
});

/**
 * TODO更新用のスキーマ
 *
 * PATCH操作で使用される。
 * 全フィールドが任意だが、最低1つのフィールドは必須。
 */
export const UpdateTodoSchema = TodoSchema.pick({
  title: true,
  description: true,
  dueDate: true,
  completed: true,
})
  .partial()
  .refine(data => {
    return Object.keys(data).length > 0;
  }, '更新するフィールドを少なくとも1つ指定してください');

/**
 * TODO検索フィルター用のスキーマ
 *
 * 一覧取得時のフィルタリング条件。
 * 完了状態、期限日範囲、全文検索に対応。
 */
export const TodoFiltersSchema = z.object({
  /** 完了状態でフィルタ（true: 完了のみ、false: 未完了のみ、undefined: 全て） */
  completed: z.boolean().optional(),
  
  /** 期限日の開始日（YYYY-MM-DD形式） */
  dueDateFrom: z.string().optional(),
  
  /** 期限日の終了日（YYYY-MM-DD形式） */
  dueDateTo: z.string().optional(),
  
  /** タイトル・説明での部分一致検索 */
  search: z.string().optional(),
});

/**
 * TODOソート用のスキーマ
 *
 * 一覧取得時のソート条件。
 * 複数フィールドでのソートに対応。
 */
export const TodoSortSchema = z.object({
  /** ソートフィールド */
  field: z.enum(['createdAt', 'dueDate', 'title', 'completed']).optional().default('createdAt'),
  
  /** ソート順（asc: 昇順、desc: 降順） */
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * ページネーション用のスキーマ
 *
 * 一覧取得時のページング制御。
 * 大量データの効率的な取得に対応。
 */
export const PaginationSchema = z.object({
  /** ページ番号（0ベース） */
  page: z.number().int().min(0).default(0),
  
  /** 1ページあたりの件数（最大100件） */
  limit: z.number().int().min(1).max(100).default(20),
});

/**
 * TODO一覧レスポンス用のスキーマ
 *
 * ページネーション情報を含むTODO一覧のレスポンス形式。
 */
export const TodoListResponseSchema = z.object({
  /** TODO項目の配列 */
  todos: z.array(TodoSchema),
  
  /** 全体の件数 */
  total: z.number().int().min(0),
  
  /** 現在のページ番号 */
  page: z.number().int().min(0),
  
  /** 1ページあたりの件数 */
  limit: z.number().int().min(1),
  
  /** 全ページ数 */
  totalPages: z.number().int().min(0),
});

/**
 * TypeScript型定義
 *
 * Zodスキーマから自動生成される型。
 * フロントエンドのコンポーネントやAPIクライアントで使用。
 */

/** TODO項目の完全な型 */
export type Todo = z.infer<typeof TodoSchema>;

/** TODO作成用の型 */
export type CreateTodo = z.infer<typeof CreateTodoSchema>;

/** TODO更新用の型 */
export type UpdateTodo = z.infer<typeof UpdateTodoSchema>;

/** TODOフィルター条件の型 */
export type TodoFilters = z.infer<typeof TodoFiltersSchema>;

/** TODOソート条件の型 */
export type TodoSort = z.infer<typeof TodoSortSchema>;

/** ページネーション設定の型 */
export type Pagination = z.infer<typeof PaginationSchema>;

/** TODO一覧レスポンスの型 */
export type TodoListResponse = z.infer<typeof TodoListResponseSchema>;

/**
 * TODO検索用の条件型（バックエンド用）
 *
 * サービス層で使用される詳細なフィルタリングオプション。
 * データベースクエリの構築に使用される。
 */
export interface TodoSearchOptions {
  /** フィルター条件 */
  filters: TodoFilters;
  
  /** ソート条件 */
  sort: TodoSort;
  
  /** ページネーション設定 */
  pagination: Pagination;
  
  /** 論理削除されたTODOを含むかどうか */
  includeDeleted?: boolean;
}