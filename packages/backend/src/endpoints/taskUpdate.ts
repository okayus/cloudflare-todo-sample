/**
 * TODO更新エンドポイント
 *
 * 認証済みユーザーの既存TODOの情報を更新する。
 * 部分更新をサポートし、ユーザー認証とアクセス権限をチェック。
 */
import { OpenAPIRoute, Str } from 'chanfana';
import { z } from 'zod';
import { type AppContext, UpdateTodoSchema, TodoSchema } from '../types';
import { getDatabase } from '../database/connection';
import { TodoService } from '../services/todoService';
import { authMiddleware } from '../middleware/auth';

export class TaskUpdate extends OpenAPIRoute {
  schema = {
    tags: ['Todos'],
    summary: 'TODO更新',
    description: '認証済みユーザーのTODOの情報を更新します。部分更新をサポートします。',
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        taskSlug: Str({
          description: 'TODOスラッグまたはID',
          example: 'clean-room',
        }),
      }),
      body: {
        content: {
          'application/json': {
            schema: UpdateTodoSchema,
          },
        },
      },
    },
    responses: {
      '200': {
        description: 'TODO更新成功',
        content: {
          'application/json': {
            schema: z.object({
              success: z.boolean(),
              data: TodoSchema,
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
          const updateData = data.body;

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

          // TODO更新
          const updatedTodo = await todoService.updateTodo(userId, todo.id, updateData);

          resolve(
            c.json({
              success: true,
              data: updatedTodo,
            })
          );
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('TODO更新エラー:', error);

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

          // ビジネスロジックエラー（タイトル必須など）
          if (
            error instanceof Error &&
            (error.message.includes('タイトルは必須') ||
              error.message.includes('期限日の形式が無効') ||
              error.message.includes('更新するフィールドを少なくとも1つ指定'))
          ) {
            resolve(
              c.json(
                {
                  success: false,
                  error: error.message,
                },
                400
              )
            );
            return;
          }

          // その他のサーバーエラー
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
