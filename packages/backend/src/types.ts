import { DateTime, Str } from 'chanfana';
import type { Context } from 'hono';
import { z } from 'zod';

/**
 * Cloudflare Workers環境の型定義
 *
 * D1データベースやKVストレージへのアクセスを含む。
 */
export interface Env {
  /** D1データベースバインディング */
  DB: D1Database;
  /** JWT公開鍵キャッシュ用KVネームスペース */
  JWT_CACHE: KVNamespace;
  /** Firebase Project ID */
  FIREBASE_PROJECT_ID: string;
  /** Firebase JWT公開鍵キャッシュキー */
  PUBLIC_JWK_CACHE_KEY: string;
}

/**
 * アプリケーションコンテキスト型
 *
 * Honoのコンテキストにカスタム環境変数を追加。
 * サービス層で使用される。
 */
export type AppContext = Context<{ Bindings: Env }>;

/**
 * レガシーTask型（削除予定）
 *
 * 旧仕様のAPI定義。新しいスキーマに置き換え予定。
 */
export const Task = z.object({
  name: Str({ example: 'lorem' }),
  slug: Str(),
  description: Str({ required: false }),
  completed: z.boolean().default(false),
  due_date: DateTime(),
});

/**
 * ユーザー関連のZodスキーマ
 */
export const UserSchema = z.object({
  id: z.string().min(1, 'ユーザーIDは必須です'),
  email: z.string().email('有効なメールアドレスを入力してください'),
  displayName: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const CreateUserSchema = UserSchema.omit({
  createdAt: true,
  updatedAt: true,
});

export const UpdateUserSchema = UserSchema.pick({
  displayName: true,
}).partial();

/**
 * TODO関連のZodスキーマ
 */
export const TodoSchema = z.object({
  id: z.string().min(1, 'TODO IDは必須です'),
  userId: z.string().min(1, 'ユーザーIDは必須です'),
  title: z
    .string()
    .min(1, 'タイトルは必須です')
    .max(200, 'タイトルは200文字以内で入力してください'),
  description: z.string().max(1000, '説明は1000文字以内で入力してください').optional(),
  completed: z.boolean().default(false),
  dueDate: z.string().refine(date => {
    return !isNaN(Date.parse(date));
  }, '有効な日付形式で入力してください'),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  deletedAt: z.string().nullable().optional(),
  slug: z.string().min(1, 'スラッグは必須です'),
});

export const CreateTodoSchema = z.object({
  title: z
    .string()
    .min(1, 'タイトルは必須です')
    .max(200, 'タイトルは200文字以内で入力してください'),
  description: z.string().max(1000, '説明は1000文字以内で入力してください').optional(),
  completed: z.boolean().default(false).optional(),
  dueDate: z.string().refine(date => {
    return !isNaN(Date.parse(date));
  }, '有効な日付形式で入力してください'),
});

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
 * フィルタ・ソート・ページネーション用スキーマ
 */
export const TodoFiltersSchema = z.object({
  completed: z.boolean().optional(),
  dueDateFrom: z.string().optional(),
  dueDateTo: z.string().optional(),
  search: z.string().optional(),
});

export const TodoSortSchema = z.object({
  field: z.enum(['createdAt', 'dueDate', 'title', 'completed']).optional().default('createdAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const PaginationSchema = z.object({
  page: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(100).default(20),
});

/**
 * APIレスポンス用スキーマ
 */
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.any().optional(),
  error: z.string().optional(),
});

export const TodoListResponseSchema = z.object({
  todos: z.array(TodoSchema),
  total: z.number().int().min(0),
  page: z.number().int().min(0),
  limit: z.number().int().min(1),
  totalPages: z.number().int().min(0),
});

/**
 * 型エクスポート
 */
export type User = z.infer<typeof UserSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
export type Todo = z.infer<typeof TodoSchema>;
export type CreateTodo = z.infer<typeof CreateTodoSchema>;
export type UpdateTodo = z.infer<typeof UpdateTodoSchema>;
export type TodoFilters = z.infer<typeof TodoFiltersSchema>;
export type TodoSort = z.infer<typeof TodoSortSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type ApiResponse = z.infer<typeof ApiResponseSchema>;
export type TodoListResponse = z.infer<typeof TodoListResponseSchema>;
