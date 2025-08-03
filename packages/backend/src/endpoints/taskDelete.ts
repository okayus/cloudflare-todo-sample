/**
 * TODO削除エンドポイント
 *
 * 認証済みユーザーのTODOを論理削除する（完全削除ではなく、deleted_atを設定）。
 * ユーザー認証とアクセス権限をチェック。
 */
import { OpenAPIRoute, Str } from 'chanfana';
import { z } from 'zod';
import { type AppContext } from '../types';
import { getDatabase } from '../database/connection';
import { TodoService } from '../services/todoService';
import { authMiddleware } from '../middleware/auth';

export class TaskDelete extends OpenAPIRoute {
  schema = {
    tags: ['Todos'],
    summary: 'TODO削除',
    description:
      '認証済みユーザーのTODOを論理削除します（完全削除ではありません）。復元が可能です。',
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
        description: 'TODO削除成功',
        content: {
          'application/json': {
            schema: z.object({
              success: z.boolean(),
              message: z.string(),
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
          const todoService = new TodoService(db, c.env);

          // TODO存在確認（スラッグとIDの両方を試行）
          let todo = await todoService.getTodoBySlug(userId, taskSlug);
          if (!todo) {
            todo = await todoService.getTodoById(userId, taskSlug);
          }

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

          // TODO削除（論理削除）
          const deleteResult = await todoService.deleteTodo(userId, todo.id);

          if (deleteResult) {
            resolve(
              c.json({
                success: true,
                message: 'TODOを削除しました。復元が必要な場合は復元機能をご利用ください。',
              })
            );
          } else {
            resolve(
              c.json(
                {
                  success: false,
                  error: 'TODO削除に失敗しました。',
                },
                500
              )
            );
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('TODO削除エラー:', error);

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
