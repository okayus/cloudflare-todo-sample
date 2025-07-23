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
        }),
        limit: Num({
          description: '1ページあたりの件数',
          default: 20,
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
    // 認証ミドルウェアを実行
    return new Promise(resolve => {
      authMiddleware(c, async () => {
        try {
          // 認証済みユーザーIDを取得
          const userId = c.get('userId');
          if (!userId) {
            resolve(c.json({ success: false, error: '認証が必要です。' }, 401));
            return;
          }

          // バリデーション済みデータの取得
          const data = await this.getValidatedData<typeof this.schema>();
          const queryParams = data.query;

          // パラメータの構築
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
          const db = getDatabase(c);
          const todoService = new TodoService(db);

          // TODO一覧取得（認証済みユーザーIDを使用）
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

          resolve(
            c.json({
              success: true,
              data: result,
            })
          );
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('TODO一覧取得エラー:', error);

          // バリデーションエラーの場合
          if (error instanceof z.ZodError) {
            resolve(
              c.json(
                {
                  success: false,
                  error: `バリデーションエラー: ${error.errors.map(e => e.message).join(', ')}`,
                },
                400
              )
            );
            return;
          }

          // その他のエラー
          resolve(
            c.json(
              {
                success: false,
                error: error instanceof Error ? error.message : '予期しないエラーが発生しました',
              },
              500
            )
          );
        }
      });
    });
  }
}
