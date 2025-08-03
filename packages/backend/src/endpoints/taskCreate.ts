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
    console.log('🔄 TaskCreate: ハンドラー開始', {
      method: c.req.method,
      url: c.req.url,
      timestamp: new Date().toISOString(),
    });

    try {
      // 認証ミドルウェアを実行
      console.log('🔄 TaskCreate: 認証ミドルウェア実行開始');
      await authMiddleware(c, async () => {
        console.log('✅ TaskCreate: 認証ミドルウェア実行完了');
      });

      // 認証済みユーザーIDを取得
      const userId = c.get('userId');
      console.log('🔍 TaskCreate: ユーザーID確認', {
        userIdExists: !!userId,
        userId: userId ? userId.substring(0, 8) + '...' : null,
      });

      if (!userId) {
        console.log('❌ TaskCreate: ユーザーID不在');
        return c.json({ success: false, error: '認証が必要です。' }, 401);
      }

      // バリデーション済みデータの取得
      console.log('🔄 TaskCreate: リクエストデータバリデーション開始');
      const data = await this.getValidatedData<typeof this.schema>();
      console.log('✅ TaskCreate: バリデーション完了', {
        bodyKeys: Object.keys(data.body || {}),
        hasBody: !!data.body,
      });

      const todoData = data.body;
      console.log('🔍 TaskCreate: TODOデータ詳細', {
        title: todoData.title,
        description: todoData.description,
        dueDate: todoData.dueDate,
        completed: todoData.completed,
        hasTitle: !!todoData.title,
        hasDescription: todoData.description !== undefined,
        hasDueDate: !!todoData.dueDate,
      });

      // データベース接続とサービス初期化
      console.log('🔄 TaskCreate: データベース接続・サービス初期化');
      const db = getDatabase(c);
      const todoService = new TodoService(db, c.env);

      // TODO作成データの準備
      console.log('🔄 TaskCreate: TODO作成データ準備');
      const createData = {
        title: todoData.title,
        description: todoData.description,
        dueDate: todoData.dueDate,
        completed: todoData.completed,
      };
      console.log('🔍 TaskCreate: 作成データ最終確認', {
        createData,
        createDataKeys: Object.keys(createData),
      });

      // TODO作成実行
      console.log('🔄 TaskCreate: TODO作成サービス実行開始');
      const newTodo = await todoService.createTodo(userId, createData);
      console.log('✅ TaskCreate: TODO作成成功', {
        newTodoId: newTodo.id,
        newTodoTitle: newTodo.title,
        newTodoSlug: newTodo.slug,
        createdKeys: Object.keys(newTodo),
      });

      return c.json(
        {
          success: true,
          data: newTodo,
        },
        201
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ TaskCreate: TODO作成エラー:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        isZodError: error instanceof z.ZodError,
        errorType: error?.constructor?.name,
      });

      // バリデーションエラーの場合
      if (error instanceof z.ZodError) {
        console.log('❌ TaskCreate: Zodバリデーションエラー', {
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

      // ビジネスロジックエラー（タイトル必須など）
      if (
        error instanceof Error &&
        (error.message.includes('タイトルは必須') ||
          error.message.includes('期限日は必須') ||
          error.message.includes('期限日の形式が無効'))
      ) {
        console.log('❌ TaskCreate: ビジネスロジックエラー', {
          errorMessage: error.message,
        });

        return c.json(
          {
            success: false,
            error: error.message,
          },
          400
        );
      }

      // データベースエラーの詳細確認
      if (
        error instanceof Error &&
        (error.message.includes('UNIQUE constraint') ||
          error.message.includes('FOREIGN KEY constraint') ||
          error.message.includes('NOT NULL constraint'))
      ) {
        console.log('❌ TaskCreate: データベース制約エラー', {
          errorMessage: error.message,
          errorStack: error.stack,
        });

        return c.json(
          {
            success: false,
            error: `データベースエラー: ${error.message}`,
          },
          400
        );
      }

      // その他のサーバーエラー
      console.log('❌ TaskCreate: その他のサーバーエラー', {
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
      });

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
