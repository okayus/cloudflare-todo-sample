# ローカルD1データベース手動データ登録ガイド

## 📖 **概要**

Cloudflare D1ローカルデータベースに直接SQLを実行してユーザーとTODOタスクを登録し、ダッシュボードでの表示を確認する手順書です。

## 🎯 **目的**

- 認証システムが正常動作していることを確認
- TODO一覧表示機能が正常動作していることを確認
- フロントエンド・バックエンド・データベースの完全統合確認

## 📋 **前提条件**

- バックエンドサーバーが起動している（`pnpm run dev`）
- フロントエンドサーバーが起動している（`pnpm run dev`）
- Firebase認証でログイン済み
- D1データベースマイグレーションが完了している

## 🛠️ **実行手順**

### **Step 1: 現在のデータベース状況確認**

```bash
cd /home/okayu/dev/cloudflare-todo-sample/packages/backend

# usersテーブルの確認
wrangler d1 execute todo-app-db --local --command "SELECT * FROM users;"

# todosテーブルの確認  
wrangler d1 execute todo-app-db --local --command "SELECT * FROM todos;"
```

### **Step 2: 認証済みユーザーをデータベースに登録**

認証ログから確認されたFirebase UIDを使用してユーザーを登録：

```bash
wrangler d1 execute todo-app-db --local --command "
INSERT INTO users (id, email, display_name, created_at, updated_at) 
VALUES (
  'CAeQFPKsf9ZmHvgIA581VT1U9HR2', 
  'test@example.com', 
  'Test User',
  datetime('now'),
  datetime('now')
);"
```

### **Step 3: サンプルTODOタスクを登録**

複数のサンプルタスクを登録して、様々な状態をテスト：

```bash
# 完了済みタスク
wrangler d1 execute todo-app-db --local --command "
INSERT INTO todos (id, user_id, title, description, completed, due_date, slug, created_at, updated_at) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440001', 
  'CAeQFPKsf9ZmHvgIA581VT1U9HR2', 
  '朝の買い物', 
  '牛乳とパンを買う', 
  1, 
  '2025-07-27', 
  'morning-shopping',
  datetime('now'),
  datetime('now')
);"

# 未完了タスク1
wrangler d1 execute todo-app-db --local --command "
INSERT INTO todos (id, user_id, title, description, completed, due_date, slug, created_at, updated_at) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440002', 
  'CAeQFPKsf9ZmHvgIA581VT1U9HR2', 
  'レポート作成', 
  '月次レポートを完成させる', 
  0, 
  '2025-07-30', 
  'monthly-report',
  datetime('now'),
  datetime('now')
);"

# 未完了タスク2
wrangler d1 execute todo-app-db --local --command "
INSERT INTO todos (id, user_id, title, description, completed, due_date, slug, created_at, updated_at) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440003', 
  'CAeQFPKsf9ZmHvgIA581VT1U9HR2', 
  '医者の予約', 
  '定期健診の予約を取る', 
  0, 
  '2025-08-05', 
  'doctor-appointment',
  datetime('now'),
  datetime('now')
);"

# 期限過ぎタスク
wrangler d1 execute todo-app-db --local --command "
INSERT INTO todos (id, user_id, title, description, completed, due_date, slug, created_at, updated_at) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440004', 
  'CAeQFPKsf9ZmHvgIA581VT1U9HR2', 
  '年末掃除', 
  '部屋の大掃除', 
  0, 
  '2025-07-25', 
  'year-end-cleaning',
  datetime('now'),
  datetime('now')
);"
```

### **Step 4: データ登録確認**

```bash
# 登録されたユーザー確認
wrangler d1 execute todo-app-db --local --command "
SELECT id, email, display_name, created_at FROM users 
WHERE id = 'CAeQFPKsf9ZmHvgIA581VT1U9HR2';"

# 登録されたTODO確認
wrangler d1 execute todo-app-db --local --command "
SELECT id, title, completed, due_date, created_at 
FROM todos 
WHERE user_id = 'CAeQFPKsf9ZmHvgIA581VT1U9HR2' 
ORDER BY created_at DESC;"

# 統計情報確認
wrangler d1 execute todo-app-db --local --command "
SELECT 
  COUNT(*) as total_todos,
  SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed_todos,
  SUM(CASE WHEN completed = 0 THEN 1 ELSE 0 END) as pending_todos
FROM todos 
WHERE user_id = 'CAeQFPKsf9ZmHvgIA581VT1U9HR2';"
```

### **Step 5: ダッシュボードでの表示確認**

1. **ブラウザでダッシュボードにアクセス**
   ```
   http://localhost:5173/dashboard
   ```

2. **期待される表示内容**
   - **タスク一覧ヘッダー**: "タスク 4件"
   - **完了済みタスク**: "朝の買い物" ✅
   - **未完了タスク**: "レポート作成", "医者の予約", "年末掃除" ⏳
   - **期限状態**: 期限過ぎタスクが適切にハイライト

3. **確認ポイント**
   - Firebase JWT認証が正常動作
   - API呼び出しが200 OKで成功
   - TODOデータが正しく表示される
   - 完了・未完了状態が正しく表示される

## 🔍 **トラブルシューティング**

### **エラー1: FOREIGN KEY constraint failed**
```bash
# 原因: ユーザーが登録されていない
# 解決: Step 2を先に実行してユーザーを登録
```

### **エラー2: UNIQUE constraint failed: todos.slug**
```bash
# 原因: 同じスラッグが既に存在
# 解決: 異なるスラッグ名を使用するか既存データを削除
wrangler d1 execute todo-app-db --local --command "DELETE FROM todos WHERE slug = 'morning-shopping';"
```

### **エラー3: ダッシュボードに表示されない**
```bash
# 確認事項:
# 1. バックエンドサーバーが起動しているか
# 2. 認証ログでユーザーIDが一致しているか
# 3. ブラウザのNetworkタブでAPI呼び出しが成功しているか
```

## 📊 **サンプルデータ仕様**

| フィールド | 値 | 説明 |
|-----------|-----|------|
| user_id | CAeQFPKsf9ZmHvgIA581VT1U9HR2 | Firebase認証で確認されたUID |
| email | test@example.com | 認証済みメールアドレス |
| todos | 4件 | 完了1件、未完了3件 |
| 期限 | 過去・現在・未来 | 様々な期限状態をテスト |

## 🎯 **成功基準**

- ✅ D1データベースにユーザーとTODOが正常登録
- ✅ ダッシュボードに "タスク 4件" と表示
- ✅ 完了・未完了状態が正しく表示
- ✅ Firebase JWT認証が正常動作
- ✅ API GET /api/todos が 200 OK レスポンス

## 📝 **備考**

- このガイドは開発・テスト目的です
- 本番環境では適切なAPI経由でデータ登録してください
- ローカルD1データベースは開発環境専用です
- データリセットが必要な場合は `wrangler d1 execute todo-app-db --local --command "DELETE FROM todos; DELETE FROM users;"` を実行

---

**作成日**: 2025-07-27  
**目的**: ローカル開発環境でのデータベース動作確認  
**対象**: Firebase認証済みユーザーのTODO表示確認