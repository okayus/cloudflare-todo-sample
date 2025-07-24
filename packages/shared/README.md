# @cloudflare-todo-sample/shared

共通型定義とユーティリティパッケージ

## 概要

このパッケージは、Cloudflare Todo Sampleアプリケーションのバックエンドとフロントエンドで共通利用される型定義、バリデーション関数、ユーティリティ関数を提供します。

## 特徴

- **型安全性**: TypeScript strict modeによる厳密な型チェック
- **バリデーション**: Zodを使用した堅牢なデータ検証
- **共通化**: バックエンド・フロントエンド間でのコード重複排除
- **保守性**: 一元管理による型定義の整合性確保

## インストール

```bash
# モノレポ内での参照
pnpm add @cloudflare-todo-sample/shared

# 開発依存関係
pnpm install
```

## 使用方法

### 型定義の利用

```typescript
import { User, Todo, CreateTodo, ApiResponse } from '@cloudflare-todo-sample/shared';

// ユーザー情報の型注釈
const user: User = {
  id: 'firebase-uid-123',
  email: 'user@example.com',
  displayName: 'John Doe',
};

// TODO作成時の型注釈
const newTodo: CreateTodo = {
  title: 'サンプルタスク',
  description: 'タスクの説明',
  dueDate: '2024-12-31T23:59:59.000Z',
  completed: false,
};
```

### バリデーション

```typescript
import { validateData, TodoSchema } from '@cloudflare-todo-sample/shared';

// データのバリデーション
const result = validateData(TodoSchema, userData);
if (result.success) {
  console.log('バリデーション成功:', result.data);
} else {
  console.log('バリデーションエラー:', result.errors);
}
```

### 日付ユーティリティ

```typescript
import { 
  getCurrentISOString, 
  formatDateString, 
  getDueDateInfo 
} from '@cloudflare-todo-sample/shared';

// 現在時刻の取得
const now = getCurrentISOString();

// 日付のフォーマット
const formatted = formatDateString('2024-12-31T23:59:59.000Z', {
  includeTime: true,
  locale: 'ja-JP'
});

// 期限情報の取得
const dueDateInfo = getDueDateInfo('2024-12-31T23:59:59.000Z');
console.log(dueDateInfo.statusText); // "あと7日"
```

## 型定義

### User関連

- `User`: ユーザー情報の完全な型
- `CreateUser`: ユーザー作成用の型
- `UpdateUser`: ユーザー更新用の型
- `AuthenticatedUser`: 認証済みユーザー情報の型

### Todo関連

- `Todo`: TODO項目の完全な型
- `CreateTodo`: TODO作成用の型
- `UpdateTodo`: TODO更新用の型
- `TodoFilters`: フィルタリング条件の型
- `TodoSort`: ソート条件の型
- `Pagination`: ページネーション設定の型

### API関連

- `ApiResponse<T>`: 基本的なAPIレスポンスの型
- `PaginatedResponse<T>`: ページネーション付きレスポンスの型
- `AuthVerifyResponse`: 認証検証レスポンスの型
- `ErrorResponse`: エラーレスポンスの型

## ユーティリティ関数

### バリデーション

- `validateData()`: Zodスキーマによるデータ検証
- `safeParse()`: 安全なデータパース
- `formatValidationErrors()`: エラーメッセージのフォーマット

### 日付・時刻

- `getCurrentISOString()`: 現在時刻のISO形式取得
- `formatDateString()`: 日付の人間可読形式変換
- `getRelativeTimeString()`: 相対時間の表示
- `getDueDateInfo()`: 期限情報の計算

## 定数

### API関連
- `API_VERSION`: APIバージョン情報
- `ApiEndpoints`: エンドポイントパス定数

### バリデーション関連
- `VALIDATION`: 文字数制限等の定数
- `PAGINATION`: ページネーション設定

### エラーメッセージ
- `ERROR_MESSAGES`: 標準エラーメッセージ
- `SUCCESS_MESSAGES`: 成功メッセージ

## 開発

### ビルド

```bash
pnpm build
```

### 型チェック

```bash
pnpm typecheck
```

### リンター

```bash
pnpm lint
pnpm lint:fix
```

### テスト

```bash
pnpm test
pnpm test:coverage
```

## ライセンス

MIT