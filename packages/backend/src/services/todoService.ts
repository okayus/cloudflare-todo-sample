/**
 * TODOサービス
 *
 * TODO関連のビジネスロジックを管理する。
 * CRUD操作、フィルタリング、ソート、検索機能を提供。
 */
import { eq, and, desc, asc, isNull, isNotNull, like, or, count } from 'drizzle-orm';
import { type Database } from '../database/connection';
import {
  todos,
  type Todo,
  type NewTodo,
  type TodoFilters,
  type TodoSortOptions,
  type PaginationOptions,
} from '../database/schema';
import {
  generateId,
  generateSlug,
  handleDatabaseError,
  getCurrentTimestamp,
  calculateOffset,
  normalizeSearchTerm,
  normalizeDate,
} from '../utils/db';
import { createSecureLogger } from '../utils/logger';

/**
 * TODO一覧レスポンス型
 *
 * ページネーション情報を含むレスポンス形式。
 */
export type TodoListResponse = {
  /** TODO一覧 */
  todos: Todo[];
  /** 総件数 */
  total: number;
  /** 現在のページ */
  page: number;
  /** 1ページあたりの件数 */
  limit: number;
  /** 総ページ数 */
  totalPages: number;
};

/**
 * TODOサービスクラス
 *
 * TODO関連の操作を一元管理する。
 * ユーザー認証、データベース操作、ビジネスロジックを含む。
 */
export class TodoService {
  private logger: ReturnType<typeof createSecureLogger>;

  constructor(
    private db: Database,
    env: { ENVIRONMENT?: string }
  ) {
    this.logger = createSecureLogger(env);
  }

  /**
   * TODO一覧取得（フィルタ・ソート・ページネーション対応）
   *
   * ユーザーごとのTODO一覧を取得する。
   * 論理削除されたアイテムは除外される。
   *
   * @param userId - 取得対象のユーザーID
   * @param filters - フィルタ条件
   * @param sort - ソート条件
   * @param pagination - ページネーション設定
   * @returns TODO一覧とページネーション情報
   */
  async getTodos(
    userId: string,
    filters: TodoFilters = {},
    sort: TodoSortOptions = { field: 'createdAt', order: 'desc' },
    pagination: PaginationOptions = { page: 0, limit: 20 }
  ): Promise<TodoListResponse> {
    try {
      // 基本条件：ユーザーID + 論理削除されていない
      let whereConditions = and(eq(todos.userId, userId), isNull(todos.deletedAt));

      // フィルタ条件の追加
      const conditions = [whereConditions];

      // 完了状態フィルタ
      if (filters.completed !== undefined) {
        conditions.push(eq(todos.completed, filters.completed));
      }

      // 期限日範囲フィルタ
      if (filters.dueDateFrom) {
        conditions.push(eq(todos.dueDate, normalizeDate(filters.dueDateFrom)));
      }
      if (filters.dueDateTo) {
        conditions.push(eq(todos.dueDate, normalizeDate(filters.dueDateTo)));
      }

      // 全文検索（タイトル・説明）
      if (filters.search) {
        const searchTerm = normalizeSearchTerm(filters.search);
        conditions.push(or(like(todos.title, searchTerm), like(todos.description, searchTerm)));
      }

      whereConditions = and(...conditions);

      // ソート設定
      const orderBy = sort.order === 'asc' ? asc : desc;
      let orderColumn;
      switch (sort.field) {
        case 'dueDate':
          orderColumn = todos.dueDate;
          break;
        case 'title':
          orderColumn = todos.title;
          break;
        case 'completed':
          orderColumn = todos.completed;
          break;
        default:
          orderColumn = todos.createdAt;
      }

      // 総件数取得
      const totalResult = await this.db
        .select({ count: count() })
        .from(todos)
        .where(whereConditions);
      const total = totalResult[0].count;

      // データ取得（ページネーション）
      const offset = calculateOffset(pagination.page, pagination.limit);
      const todoList = await this.db
        .select()
        .from(todos)
        .where(whereConditions)
        .orderBy(orderBy(orderColumn))
        .limit(pagination.limit)
        .offset(offset);

      // レスポンス形成
      return {
        todos: todoList,
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit),
      };
    } catch (error) {
      throw new Error(`TODO一覧取得エラー: ${handleDatabaseError(error)}`);
    }
  }

  /**
   * TODOをIDで取得
   *
   * 特定のTODOを取得する。
   * ユーザー認証とアクセス権限をチェック。
   *
   * @param userId - リクエストユーザーID
   * @param todoId - 取得対象のTODO ID
   * @returns TODO情報またはnull（見つからない場合）
   */
  async getTodoById(userId: string, todoId: string): Promise<Todo | null> {
    try {
      const result = await this.db
        .select()
        .from(todos)
        .where(and(eq(todos.id, todoId), eq(todos.userId, userId), isNull(todos.deletedAt)))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      throw new Error(`TODO取得エラー: ${handleDatabaseError(error)}`);
    }
  }

  /**
   * スラッグでTODOを取得
   *
   * URL-friendlyなスラッグでTODOを取得する。
   * 公開URL機能で使用。
   *
   * @param userId - リクエストユーザーID
   * @param slug - TODO スラッグ
   * @returns TODO情報またはnull（見つからない場合）
   */
  async getTodoBySlug(userId: string, slug: string): Promise<Todo | null> {
    try {
      const result = await this.db
        .select()
        .from(todos)
        .where(and(eq(todos.slug, slug), eq(todos.userId, userId), isNull(todos.deletedAt)))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      throw new Error(`TODO取得エラー: ${handleDatabaseError(error)}`);
    }
  }

  /**
   * 新規TODO作成
   *
   * ユーザーのTODOを新規作成する。
   * 自動ID生成、スラッグ生成、バリデーションを実行。
   *
   * @param userId - 作成者のユーザーID
   * @param todoData - TODO作成データ
   * @returns 作成されたTODO情報
   */
  async createTodo(
    userId: string,
    todoData: {
      title: string;
      description?: string;
      dueDate: string;
      completed?: boolean;
    }
  ): Promise<Todo> {
    try {
      // バリデーション：必須フィールドチェック
      if (!todoData.title?.trim()) {
        throw new Error('タイトルは必須です。');
      }
      if (!todoData.dueDate) {
        throw new Error('期限日は必須です。');
      }

      // 期限日の形式チェック
      try {
        normalizeDate(todoData.dueDate);
      } catch {
        throw new Error('期限日の形式が無効です。YYYY-MM-DD形式で入力してください。');
      }

      // 既存スラッグ取得（重複チェック用）
      const existingSlugs = await this.db
        .select({ slug: todos.slug })
        .from(todos)
        .where(eq(todos.userId, userId))
        .then(results => results.map(r => r.slug));

      // スラッグ生成（重複回避）
      const slug = generateSlug(todoData.title, existingSlugs);

      // TODO作成データの準備
      const now = getCurrentTimestamp();
      this.logger.log('🔄 TodoService.createTodo: データ準備開始', {
        userId,
        title: todoData.title,
        description: todoData.description,
        dueDate: todoData.dueDate,
        completed: todoData.completed,
        slug,
        now,
      });

      const newTodoData: NewTodo = {
        id: generateId(),
        userId,
        title: todoData.title.trim(),
        description: todoData.description?.trim() || null,
        completed: todoData.completed || false,
        dueDate: normalizeDate(todoData.dueDate),
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        slug,
      };

      this.logger.log('🔍 TodoService.createTodo: 最終挿入データ', {
        id: newTodoData.id,
        userId: newTodoData.userId,
        slug: newTodoData.slug,
        title: newTodoData.title,
        description: newTodoData.description,
        dueDate: newTodoData.dueDate,
        completed: newTodoData.completed,
        createdAt: newTodoData.createdAt,
        updatedAt: newTodoData.updatedAt,
        deletedAt: newTodoData.deletedAt,
      });

      // データベースに挿入
      this.logger.log('🔄 TodoService.createTodo: データベース挿入開始');
      const result = await this.db.insert(todos).values(newTodoData).returning();
      this.logger.log('✅ TodoService.createTodo: データベース挿入成功', {
        insertedCount: result.length,
        insertedId: result[0]?.id,
        insertedTitle: result[0]?.title,
      });

      return result[0];
    } catch (error) {
      this.logger.error('❌ TodoService.createTodo: サービスエラー', error);
      throw new Error(`TODO作成エラー: ${handleDatabaseError(error)}`);
    }
  }

  /**
   * TODO更新
   *
   * 既存TODOの情報を更新する。
   * 所有者チェックとバリデーションを実行。
   *
   * @param userId - 更新者のユーザーID
   * @param todoId - 更新対象のTODO ID
   * @param updateData - 更新データ（部分更新）
   * @returns 更新されたTODO情報
   */
  async updateTodo(
    userId: string,
    todoId: string,
    updateData: Partial<Pick<Todo, 'title' | 'description' | 'dueDate' | 'completed'>>
  ): Promise<Todo> {
    try {
      // TODO存在・所有者確認
      const existingTodo = await this.getTodoById(userId, todoId);
      if (!existingTodo) {
        throw new Error('TODOが見つからないか、アクセス権限がありません。');
      }

      // バリデーション
      if (updateData.title !== undefined && !updateData.title.trim()) {
        throw new Error('タイトルは必須です。');
      }
      if (updateData.dueDate) {
        try {
          updateData.dueDate = normalizeDate(updateData.dueDate);
        } catch {
          throw new Error('期限日の形式が無効です。YYYY-MM-DD形式で入力してください。');
        }
      }

      // 更新データの準備
      const updatedData = {
        ...updateData,
        title: updateData.title?.trim(),
        description: updateData.description?.trim() || null,
        updatedAt: getCurrentTimestamp(),
      };

      // データベース更新
      const result = await this.db
        .update(todos)
        .set(updatedData)
        .where(eq(todos.id, todoId))
        .returning();

      return result[0];
    } catch (error) {
      throw new Error(`TODO更新エラー: ${handleDatabaseError(error)}`);
    }
  }

  /**
   * TODO完了状態切り替え
   *
   * TODOの完了・未完了を切り替える。
   * 頻繁に使用される操作のため専用メソッドを提供。
   *
   * @param userId - 更新者のユーザーID
   * @param todoId - 対象のTODO ID
   * @param completed - 完了状態（true: 完了、false: 未完了）
   * @returns 更新されたTODO情報
   */
  async toggleTodoComplete(userId: string, todoId: string, completed: boolean): Promise<Todo> {
    return this.updateTodo(userId, todoId, { completed });
  }

  /**
   * TODO論理削除
   *
   * TODOを論理削除する（削除日時を設定）。
   * 実際のデータは保持され、復元も可能。
   *
   * @param userId - 削除者のユーザーID
   * @param todoId - 削除対象のTODO ID
   * @returns 削除成功の場合true
   */
  async deleteTodo(userId: string, todoId: string): Promise<boolean> {
    try {
      // TODO存在・所有者確認
      const existingTodo = await this.getTodoById(userId, todoId);
      if (!existingTodo) {
        throw new Error('TODOが見つからないか、アクセス権限がありません。');
      }

      // 論理削除実行
      await this.db
        .update(todos)
        .set({
          deletedAt: getCurrentTimestamp(),
          updatedAt: getCurrentTimestamp(),
        })
        .where(eq(todos.id, todoId));

      return true;
    } catch (error) {
      throw new Error(`TODO削除エラー: ${handleDatabaseError(error)}`);
    }
  }

  /**
   * TODO復元
   *
   * 論理削除されたTODOを復元する。
   * 削除日時をクリアして有効な状態に戻す。
   *
   * @param userId - 復元者のユーザーID
   * @param todoId - 復元対象のTODO ID
   * @returns 復元されたTODO情報
   */
  async restoreTodo(userId: string, todoId: string): Promise<Todo> {
    try {
      // 削除済みTODOを検索
      const result = await this.db
        .select()
        .from(todos)
        .where(and(eq(todos.id, todoId), eq(todos.userId, userId), isNotNull(todos.deletedAt)))
        .limit(1);

      if (!result[0]) {
        throw new Error('削除済みTODOが見つからないか、アクセス権限がありません。');
      }

      // 復元実行
      const restoredResult = await this.db
        .update(todos)
        .set({
          deletedAt: null,
          updatedAt: getCurrentTimestamp(),
        })
        .where(eq(todos.id, todoId))
        .returning();

      return restoredResult[0];
    } catch (error) {
      throw new Error(`TODO復元エラー: ${handleDatabaseError(error)}`);
    }
  }

  /**
   * 削除済みTODO一覧取得
   *
   * 論理削除されたTODOの一覧を取得する。
   * 管理機能や復元機能で使用。
   *
   * @param userId - 取得対象のユーザーID
   * @param pagination - ページネーション設定
   * @returns 削除済みTODO一覧
   */
  async getDeletedTodos(
    userId: string,
    pagination: PaginationOptions = { page: 0, limit: 20 }
  ): Promise<TodoListResponse> {
    try {
      const whereConditions = and(eq(todos.userId, userId), isNotNull(todos.deletedAt));

      // 総件数取得
      const totalResult = await this.db
        .select({ count: count() })
        .from(todos)
        .where(whereConditions);
      const total = totalResult[0].count;

      // データ取得
      const offset = calculateOffset(pagination.page, pagination.limit);
      const todoList = await this.db
        .select()
        .from(todos)
        .where(whereConditions)
        .orderBy(desc(todos.deletedAt))
        .limit(pagination.limit)
        .offset(offset);

      return {
        todos: todoList,
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit),
      };
    } catch (error) {
      throw new Error(`削除済みTODO取得エラー: ${handleDatabaseError(error)}`);
    }
  }
}
