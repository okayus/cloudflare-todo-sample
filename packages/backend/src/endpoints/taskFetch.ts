/**
 * TODO取得エンドポイント
 *
 * スラッグまたはIDでTODOを取得する。
 * ユーザー認証とアクセス権限をチェック。
 */
import { OpenAPIRoute, Str } from 'chanfana';
import { z } from 'zod';
import { type AppContext, TodoSchema } from '../types';
import { getDatabase } from '../database/connection';
import { TodoService } from '../services/todoService';

export class TaskFetch extends OpenAPIRoute {
  schema = {
    tags: ['Todos'],
    summary: 'TODO詳細取得',
    description: 'スラッグまたはIDでTODOの詳細情報を取得します。',
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
    try {
      // バリデーション済みデータの取得
      const data = await this.getValidatedData<typeof this.schema>();
      const { taskSlug } = data.params;
      const { userId } = data.query;

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
        return c.json(
          {
            success: false,
            error: 'TODOが見つからないか、アクセス権限がありません。',
          },
          404
        );
      }

      return c.json({
        success: true,
        data: todo,
      });
    } catch (error) {
      console.error('TODO取得エラー:', error);

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
