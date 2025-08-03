/**
 * ユーザーサービス
 *
 * ユーザー関連のビジネスロジックを管理する。
 * 認証システム（Firebase）との連携、ユーザー情報の作成・更新・取得を担当。
 */
import { eq } from 'drizzle-orm';
import { type Database } from '../database/connection';
import { users, type User, type NewUser } from '../database/schema';
import { handleDatabaseError, getCurrentTimestamp } from '../utils/db';
import { createSecureLogger } from '../utils/logger';

/**
 * ビジネスロジックエラーかどうかを判定
 *
 * バリデーションエラーや存在確認エラーなど、
 * ビジネスルール由来のエラーを識別する。
 *
 * @param error - 判定対象のエラー
 * @returns ビジネスロジックエラーの場合true
 */
function isBusinessLogicError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message;
    return (
      message.includes('必須です') ||
      message.includes('見つかりません') ||
      message.includes('既に登録') ||
      message.includes('有効な')
    );
  }
  return false;
}

/**
 * ユーザーサービスクラス
 *
 * ユーザー関連の操作を一元管理する。
 * データベース操作、バリデーション、エラーハンドリングを含む。
 */
export class UserService {
  private logger: ReturnType<typeof createSecureLogger>;

  constructor(
    private db: Database,
    env: { ENVIRONMENT?: string }
  ) {
    this.logger = createSecureLogger(env);
  }

  /**
   * ユーザーをIDで取得
   *
   * Firebase UIDを使用してユーザー情報を取得する。
   * 認証後のAPIリクエストで使用される。
   *
   * @param userId - Firebase UID
   * @returns ユーザー情報またはnull（見つからない場合）
   */
  async getUserById(userId: string): Promise<User | null> {
    try {
      this.logger.log('🔍 UserService.getUserById: クエリ実行開始', {
        userId,
        query: 'SELECT * FROM users WHERE id = ? LIMIT 1',
      });

      const result = await this.db.select().from(users).where(eq(users.id, userId)).limit(1);

      this.logger.log('🔍 UserService.getUserById: クエリ実行結果', {
        userId,
        resultCount: result.length,
        resultPreview: result[0]
          ? {
              id: result[0].id,
              email: result[0].email,
              displayName: result[0].displayName,
            }
          : null,
      });

      return result[0] || null;
    } catch (error) {
      this.logger.error('❌ UserService.getUserById: エラー発生', error, {
        userId,
      });
      throw new Error(`ユーザー取得エラー: ${handleDatabaseError(error)}`);
    }
  }

  /**
   * メールアドレスでユーザーを取得
   *
   * Firebase認証と連携してユーザー存在確認に使用。
   * 重複登録の防止にも利用される。
   *
   * @param email - メールアドレス
   * @returns ユーザー情報またはnull（見つからない場合）
   */
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const result = await this.db.select().from(users).where(eq(users.email, email)).limit(1);

      return result[0] || null;
    } catch (error) {
      throw new Error(`ユーザー取得エラー: ${handleDatabaseError(error)}`);
    }
  }

  /**
   * 新規ユーザー作成
   *
   * Firebase認証成功後に呼び出される。
   * UIDとメールアドレスをデータベースに登録する。
   *
   * @param userData - ユーザー作成データ
   * @returns 作成されたユーザー情報
   */
  async createUser(userData: NewUser): Promise<User> {
    try {
      this.logger.log('🔄 UserService.createUser: 開始', {
        userData: {
          id: userData.id,
          email: userData.email,
          displayName: userData.displayName,
        },
      });

      // バリデーション：必須フィールドチェック
      if (!userData.id || !userData.email) {
        const error = 'ユーザーIDとメールアドレスは必須です。';
        this.logger.error('❌ UserService.createUser: バリデーションエラー', new Error(error));
        throw new Error(error);
      }

      // メールアドレス形式の簡易チェック
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        const error = '有効なメールアドレスを入力してください。';
        this.logger.error('❌ UserService.createUser: メールアドレス形式エラー', new Error(error), {
          email: userData.email,
        });
        throw new Error(error);
      }

      // 既存ユーザーの重複チェック
      this.logger.log('🔍 UserService.createUser: 重複チェック開始');
      const existingUser = await this.getUserById(userData.id);
      if (existingUser) {
        const error = 'このユーザーは既に登録されています。';
        this.logger.error('❌ UserService.createUser: 重複ユーザーエラー', new Error(error), {
          userId: userData.id,
          existingUser: {
            id: existingUser.id,
            email: existingUser.email,
          },
        });
        throw new Error(error);
      }

      // タイムスタンプ設定
      const now = getCurrentTimestamp();
      const newUserData: NewUser = {
        ...userData,
        createdAt: now,
        updatedAt: now,
      };

      this.logger.log('🔄 UserService.createUser: データベース挿入開始', {
        newUserData: {
          id: newUserData.id,
          email: newUserData.email,
          displayName: newUserData.displayName,
          createdAt: newUserData.createdAt,
          updatedAt: newUserData.updatedAt,
        },
        query: 'INSERT INTO users VALUES (...)',
      });

      // データベースに挿入
      const result = await this.db.insert(users).values(newUserData).returning();

      this.logger.log('✅ UserService.createUser: データベース挿入完了', {
        result: {
          id: result[0].id,
          email: result[0].email,
          displayName: result[0].displayName,
          createdAt: result[0].createdAt,
        },
      });

      return result[0];
    } catch (error) {
      this.logger.error('❌ UserService.createUser: エラー発生', error, {
        userData: {
          id: userData.id,
          email: userData.email,
          displayName: userData.displayName,
        },
        isBusinessLogicError: isBusinessLogicError(error),
      });

      // ビジネスロジックエラーはそのまま再スロー
      if (isBusinessLogicError(error)) {
        throw error;
      }
      // データベースエラーのみ変換
      throw new Error(`ユーザー作成エラー: ${handleDatabaseError(error)}`);
    }
  }

  /**
   * ユーザー情報更新
   *
   * 表示名やプロフィール情報の更新に使用。
   * 認証後のユーザーのみが実行可能。
   *
   * @param userId - 更新対象のユーザーID
   * @param updateData - 更新データ（部分更新）
   * @returns 更新されたユーザー情報
   */
  async updateUser(userId: string, updateData: Partial<Pick<User, 'displayName'>>): Promise<User> {
    try {
      // ユーザー存在確認
      const existingUser = await this.getUserById(userId);
      if (!existingUser) {
        throw new Error('ユーザーが見つかりません。');
      }

      // 更新データの準備
      const updatedData = {
        ...updateData,
        updatedAt: getCurrentTimestamp(),
      };

      // データベース更新
      const result = await this.db
        .update(users)
        .set(updatedData)
        .where(eq(users.id, userId))
        .returning();

      return result[0];
    } catch (error) {
      // ビジネスロジックエラーはそのまま再スロー
      if (isBusinessLogicError(error)) {
        throw error;
      }
      // データベースエラーのみ変換
      throw new Error(`ユーザー更新エラー: ${handleDatabaseError(error)}`);
    }
  }

  /**
   * ユーザー削除
   *
   * アカウント削除機能で使用。
   * 物理削除（CASCADE設定により関連TODOも削除される）。
   *
   * @param userId - 削除対象のユーザーID
   * @returns 削除成功の場合true
   */
  async deleteUser(userId: string): Promise<boolean> {
    try {
      // ユーザー存在確認
      const existingUser = await this.getUserById(userId);
      if (!existingUser) {
        throw new Error('ユーザーが見つかりません。');
      }

      // データベースから削除（CASCADE設定により関連TODOも自動削除）
      await this.db.delete(users).where(eq(users.id, userId));

      return true;
    } catch (error) {
      // ビジネスロジックエラーはそのまま再スロー
      if (isBusinessLogicError(error)) {
        throw error;
      }
      // データベースエラーのみ変換
      throw new Error(`ユーザー削除エラー: ${handleDatabaseError(error)}`);
    }
  }

  /**
   * Firebase認証連携用のユーザー作成または取得
   *
   * Firebase認証成功時に呼び出される統合メソッド。
   * 既存ユーザーは取得、新規ユーザーは作成する。
   *
   * @param firebaseUid - Firebase UID
   * @param email - メールアドレス
   * @param displayName - 表示名（任意）
   * @returns ユーザー情報
   */
  async findOrCreateUser(firebaseUid: string, email: string, displayName?: string): Promise<User> {
    try {
      this.logger.log('🔄 UserService.findOrCreateUser: 開始', {
        firebaseUid,
        email,
        displayName,
        timestamp: new Date().toISOString(),
      });

      // 既存ユーザーチェック
      this.logger.log('🔍 UserService.findOrCreateUser: 既存ユーザーチェック開始');
      let user = await this.getUserById(firebaseUid);

      this.logger.log('🔍 UserService.findOrCreateUser: 既存ユーザーチェック結果', {
        userFound: !!user,
        userId: user?.id || null,
        userEmail: user?.email || null,
        userDisplayName: user?.displayName || null,
      });

      if (user) {
        // 既存ユーザーの場合、表示名更新の必要性をチェック
        if (displayName && user.displayName !== displayName) {
          this.logger.log('🔄 UserService.findOrCreateUser: 表示名更新開始', {
            oldDisplayName: user.displayName,
            newDisplayName: displayName,
          });
          user = await this.updateUser(firebaseUid, { displayName });
          this.logger.log('✅ UserService.findOrCreateUser: 表示名更新完了');
        }

        this.logger.log('✅ UserService.findOrCreateUser: 既存ユーザー返却', {
          userId: user.id,
          email: user.email,
          displayName: user.displayName,
        });
        return user;
      }

      // 新規ユーザー作成
      this.logger.log('🔄 UserService.findOrCreateUser: 新規ユーザー作成開始', {
        firebaseUid,
        email,
        displayName,
      });

      const newUser = await this.createUser({
        id: firebaseUid,
        email,
        displayName,
      });

      this.logger.log('✅ UserService.findOrCreateUser: 新規ユーザー作成完了', {
        userId: newUser.id,
        email: newUser.email,
        displayName: newUser.displayName,
        createdAt: newUser.createdAt,
      });

      return newUser;
    } catch (error) {
      this.logger.error('❌ UserService.findOrCreateUser: エラー発生', error, {
        firebaseUid,
        email,
        displayName,
      });

      // 元のエラーの詳細を保持してより具体的なエラーメッセージを提供
      if (error instanceof Error) {
        throw new Error(`認証連携エラー [${error.constructor.name}]: ${error.message}`);
      }
      throw new Error(`認証連携エラー: ${handleDatabaseError(error)}`);
    }
  }
}
