/**
 * TODO作成エンドポイント
 *
 * 認証済みユーザーの新しいTODOを作成する。
 * バリデーション、自動ID・スラッグ生成を実行。
 */
import { OpenAPIRoute } from 'chanfana';
import { z } from 'zod';
import { type AppContext, CreateTodoSchema, TodoSchema } from '../types';
import { getDatabase } from '../database/connection';
import { TodoService } from '../services/todoService';
import { authMiddleware } from '../middleware/auth';

export class TaskCreate extends OpenAPIRoute {
  schema = {
    tags: ['Todos'],
    summary: 'TODO作成',
    description: '認証済みユーザーの新しいTODOを作成します。ID・スラッグは自動生成されます。',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: CreateTodoSchema,
          },
        },
      },
    },
    responses: {
      '201': {
        description: 'TODO作成成功',
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
          const todoData = data.body;

          // データベース接続とサービス初期化
          const db = getDatabase(c);
          const todoService = new TodoService(db);

          // TODO作成（型変換）
          const createData = {
            title: todoData.title,
            description: todoData.description,
            dueDate: todoData.dueDate,
            completed: todoData.completed,
          };
          const newTodo = await todoService.createTodo(userId, createData);

          resolve(
            c.json(
              {
                success: true,
                data: newTodo,
              },
              201
            )
          );
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('TODO作成エラー:', error);

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
              error.message.includes('期限日は必須') ||
              error.message.includes('期限日の形式が無効'))
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
