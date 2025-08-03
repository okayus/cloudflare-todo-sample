/**
 * ユーザーサービステスト
 *
 * UserServiceの単体テストを実装。
 * モックデータベースを使用してビジネスロジックを検証する。
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserService } from '../userService';
import { type User, type NewUser } from '../../database/schema';
import { type Database } from '../../database/connection';

// モックデータベース
const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

// テスト用ユーザーデータ
const testUser: User = {
  id: 'firebase-uid-123',
  email: 'test@example.com',
  displayName: 'テストユーザー',
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
};

const newUserData: NewUser = {
  id: 'firebase-uid-456',
  email: 'newuser@example.com',
  displayName: '新規ユーザー',
};

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    // モックをリセット
    vi.clearAllMocks();

    // UserServiceインスタンス作成
    userService = new UserService(mockDb as unknown as Database, { ENVIRONMENT: 'test' });
  });

  describe('getUserById', () => {
    it('既存ユーザーを正常に取得できる', async () => {
      // モックの戻り値設定
      const mockChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([testUser]),
      };
      mockDb.select.mockReturnValue(mockChain);

      // テスト実行
      const result = await userService.getUserById('firebase-uid-123');

      // 検証
      expect(result).toEqual(testUser);
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockChain.where).toHaveBeenCalled();
      expect(mockChain.limit).toHaveBeenCalledWith(1);
    });

    it('存在しないユーザーの場合nullを返す', async () => {
      // モックの戻り値設定（空配列）
      const mockChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
      mockDb.select.mockReturnValue(mockChain);

      // テスト実行
      const result = await userService.getUserById('nonexistent-id');

      // 検証
      expect(result).toBeNull();
    });

    it('データベースエラーが発生した場合適切なエラーメッセージを返す', async () => {
      // モックでエラーを発生させる
      const mockChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockRejectedValue(new Error('Database connection failed')),
      };
      mockDb.select.mockReturnValue(mockChain);

      // テスト実行と検証
      await expect(userService.getUserById('test-id')).rejects.toThrow('ユーザー取得エラー:');
    });
  });

  describe('getUserByEmail', () => {
    it('メールアドレスでユーザーを正常に取得できる', async () => {
      // モックの戻り値設定
      const mockChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([testUser]),
      };
      mockDb.select.mockReturnValue(mockChain);

      // テスト実行
      const result = await userService.getUserByEmail('test@example.com');

      // 検証
      expect(result).toEqual(testUser);
    });

    it('存在しないメールアドレスの場合nullを返す', async () => {
      // モックの戻り値設定（空配列）
      const mockChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
      mockDb.select.mockReturnValue(mockChain);

      // テスト実行
      const result = await userService.getUserByEmail('nonexistent@example.com');

      // 検証
      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    it('新規ユーザーを正常に作成できる', async () => {
      // getUserByIdのモック（重複チェック用）
      const mockSelectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]), // 空配列で重複なし
      };
      mockDb.select.mockReturnValue(mockSelectChain);

      // insertのモック
      const mockInsertChain = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ ...newUserData, ...testUser }]),
      };
      mockDb.insert.mockReturnValue(mockInsertChain);

      // テスト実行
      const result = await userService.createUser(newUserData);

      // 検証
      expect(result).toBeDefined();
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockInsertChain.values).toHaveBeenCalled();
      expect(mockInsertChain.returning).toHaveBeenCalled();
    });

    it('必須フィールドが不足している場合エラーを返す', async () => {
      // テスト実行と検証
      await expect(userService.createUser({ id: '', email: 'test@example.com' })).rejects.toThrow(
        'ユーザーIDとメールアドレスは必須です。'
      );

      await expect(userService.createUser({ id: 'test-id', email: '' })).rejects.toThrow(
        'ユーザーIDとメールアドレスは必須です。'
      );
    });

    it('無効なメールアドレス形式の場合エラーを返す', async () => {
      // テスト実行と検証
      await expect(
        userService.createUser({
          id: 'test-id',
          email: 'invalid-email',
        })
      ).rejects.toThrow('有効なメールアドレスを入力してください。');
    });

    it('既存ユーザーとIDが重複している場合エラーを返す', async () => {
      // getUserByIdのモック（重複ありの場合）
      const mockSelectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([testUser]), // 既存ユーザーあり
      };
      mockDb.select.mockReturnValue(mockSelectChain);

      // テスト実行と検証
      await expect(
        userService.createUser({
          id: testUser.id,
          email: 'different@example.com',
        })
      ).rejects.toThrow('このユーザーは既に登録されています。');
    });
  });

  describe('updateUser', () => {
    it('ユーザー情報を正常に更新できる', async () => {
      // getUserByIdのモック（存在確認用）
      const mockSelectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([testUser]),
      };
      mockDb.select.mockReturnValue(mockSelectChain);

      // updateのモック
      const updatedUser = { ...testUser, displayName: '更新されたユーザー' };
      const mockUpdateChain = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([updatedUser]),
      };
      mockDb.update.mockReturnValue(mockUpdateChain);

      // テスト実行
      const result = await userService.updateUser(testUser.id, {
        displayName: '更新されたユーザー',
      });

      // 検証
      expect(result.displayName).toBe('更新されたユーザー');
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('存在しないユーザーの更新でエラーを返す', async () => {
      // getUserByIdのモック（見つからない場合）
      const mockSelectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
      mockDb.select.mockReturnValue(mockSelectChain);

      // テスト実行と検証
      await expect(
        userService.updateUser('nonexistent-id', {
          displayName: '新しい名前',
        })
      ).rejects.toThrow('ユーザーが見つかりません。');
    });
  });

  describe('deleteUser', () => {
    it('ユーザーを正常に削除できる', async () => {
      // getUserByIdのモック（存在確認用）
      const mockSelectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([testUser]),
      };
      mockDb.select.mockReturnValue(mockSelectChain);

      // deleteのモック
      const mockDeleteChain = {
        where: vi.fn().mockResolvedValue(undefined),
      };
      mockDb.delete.mockReturnValue(mockDeleteChain);

      // テスト実行
      const result = await userService.deleteUser(testUser.id);

      // 検証
      expect(result).toBe(true);
      expect(mockDb.delete).toHaveBeenCalled();
    });

    it('存在しないユーザーの削除でエラーを返す', async () => {
      // getUserByIdのモック（見つからない場合）
      const mockSelectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
      mockDb.select.mockReturnValue(mockSelectChain);

      // テスト実行と検証
      await expect(userService.deleteUser('nonexistent-id')).rejects.toThrow(
        'ユーザーが見つかりません。'
      );
    });
  });

  describe('findOrCreateUser', () => {
    it('既存ユーザーが見つかった場合はそのユーザーを返す', async () => {
      // getUserByIdのモック（既存ユーザーあり）
      const mockSelectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([testUser]),
      };
      mockDb.select.mockReturnValue(mockSelectChain);

      // テスト実行
      const result = await userService.findOrCreateUser(
        testUser.id,
        testUser.email,
        testUser.displayName
      );

      // 検証
      expect(result).toEqual(testUser);
    });

    it('ユーザーが見つからない場合は新規作成する', async () => {
      // getUserByIdのモック（ユーザーなし）
      const mockSelectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
      mockDb.select.mockReturnValue(mockSelectChain);

      // insertのモック
      const mockInsertChain = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([newUserData]),
      };
      mockDb.insert.mockReturnValue(mockInsertChain);

      // テスト実行
      const result = await userService.findOrCreateUser(
        newUserData.id || 'test-id',
        newUserData.email,
        newUserData.displayName
      );

      // 検証
      expect(result).toBeDefined();
      expect(mockDb.insert).toHaveBeenCalled();
    });
  });
});
