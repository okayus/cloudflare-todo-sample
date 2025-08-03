/**
 * TODOサービステスト
 *
 * TodoServiceの単体テストを実装。
 * モックデータベースを使用してビジネスロジックを検証する。
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TodoService } from '../todoService';
import { type Todo } from '../../database/schema';
import { type Database } from '../../database/connection';

// generateId関数のモック
vi.mock('../../utils/db', () => ({
  generateId: vi.fn(() => 'mock-uuid-123'),
  generateSlug: vi.fn((title: string) => title.toLowerCase().replace(/\s+/g, '-')),
  handleDatabaseError: vi.fn((error: unknown) => (error as Error).message || '不明なエラー'),
  getCurrentTimestamp: vi.fn(() => '2023-01-01T00:00:00.000Z'),
  calculateOffset: vi.fn((page: number, limit: number) => page * limit),
  normalizeSearchTerm: vi.fn((term: string) => `%${term}%`),
  normalizeDate: vi.fn((date: string) => date),
}));

// モックデータベース
const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

// テスト用TODOデータ
const testTodo: Todo = {
  id: 'todo-123',
  userId: 'user-123',
  title: 'テストTODO',
  description: 'テスト用の説明',
  completed: false,
  dueDate: '2023-12-31T23:59:59.000Z',
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
  deletedAt: null,
  slug: 'test-todo',
};

const newTodoData = {
  title: '新しいTODO',
  description: '新しいTODOの説明',
  dueDate: '2023-12-31T23:59:59.000Z',
  completed: false,
};

describe('TodoService', () => {
  let todoService: TodoService;

  beforeEach(() => {
    // モックをリセット
    vi.clearAllMocks();

    // TodoServiceインスタンス作成
    todoService = new TodoService(mockDb as unknown as Database, { ENVIRONMENT: 'test' });
  });

  describe('getTodos', () => {
    it('TODO一覧を正常に取得できる', async () => {
      // countのモック
      const mockCountChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 5 }]),
      };

      // selectのモック
      const mockSelectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue([testTodo]),
      };

      // selectの呼び出し順でモックを切り替え
      mockDb.select
        .mockReturnValueOnce(mockCountChain) // 1回目: count
        .mockReturnValueOnce(mockSelectChain); // 2回目: select

      // テスト実行
      const result = await todoService.getTodos('user-123');

      // 検証
      expect(result.todos).toEqual([testTodo]);
      expect(result.total).toBe(5);
      expect(result.page).toBe(0);
      expect(result.limit).toBe(20);
    });

    it('フィルタ条件を適用してTODO一覧を取得できる', async () => {
      // countのモック
      const mockCountChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 2 }]),
      };

      // selectのモック
      const mockSelectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue([{ ...testTodo, completed: true }]),
      };

      mockDb.select.mockReturnValueOnce(mockCountChain).mockReturnValueOnce(mockSelectChain);

      // フィルタ条件付きでテスト実行
      const result = await todoService.getTodos('user-123', { completed: true, search: 'テスト' });

      // 検証
      expect(result.todos[0].completed).toBe(true);
      expect(mockSelectChain.where).toHaveBeenCalled();
    });
  });

  describe('getTodoById', () => {
    it('既存TODOを正常に取得できる', async () => {
      // モックの戻り値設定
      const mockChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([testTodo]),
      };
      mockDb.select.mockReturnValue(mockChain);

      // テスト実行
      const result = await todoService.getTodoById('user-123', 'todo-123');

      // 検証
      expect(result).toEqual(testTodo);
      expect(mockChain.where).toHaveBeenCalled();
      expect(mockChain.limit).toHaveBeenCalledWith(1);
    });

    it('存在しないTODOの場合nullを返す', async () => {
      // モックの戻り値設定（空配列）
      const mockChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
      mockDb.select.mockReturnValue(mockChain);

      // テスト実行
      const result = await todoService.getTodoById('user-123', 'nonexistent-id');

      // 検証
      expect(result).toBeNull();
    });
  });

  describe('getTodoBySlug', () => {
    it('スラッグでTODOを正常に取得できる', async () => {
      // モックの戻り値設定
      const mockChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([testTodo]),
      };
      mockDb.select.mockReturnValue(mockChain);

      // テスト実行
      const result = await todoService.getTodoBySlug('user-123', 'test-todo');

      // 検証
      expect(result).toEqual(testTodo);
    });
  });

  describe('createTodo', () => {
    it('新規TODOを正常に作成できる', async () => {
      // 既存スラッグ取得のモック
      const mockSelectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        then: vi.fn().mockResolvedValue([]),
      };
      mockDb.select.mockReturnValue(mockSelectChain);

      // insertのモック
      const mockInsertChain = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ ...testTodo, ...newTodoData }]),
      };
      mockDb.insert.mockReturnValue(mockInsertChain);

      // テスト実行
      const result = await todoService.createTodo('user-123', newTodoData);

      // 検証
      expect(result).toBeDefined();
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockInsertChain.values).toHaveBeenCalled();
      expect(mockInsertChain.returning).toHaveBeenCalled();
    });

    it('タイトルが空の場合エラーを返す', async () => {
      // テスト実行と検証
      await expect(
        todoService.createTodo('user-123', {
          ...newTodoData,
          title: '',
        })
      ).rejects.toThrow('タイトルは必須です。');

      await expect(
        todoService.createTodo('user-123', {
          ...newTodoData,
          title: '   ', // 空白のみ
        })
      ).rejects.toThrow('タイトルは必須です。');
    });

    it('期限日が未設定の場合エラーを返す', async () => {
      // テスト実行と検証
      await expect(
        todoService.createTodo('user-123', {
          ...newTodoData,
          dueDate: '',
        })
      ).rejects.toThrow('期限日は必須です。');
    });
  });

  describe('updateTodo', () => {
    it('TODOを正常に更新できる', async () => {
      // getTodoByIdのモック（存在確認用）
      const mockSelectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([testTodo]),
      };
      mockDb.select.mockReturnValue(mockSelectChain);

      // updateのモック
      const updatedTodo = { ...testTodo, title: '更新されたTODO' };
      const mockUpdateChain = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([updatedTodo]),
      };
      mockDb.update.mockReturnValue(mockUpdateChain);

      // テスト実行
      const result = await todoService.updateTodo('user-123', 'todo-123', {
        title: '更新されたTODO',
      });

      // 検証
      expect(result.title).toBe('更新されたTODO');
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('存在しないTODOの更新でエラーを返す', async () => {
      // getTodoByIdのモック（見つからない場合）
      const mockSelectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
      mockDb.select.mockReturnValue(mockSelectChain);

      // テスト実行と検証
      await expect(
        todoService.updateTodo('user-123', 'nonexistent-id', {
          title: '新しいタイトル',
        })
      ).rejects.toThrow('TODOが見つからないか、アクセス権限がありません。');
    });

    it('空のタイトルで更新しようとした場合エラーを返す', async () => {
      // getTodoByIdのモック（存在確認用）
      const mockSelectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([testTodo]),
      };
      mockDb.select.mockReturnValue(mockSelectChain);

      // テスト実行と検証
      await expect(
        todoService.updateTodo('user-123', 'todo-123', {
          title: '',
        })
      ).rejects.toThrow('タイトルは必須です。');
    });
  });

  describe('toggleTodoComplete', () => {
    it('TODO完了状態を正常に切り替えできる', async () => {
      // getTodoByIdのモック
      const mockSelectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([testTodo]),
      };
      mockDb.select.mockReturnValue(mockSelectChain);

      // updateのモック
      const completedTodo = { ...testTodo, completed: true };
      const mockUpdateChain = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([completedTodo]),
      };
      mockDb.update.mockReturnValue(mockUpdateChain);

      // テスト実行
      const result = await todoService.toggleTodoComplete('user-123', 'todo-123', true);

      // 検証
      expect(result.completed).toBe(true);
    });
  });

  describe('deleteTodo', () => {
    it('TODOを正常に論理削除できる', async () => {
      // getTodoByIdのモック（存在確認用）
      const mockSelectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([testTodo]),
      };
      mockDb.select.mockReturnValue(mockSelectChain);

      // updateのモック（論理削除用）
      const mockUpdateChain = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(undefined),
      };
      mockDb.update.mockReturnValue(mockUpdateChain);

      // テスト実行
      const result = await todoService.deleteTodo('user-123', 'todo-123');

      // 検証
      expect(result).toBe(true);
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('存在しないTODOの削除でエラーを返す', async () => {
      // getTodoByIdのモック（見つからない場合）
      const mockSelectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
      mockDb.select.mockReturnValue(mockSelectChain);

      // テスト実行と検証
      await expect(todoService.deleteTodo('user-123', 'nonexistent-id')).rejects.toThrow(
        'TODOが見つからないか、アクセス権限がありません。'
      );
    });
  });

  describe('restoreTodo', () => {
    it('削除済みTODOを正常に復元できる', async () => {
      const deletedTodo = { ...testTodo, deletedAt: '2023-01-02T00:00:00.000Z' };

      // 削除済みTODO検索のモック
      const mockSelectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([deletedTodo]),
      };
      mockDb.select.mockReturnValue(mockSelectChain);

      // updateのモック（復元用）
      const restoredTodo = { ...deletedTodo, deletedAt: null };
      const mockUpdateChain = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([restoredTodo]),
      };
      mockDb.update.mockReturnValue(mockUpdateChain);

      // テスト実行
      const result = await todoService.restoreTodo('user-123', 'todo-123');

      // 検証
      expect(result.deletedAt).toBeNull();
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('削除済みでないTODOの復元でエラーを返す', async () => {
      // selectのモック（削除済みTODOが見つからない場合）
      const mockSelectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
      mockDb.select.mockReturnValue(mockSelectChain);

      // テスト実行と検証
      await expect(todoService.restoreTodo('user-123', 'todo-123')).rejects.toThrow(
        '削除済みTODOが見つからないか、アクセス権限がありません。'
      );
    });
  });

  describe('getDeletedTodos', () => {
    it('削除済みTODO一覧を正常に取得できる', async () => {
      const deletedTodo = { ...testTodo, deletedAt: '2023-01-02T00:00:00.000Z' };

      // countのモック
      const mockCountChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 1 }]),
      };

      // selectのモック
      const mockSelectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue([deletedTodo]),
      };

      mockDb.select.mockReturnValueOnce(mockCountChain).mockReturnValueOnce(mockSelectChain);

      // テスト実行
      const result = await todoService.getDeletedTodos('user-123');

      // 検証
      expect(result.todos).toEqual([deletedTodo]);
      expect(result.total).toBe(1);
      expect(result.todos[0].deletedAt).toBeTruthy();
    });
  });
});
