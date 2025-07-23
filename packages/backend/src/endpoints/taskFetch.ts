/**
 * TODO取得エンドポイント
 *
 * 認証済みユーザーのスラッグまたはIDでTODOを取得する。
 * ユーザー認証とアクセス権限をチェック。
 */
import { OpenAPIRoute, Str } from 'chanfana';
import { z } from 'zod';
import { type AppContext, TodoSchema } from '../types';
import { getDatabase } from '../database/connection';
import { TodoService } from '../services/todoService';
import { authMiddleware } from '../middleware/auth';

export class TaskFetch extends OpenAPIRoute {
  schema = {
    tags: ['Todos'],
    summary: 'TODO詳細取得',
    description: '認証済みユーザーのスラッグまたはIDでTODOの詳細情報を取得します。',
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        taskSlug: Str({
          description: 'TODOスラッグまたはID',
          example: 'clean-room',
        }),
      }),
    },
    responses: {
      '200': {
        description: 'TODO取得成功',
        content: {
          'application/json': {
            schema: z.object({
              success: z.boolean(),
              data: TodoSchema,
            }),
          },
        },
      },
      '404': {
        description: 'TODOが見つからない',
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
          const { taskSlug } = data.params;

          // データベース接続とサービス初期化
          const db = getDatabase(c);
          const todoService = new TodoService(db);

          // TODO取得（スラッグとIDの両方を試行）
          let todo = await todoService.getTodoBySlug(userId, taskSlug);

          // スラッグで見つからない場合、IDとして検索
          if (!todo) {
            todo = await todoService.getTodoById(userId, taskSlug);
          }

          // TODOが見つからない場合
          if (!todo) {
            resolve(
              c.json(
                {
                  success: false,
                  error: 'TODOが見つからないか、アクセス権限がありません。',
                },
                404
              )
            );
            return;
          }

          resolve(
            c.json({
              success: true,
              data: todo,
            })
          );
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('TODO取得エラー:', error);

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
