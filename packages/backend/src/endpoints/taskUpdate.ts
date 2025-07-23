/**
 * TODO更新エンドポイント
 *
 * 既存TODOの情報を更新する。
 * 部分更新をサポートし、ユーザー認証とアクセス権限をチェック。
 */
import { OpenAPIRoute, Str } from 'chanfana';
import { z } from 'zod';
import { type AppContext, UpdateTodoSchema, TodoSchema } from '../types';
import { getDatabase } from '../database/connection';
import { TodoService } from '../services/todoService';

export class TaskUpdate extends OpenAPIRoute {
  schema = {
    tags: ['Todos'],
    summary: 'TODO更新',
    description: 'TODOの情報を更新します。部分更新をサポートします。',
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
      query: z.object({
        // 固定ユーザーID（認証実装まで）
        userId: Str({
          description: 'ユーザーID（認証実装まで暫定）',
          default: 'fixed-user-id',
        }),
      }),
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
    try {
      // バリデーション済みデータの取得
      const data = await this.getValidatedData<typeof this.schema>();
      const { taskSlug } = data.params;
      const updateData = data.body;
      const { userId } = data.query;

      // データベース接続とサービス初期化
      const db = getDatabase(c);
      const todoService = new TodoService(db);

      // TODO存在確認（スラッグとIDの両方を試行）
      let todo = await todoService.getTodoBySlug(userId, taskSlug);
      if (!todo) {
        todo = await todoService.getTodoById(userId, taskSlug);
      }

      if (!todo) {
        return c.json(
          {
            success: false,
            error: 'TODOが見つからないか、アクセス権限がありません。',
          },
          404
        );
      }

      // TODO更新
      const updatedTodo = await todoService.updateTodo(userId, todo.id, updateData);

      return c.json({
        success: true,
        data: updatedTodo,
      });
    } catch (error) {
      console.error('TODO更新エラー:', error);

      // バリデーションエラーの場合
      if (error instanceof z.ZodError) {
        return c.json(
          {
            success: false,
            error: `バリデーションエラー: ${error.errors.map(e => e.message).join(', ')}`,
          },
          400
        );
      }

      // ビジネスロジックエラー（タイトル必須など）
      if (
        error instanceof Error &&
        (error.message.includes('タイトルは必須') ||
          error.message.includes('期限日の形式が無効') ||
          error.message.includes('更新するフィールドを少なくとも1つ指定'))
      ) {
        return c.json(
          {
            success: false,
            error: error.message,
          },
          400
        );
      }

      // その他のサーバーエラー
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
