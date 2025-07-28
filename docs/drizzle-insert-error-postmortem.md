# Drizzle ORM INSERT Query Parameter Mismatch - ポストモーテム

## 事象概要

**発生日時**: 2025-07-27 12:20-12:30 (JST)  
**影響範囲**: 新規ユーザーのタスク作成機能  
**症状**: TODO作成時に500エラー、Drizzle ORM INSERTクエリでパラメータ数不一致  

## 問題の詳細

### エラーメッセージ
```
Failed query: insert into "todos" ("id", "user_id", "title", "description", "completed", "due_date", "created_at", "updated_at", "deleted_at", "slug") values (?, ?, ?, ?, ?, ?, ?, ?, null, ?) returning ...
params: id,userId,title,description,0,dueDate,createdAt,updatedAt,task
```

### 根本原因
1. **SQLクエリとパラメータ数の不一致**
   - SQLクエリ: 10個のプレースホルダー(`?`)
   - 実際のパラメータ: 9個
   - `deleted_at`フィールドが`null`として直接SQLに埋め込まれ、パラメータカウントから除外された

2. **Drizzle ORMの動作理解不足**
   - `undefined`値の扱い方
   - フィールドの省略とデフォルト値の関係
   - スキーマ定義の`$defaultFn(() => null)`の実際の動作

## 試行した解決策と結果

### ❌ 試行1: `deletedAt`フィールドを完全削除
```typescript
const newTodoData: NewTodo = {
  // deletedAt フィールドを含めない
};
```
**結果**: Drizzle ORMが`undefined`を空文字として扱い、パラメータ不一致継続

### ❌ 試行2: スキーマ定義に`$defaultFn(() => null)`追加
```typescript
deletedAt: text('deleted_at').$defaultFn(() => null),
```
**結果**: 改善されず、同じパラメータ不一致エラー

### ❌ 試行3: 明示的に`null`を設定
```typescript
deletedAt: null,
```
**結果**: Drizzle ORMが依然として空文字として処理

### 🔄 試行4: フィールド順序の調整
```typescript
const newTodoData: NewTodo = {
  id: generateId(),
  userId,
  title: todoData.title.trim(),
  description: todoData.description?.trim() || null,
  completed: todoData.completed || false,
  dueDate: normalizeDate(todoData.dueDate),
  createdAt: now,
  updatedAt: now,
  deletedAt: null,  // スキーマ定義順序に合わせて配置
  slug,
};
```
**結果**: 調査継続中

## 技術的詳細

### エラーログ分析
```bash
# SQLクエリ構造
insert into "todos" 
("id", "user_id", "title", "description", "completed", "due_date", "created_at", "updated_at", "deleted_at", "slug") 
values (?, ?, ?, ?, ?, ?, ?, ?, null, ?)

# 実際のパラメータ（9個）
params: uuid,userId,title,description,0,date,timestamp,timestamp,slug
```

### 学習ポイント
1. **Drizzle ORMの挙動**
   - `undefined`値は空文字として処理される
   - `null`値も期待通りにパラメータ化されない場合がある
   - スキーマ定義の順序とオブジェクトの順序の一致の重要性

2. **デバッグプロセス**
   - SQLログの詳細分析が問題特定に重要
   - パラメータ数とプレースホルダー数の不一致パターン認識

## 影響と対応

### 影響
- 新規Firebase認証ユーザーがタスクを作成できない
- 認証機能とユーザー自動登録は正常動作
- 既存ユーザーへの影響なし（該当ユーザーが存在しないため）

### 一時対応
- 問題調査中のため、新規ユーザーへの案内準備

### 恒久対応
- Drizzle ORM INSERT処理の修正
- パラメータとスキーマの整合性確保
- テストケース追加（新規ユーザーフロー）

## 予防策

### 1. 開発プロセス改善
- [ ] Drizzle ORM使用時のフィールド順序チェックリスト作成
- [ ] NULL値扱いのテストケース追加
- [ ] INSERT操作の統合テスト強化

### 2. 監視・アラート
- [ ] データベースINSERTエラーの監視強化
- [ ] 新規ユーザー登録後のタスク作成成功率監視

### 3. ドキュメント
- [ ] Drizzle ORMベストプラクティス文書化
- [ ] スキーマ変更時のチェックポイント明文化

## 関連リソース

### コードファイル
- `packages/backend/src/services/todoService.ts:252-263`
- `packages/backend/src/database/schema.ts:87`
- `packages/backend/src/middleware/auth.ts:121-125`

### ログファイル
- `packages/backend/wrangler.log:378-395, 530-547, 654-671, 807-824`

### 関連Issue/PR
- Drizzle ORM INSERT parameter mismatch investigation

---

**作成者**: Claude Code Assistant  
**最終更新**: 2025-07-27 12:30 JST  
**ステータス**: 調査継続中