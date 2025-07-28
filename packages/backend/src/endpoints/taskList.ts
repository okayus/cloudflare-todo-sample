/**
 * TODO一覧取得エンドポイント
 *
 * 認証済みユーザーのTODO一覧を取得する。
 * フィルタリング、ソート、ページネーション機能を提供。
 */
import { Bool, Num, Str, OpenAPIRoute } from 'chanfana';
import { z } from 'zod';
import { type AppContext, TodoListResponseSchema, TodoFiltersSchema } from '../types';
import { getDatabase } from '../database/connection';
import { TodoService } from '../services/todoService';
import { authMiddleware } from '../middleware/auth';

export class TaskList extends OpenAPIRoute {
  schema = {
    tags: ['Todos'],
    summary: 'TODO一覧取得',
    description:
      '認証済みユーザーのTODO一覧を取得します。フィルタリング、ソート、ページネーション機能を提供します。',
    security: [{ bearerAuth: [] }],
    request: {
      query: z.object({
        // ページネーション
        page: Num({
          description: 'ページ番号（0ベース）',
          default: 0,
          required: false,
        }),
        limit: Num({
          description: '1ページあたりの件数',
          default: 20,
          required: false,
        }),

        // フィルタリング
        completed: Bool({
          description: '完了状態フィルタ（true: 完了のみ、false: 未完了のみ）',
          required: false,
        }),
        dueDateFrom: Str({
          description: '期限日From（YYYY-MM-DD形式）',
          required: false,
        }),
        dueDateTo: Str({
          description: '期限日To（YYYY-MM-DD形式）',
          required: false,
        }),
        search: Str({
          description: '検索キーワード（タイトル・説明での部分一致）',
          required: false,
        }),

        // ソート
        sortField: Str({
          description: 'ソートフィールド',
          default: 'createdAt',
        }),
        sortOrder: Str({
          description: 'ソート順',
          default: 'desc',
        }),
      }),
    },
    responses: {
      '200': {
        description: 'TODO一覧取得成功',
        content: {
          'application/json': {
            schema: z.object({
              success: z.boolean(),
              data: TodoListResponseSchema,
            }),
          },
        },
      },
      '400': {
        description: 'バリデーションエラー',
        content: {
          'application/json': {
            schema: z.object({
              success: z.boolean(),
              error: z.string(),
            }),
          },
        },
      },
      '500': {
        description: 'サーバーエラー',
        content: {
          'application/json': {
            schema: z.object({
              success: z.boolean(),
              error: z.string(),
            }),
          },
        },
      },
    },
  };

  async handle(c: AppContext): Promise<Response> {
    console.log('🔄 TaskList: ハンドラー開始', {
      method: c.req.method,
      url: c.req.url,
      timestamp: new Date().toISOString(),
    });

    try {
      // 認証ミドルウェアを実行
      console.log('🔄 TaskList: 認証ミドルウェア実行開始');
      await authMiddleware(c, async () => {
        console.log('✅ TaskList: 認証ミドルウェア実行完了');
      });

      // 認証済みユーザーIDを取得
      const userId = c.get('userId');
      console.log('🔍 TaskList: ユーザーID確認', {
        userIdExists: !!userId,
        userId: userId ? userId.substring(0, 8) + '...' : null,
      });

      if (!userId) {
        console.log('❌ TaskList: ユーザーID不在');
        return c.json({ success: false, error: '認証が必要です。' }, 401);
      }

      // バリデーション済みデータの取得
      console.log('🔄 TaskList: リクエストデータバリデーション開始');
      const data = await this.getValidatedData<typeof this.schema>();
      console.log('✅ TaskList: バリデーション完了', {
        queryParams: Object.keys(data.query || {}),
      });

      const queryParams = data.query;

      // パラメータの構築
      console.log('🔄 TaskList: フィルターパラメータ構築');
      const filters = TodoFiltersSchema.parse({
        completed: queryParams.completed,
        dueDateFrom: queryParams.dueDateFrom,
        dueDateTo: queryParams.dueDateTo,
        search: queryParams.search,
      });

      const pagination = {
        page: queryParams.page || 0,
        limit: queryParams.limit || 20,
      };

      // データベース接続とサービス初期化
      console.log('🔄 TaskList: データベース接続・サービス初期化');
      const db = getDatabase(c);
      const todoService = new TodoService(db);

      // TODO一覧取得（認証済みユーザーIDを使用）
      console.log('🔄 TaskList: TODO一覧取得開始', {
        userId: userId.substring(0, 8) + '...',
        filters,
        pagination,
      });

      const result = await todoService.getTodos(
        userId,
        filters,
        {
          field:
            (queryParams.sortField as 'createdAt' | 'dueDate' | 'title' | 'completed') ||
            'createdAt',
          order: (queryParams.sortOrder as 'asc' | 'desc') || 'desc',
        },
        pagination
      );

      console.log('✅ TaskList: TODO一覧取得成功', {
        resultKeys: Object.keys(result),
        totalCount: result.total,
        todosCount: result.todos?.length || 0,
        resultStructure: {
          hasItems: 'items' in result,
          hasTodos: 'todos' in result,
          resultType: typeof result,
        },
      });

      // フロントエンド期待形式への変換（todos → items）
      const responseData = {
        items: result.todos,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      };

      console.log('✅ TaskList: レスポンスデータ変換完了', {
        originalTodosCount: result.todos?.length || 0,
        mappedItemsCount: responseData.items?.length || 0,
        responseKeys: Object.keys(responseData),
      });

      return c.json({
        success: true,
        data: responseData,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ TaskList: TODO一覧取得エラー:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        isZodError: error instanceof z.ZodError,
      });

      // バリデーションエラーの場合
      if (error instanceof z.ZodError) {
        console.log('❌ TaskList: Zodバリデーションエラー', {
          errors: error.errors.map(e => ({ path: e.path, message: e.message })),
        });

        return c.json(
          {
            success: false,
            error: `バリデーションエラー: ${error.errors.map(e => e.message).join(', ')}`,
          },
          400
        );
      }

      // その他のエラー
      return c.json(
        {
          success: false,
          error: error instanceof Error ? error.message : '予期しないエラーが発生しました',
        },
        500
      );
    }
  }
}
