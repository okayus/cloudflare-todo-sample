/**
 * TODO削除エンドポイント
 *
 * TODOを論理削除する（完全削除ではなく、deleted_atを設定）。
 * ユーザー認証とアクセス権限をチェック。
 */
import { OpenAPIRoute, Str } from 'chanfana';
import { z } from 'zod';
import { type AppContext } from '../types';
import { getDatabase } from '../database/connection';
import { TodoService } from '../services/todoService';

export class TaskDelete extends OpenAPIRoute {
  schema = {
    tags: ['Todos'],
    summary: 'TODO削除',
    description: 'TODOを論理削除します（完全削除ではありません）。復元が可能です。',
    request: {
      params: z.object({
        taskSlug: Str({
          description: 'TODOスラッグまたはID',
          example: 'clean-room',
        }),
      }),
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
    try {
      // バリデーション済みデータの取得
      const data = await this.getValidatedData<typeof this.schema>();
      const { taskSlug } = data.params;
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

      // TODO削除（論理削除）
      const deleteResult = await todoService.deleteTodo(userId, todo.id);

      if (deleteResult) {
        return c.json({
          success: true,
          message: 'TODOを削除しました。復元が必要な場合は復元機能をご利用ください。',
        });
      } else {
        return c.json(
          {
            success: false,
            error: 'TODO削除に失敗しました。',
          },
          500
        );
      }
    } catch (error) {
      console.error('TODO削除エラー:', error);

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
