# 開発者ガイド

**作成日**: 2025年7月28日  
**対象**: 新規参加開発者・コントリビューター  
**前提知識**: TypeScript・React・基本的なWeb開発経験  

## ガイド概要

このガイドは、Cloudflare Todo Sampleプロジェクトに新規参加する開発者向けのオンボーディング資料です。環境セットアップから開発フロー、デバッグ手法まで、実践的な内容を網羅しています。

### 🎯 このガイドで学べること
- プロジェクトの技術構成と設計思想
- 開発環境のセットアップ（step-by-step）
- 効率的な開発ワークフロー
- トラブルシューティング・デバッグ手法
- コントリビューション方法

## プロジェクト理解

### 技術スタック概要
```yaml
Architecture: フルスタック・サーバーレス
Frontend: React 18 + TypeScript + Vite + Tailwind CSS
Backend: Hono + TypeScript + Cloudflare Workers
Database: Cloudflare D1 (SQLite) + Drizzle ORM
Authentication: Firebase Authentication + JWT
Infrastructure: Cloudflare (Workers + Pages + D1 + KV)
Monorepo: pnpm workspace
CI/CD: GitHub Actions
```

### プロジェクト構造
```
cloudflare-todo-sample/
├── docs/                           # 📚 ドキュメント
│   ├── project-specification.md    # プロジェクト仕様書
│   ├── system-architecture.md      # システム構成書
│   ├── developer-guide.md          # このファイル
│   ├── api-specification.md        # API仕様書
│   ├── requirements.md             # 要件定義書
│   ├── system-design.md            # システム設計書
│   └── deployment-guide.md         # デプロイメントガイド
│
├── packages/                       # 📦 モノレポパッケージ
│   ├── frontend/                   # React フロントエンド
│   ├── backend/                    # Hono Workers バックエンド
│   └── shared/                     # 共通型定義・ユーティリティ
│
├── .github/                        # 🔄 CI/CD設定
│   └── workflows/
│       ├── ci.yml                  # 継続的インテグレーション
│       └── deploy.yml              # 継続的デプロイメント
│
├── pnpm-workspace.yaml            # モノレポ設定
├── CLAUDE.md                      # プロジェクト開発指針
└── README.md                      # プロジェクト概要
```

## 開発環境セットアップ

### 🔧 前提条件

#### 必須ツール
```bash
# Node.js (LTS推奨)
node --version  # v18.17.0+

# pnpm (パッケージマネージャー)
npm install -g pnpm
pnpm --version  # v8.0.0+

# Git
git --version  # v2.30.0+
```

#### 推奨ツール
```bash
# Cloudflare CLI (Wrangler)
npm install -g wrangler
wrangler --version  # v4.25.0+

# Visual Studio Code (推奨エディタ)
# 拡張機能:
# - TypeScript and JavaScript Language Features
# - ESLint
# - Prettier
# - Tailwind CSS IntelliSense
# - GitLens
```

### 📥 プロジェクトセットアップ

#### 1. リポジトリクローン
```bash
# プロジェクトクローン
git clone https://github.com/okayus/cloudflare-todo-sample.git
cd cloudflare-todo-sample

# ブランチ確認
git branch -a
git checkout main
```

#### 2. 依存関係インストール
```bash
# 全パッケージの依存関係インストール
pnpm install

# インストール確認
pnpm list --depth=0
```

#### 3. 環境変数設定

**Cloudflare設定 (Backend)**
```bash
# packages/backend/ で実行
cd packages/backend

# Cloudflareアカウントログイン
wrangler auth login

# アカウント情報確認
wrangler whoami
```

**Firebase設定 (Frontend)**
```bash
# packages/frontend/ で実行  
cd packages/frontend

# 環境変数ファイル作成
cp .env.example .env.local

# .env.local を編集 (Firebase設定値を入力)
```

#### 4. データベースセットアップ
```bash
# バックエンドディレクトリで実行
cd packages/backend

# D1データベース作成
wrangler d1 create todo-app-db

# マイグレーション実行
pnpm db:generate  # Drizzleスキーマ生成
pnpm db:migrate   # ローカルマイグレーション

# KVネームスペース作成
wrangler kv namespace create JWT_CACHE
wrangler kv namespace create JWT_CACHE --preview
```

#### 5. 設定ファイル更新
```jsonc
// packages/backend/wrangler.jsonc
{
  "d1_databases": [{
    "binding": "DB",
    "database_name": "todo-app-db",
    "database_id": "YOUR_DATABASE_ID_HERE"  // ← 手順4で取得したID
  }],
  "kv_namespaces": [{
    "binding": "JWT_CACHE", 
    "id": "YOUR_KV_NAMESPACE_ID_HERE",      // ← 手順4で取得したID
    "preview_id": "YOUR_PREVIEW_ID_HERE"    // ← 手順4で取得したID
  }]
}
```

### 🚀 開発サーバー起動

#### 並行開発環境
```bash
# ルートディレクトリで実行
pnpm dev

# または個別起動
pnpm --filter=backend dev      # http://localhost:8787
pnpm --filter=frontend dev     # http://localhost:5173
```

#### 動作確認
```bash
# Backend API確認
curl http://localhost:8787/health
# Expected: {"status":"ok","timestamp":"...","version":"1.0.0"}

# Frontend確認  
open http://localhost:5173
# Landing page表示確認
```

## 開発ワークフロー

### 🔄 Git Flow
```bash
# 1. Issue作成 (GitHub Web UI)
# 2. ブランチ作成
git checkout main
git pull origin main
git checkout -b feature/issue-XX-description

# 3. 開発作業
# ... コード変更 ...

# 4. コミット前チェック
pnpm lint        # ESLint
pnpm typecheck   # TypeScript
pnpm test        # Vitest

# 5. コミット
git add .
git commit -m "feat: 機能追加の説明

詳細な変更内容の説明

Closes #XX"

# 6. プッシュ・PR作成
git push -u origin feature/issue-XX-description
# GitHub Web UIでPull Request作成
```

### 🧪 テスト戦略

#### バックエンドテスト
```bash
# ユニットテスト実行
cd packages/backend
pnpm test

# カバレッジ確認
pnpm test:coverage

# 特定テストファイル実行
pnpm test src/services/__tests__/userService.test.ts

# ウォッチモード（開発時）
pnpm test:watch
```

#### フロントエンドテスト
```bash
# コンポーネントテスト実行
cd packages/frontend  
pnpm test

# E2Eテスト実行（Playwright）
pnpm test:browser

# テストUI（ブラウザ）
pnpm test:ui
```

#### 統合テスト
```bash
# 全パッケージテスト（ルートから）
pnpm test:all

# CI環境テスト再現
pnpm test:ci
```

### 🏗️ ビルド・デプロイ

#### ローカルビルド
```bash
# 個別ビルド
pnpm --filter=shared build    # 共通パッケージ（依存関係）
pnpm --filter=backend build   # Workers
pnpm --filter=frontend build  # React SPA

# 全パッケージビルド
pnpm build:all
```

#### 本番デプロイ
```bash
# 本番デプロイ（要注意）
cd packages/backend
wrangler deploy --env production

cd packages/frontend  
wrangler pages deploy dist --project-name=cloudflare-todo-sample-frontend
```

## コードベース詳細

### 📁 Backend (Hono + Workers)

#### ディレクトリ構造
```
packages/backend/src/
├── database/           # データベース関連
│   ├── connection.ts   # D1接続設定
│   └── schema.ts       # Drizzleスキーマ定義
├── endpoints/          # APIエンドポイント (OpenAPI)
│   ├── taskCreate.ts   # POST /api/todos
│   ├── taskList.ts     # GET /api/todos
│   ├── taskFetch.ts    # GET /api/todos/:slug
│   ├── taskUpdate.ts   # PUT /api/todos/:slug
│   └── taskDelete.ts   # DELETE /api/todos/:slug
├── middleware/         # ミドルウェア
│   └── auth.ts         # Firebase JWT認証
├── routes/             # ルート定義
│   └── auth.ts         # 認証関連ルート
├── services/           # ビジネスロジック
│   ├── userService.ts  # ユーザー管理
│   └── todoService.ts  # Todo管理
├── types/              # 型定義
│   └── firebase.ts     # Firebase関連型
├── utils/              # ユーティリティ
│   ├── auth.ts         # JWT検証・Firebase統合
│   └── db.ts           # データベースヘルパー
└── index.ts            # エントリーポイント
```

#### 主要設計パターン
```typescript
// 1. Chanfana (OpenAPI統合)
import { fromHono } from 'chanfana';
const openapi = fromHono(app, { docs_url: '/' });

// 2. Drizzle ORM (タイプセーフORM)
import { drizzle } from 'drizzle-orm/d1';
const db = drizzle(env.DB);

// 3. Zodバリデーション
import { z } from 'zod';
const TaskSchema = z.object({ ... });

// 4. Firebase JWT検証
import { verifyIdToken } from 'firebase-auth-cloudflare-workers';
```

### 📁 Frontend (React + TypeScript)

#### ディレクトリ構造
```
packages/frontend/src/
├── components/         # Reactコンポーネント
│   ├── AppRouter.tsx   # ルーティング設定
│   ├── Dashboard.tsx   # ダッシュボード画面
│   ├── TaskList.tsx    # タスク一覧
│   ├── LoginForm.tsx   # ログインフォーム
│   └── SignupForm.tsx  # サインアップフォーム
├── contexts/           # React Context
│   └── AuthContext.tsx # 認証状態管理
├── config/             # 設定
│   └── firebase.ts     # Firebase設定
├── utils/              # ユーティリティ
│   ├── api.ts          # API通信ヘルパー
│   └── todoApi.ts      # Todo API クライアント
├── __tests__/          # テストファイル
└── main.tsx            # エントリーポイント
```

#### 主要設計パターン
```typescript
// 1. React Context + useReducer
const AuthContext = createContext<AuthContextType>();

// 2. React Hook Form + Zod
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// 3. Firebase SDK v9+
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// 4. React Router v6+
import { BrowserRouter, Routes, Route } from 'react-router-dom';
```

### 📁 Shared (共通パッケージ)

#### 型定義・ユーティリティ
```typescript
// 共通型定義
export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Todo {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  completed: boolean;
  dueDate: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

// バリデーションスキーマ
export const TodoCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  dueDate: z.string().datetime()
});
```

## デバッグ・トラブルシューティング

### 🐛 よくある問題と解決方法

#### 1. 認証エラー
```bash
# 問題: Firebase JWT検証失敗
Error: Authentication failed, invalid token

# 解決手順:
1. Firebase設定確認
2. JWT Tokenの形式確認 (3つの部分: Header.Payload.Signature)
3. KV Namespace設定確認
4. wrangler tailでリアルタイムログ確認

# デバッグコマンド
wrangler tail backend --format pretty
```

#### 2. データベース接続エラー
```bash
# 問題: D1データベース接続失敗
Error: D1_ERROR: database not found

# 解決手順:
1. wrangler.jsonc のdatabase_id確認
2. D1データベース存在確認
3. マイグレーション実行状況確認

# 確認コマンド
wrangler d1 list
wrangler d1 execute todo-app-db --command "SELECT name FROM sqlite_master WHERE type='table';"
```

#### 3. CORS エラー
```bash
# 問題: フロントエンドからAPI呼び出し失敗
Access to fetch blocked by CORS policy

# 解決手順:
1. Backend index.tsのCORS設定確認
2. フロントエンドのAPI_BASE_URL確認
3. 開発サーバーURL確認

# 設定確認
grep -n "cors" packages/backend/src/index.ts
```

#### 4. ビルドエラー
```bash
# 問題: TypeScriptコンパイルエラー
Type error: Property 'xxx' does not exist

# 解決手順:
1. 型定義確認・更新
2. 依存関係の再インストール
3. TypeScriptキャッシュクリア

# 修復コマンド
pnpm install
rm -rf node_modules/.cache
pnpm typecheck
```

### 🔍 デバッグツール

#### Wrangler Tail (リアルタイムログ)
```bash
# 基本使用法
wrangler tail backend

# フィルタリング
wrangler tail backend --format json | jq '.logs[]'
wrangler tail backend | grep "ERROR"

# 特定ユーザーのリクエストのみ
wrangler tail backend | grep "user_id: firebase-uid-here"
```

#### D1 Database探索
```bash
# テーブル構造確認
wrangler d1 execute todo-app-db --command "PRAGMA table_info(users);"
wrangler d1 execute todo-app-db --command "PRAGMA table_info(todos);"

# データ確認
wrangler d1 execute todo-app-db --command "SELECT COUNT(*) FROM users;"
wrangler d1 execute todo-app-db --command "SELECT * FROM todos LIMIT 5;"

# インデックス確認
wrangler d1 execute todo-app-db --command "PRAGMA index_list(todos);"
```

#### KV Store確認
```bash
# KV Namespace一覧
wrangler kv namespace list

# キー一覧確認
wrangler kv key list --namespace-id a9500f6c3127441b94e29a15f4fa7bb0

# 値取得
wrangler kv key get "firebase-jwk-cache" --namespace-id a9500f6c3127441b94e29a15f4fa7bb0
```

### 📊 パフォーマンス分析

#### Workers Analytics
```bash
# Analytics確認（Web UI）
# https://dash.cloudflare.com > Workers & Pages > backend > Analytics

# 確認項目:
- Request Rate (req/min)
- Response Time (P50, P95, P99)
- Error Rate (4xx, 5xx)
- CPU Time (ms/request)
```

#### ローカルパフォーマンス測定
```bash
# API応答時間測定
time curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:8787/api/todos

# 並行リクエストテスト
ab -n 100 -c 10 http://localhost:8787/health
```

## コントリビューション方法

### 🤝 プルリクエストプロセス

#### 1. Issue作成・確認
```markdown
# Good Issue Example
Title: タスク検索機能の追加

## 概要
タスクタイトル・説明文での全文検索機能を追加

## 実装方針
- GET /api/todos?search=query パラメータ追加
- SQLite LIKE検索実装
- フロントエンドに検索フォーム追加

## 受け入れ基準
- [ ] APIで検索クエリを受け付け
- [ ] 大文字小文字を無視した部分一致検索
- [ ] フロントエンドに検索UI実装
- [ ] テストケース追加
```

#### 2. コード品質チェック
```bash
# プルリクエスト前の必須チェック
pnpm lint:fix      # ESLint自動修正
pnpm typecheck     # TypeScript型チェック
pnpm test          # 全テスト実行
pnpm build:all     # ビルド確認
```

#### 3. コミットメッセージ規約
```bash
# Conventional Commits準拠
# 形式: <type>(<scope>): <description>

# Examples:
feat(api): タスク検索エンドポイント追加
fix(auth): JWT検証時のエラーハンドリング修正
docs(readme): セットアップ手順を更新
refactor(ui): タスクリストコンポーネント分割
test(backend): userService のテストケース追加
```

### 🎨 コーディング規約

#### TypeScript
```typescript
// Good: 明示的な型定義
interface CreateTodoRequest {
  title: string;
  description?: string;
  dueDate: string;
}

// Bad: any型の使用
function handleRequest(data: any) { ... }

// Good: 適切なエラーハンドリング
try {
  const result = await todoService.create(data);
  return c.json({ success: true, data: result });
} catch (error) {
  return c.json({ 
    success: false, 
    error: handleDatabaseError(error)
  }, 400);
}
```

#### React
```tsx
// Good: 関数型コンポーネント + TypeScript
interface TaskItemProps {
  task: Todo;
  onToggle: (taskId: string) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle }) => {
  const handleClick = useCallback(() => {
    onToggle(task.id);
  }, [task.id, onToggle]);

  return (
    <div className="task-item" onClick={handleClick}>
      <h3>{task.title}</h3>
      <p>{task.description}</p>
    </div>
  );
};
```

#### CSS (Tailwind)
```tsx
// Good: セマンティッククラス・レスポンシブ対応
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
    <h2 className="text-xl font-semibold text-gray-800 mb-2">
      Task Title
    </h2>
  </div>
</div>

// Bad: インラインスタイル・Magic Number
<div style={{ width: '300px', height: '200px', background: '#ffffff' }}>
```

### 📝 ドキュメント貢献

#### ドキュメント更新指針
```markdown
1. **正確性**: 実装と完全に一致する内容
2. **実用性**: 実際の作業で使える具体的な情報
3. **完全性**: 初心者でも理解できる詳細レベル
4. **最新性**: 依存関係・設定の最新版対応
```

#### README・APIドキュメント
```markdown
# Good Documentation Example

## API Endpoint: タスク作成

### Request
```http
POST /api/todos
Content-Type: application/json
Authorization: Bearer <firebase-jwt-token>

{
  "title": "新しいタスク",
  "description": "タスクの説明（任意）",
  "dueDate": "2024-12-25T10:00:00.000Z"
}
```

### Response
```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "success": true,
  "data": {
    "todo": {
      "id": "uuid-here",
      "title": "新しいタスク",
      "slug": "new-task-20241225",
      ...
    }
  }
}
```

### Error Cases
- `400 Bad Request`: バリデーションエラー
- `401 Unauthorized`: 認証エラー
- `500 Internal Server Error`: サーバーエラー
```

## 学習リソース

### 📚 公式ドキュメント
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Hono Framework](https://hono.dev/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [React Documentation](https://react.dev/)
- [Firebase Auth](https://firebase.google.com/docs/auth)

### 🎯 関連プロジェクト
- [Hono + Cloudflare Workers Examples](https://github.com/honojs/examples)
- [Drizzle ORM Examples](https://github.com/drizzle-team/drizzle-orm/tree/main/examples)
- [React TypeScript Examples](https://github.com/typescript-cheatsheets/react)

### 🔧 開発ツール習得
- [VSCode Extensions for TypeScript](https://code.visualstudio.com/docs/languages/typescript)
- [Wrangler CLI Guide](https://developers.cloudflare.com/workers/wrangler/)
- [pnpm Workspace Guide](https://pnpm.io/workspaces)

## サポート・コミュニティ

### 💬 質問・相談
- **GitHub Issues**: バグ報告・機能要望
- **GitHub Discussions**: 技術的な質問・議論
- **Code Review**: プルリクエストでのコードレビュー

### 🚀 今後の学習パス
1. **Phase 1**: 基本的なCRUD操作の理解
2. **Phase 2**: 認証フロー・セキュリティの理解
3. **Phase 3**: パフォーマンス最適化・監視
4. **Phase 4**: 高度な機能実装（リアルタイム同期等）
5. **Phase 5**: インフラ・スケーリング戦略

---

**ガイド作成者**: 学習プロジェクト開発者  
**最終更新**: 2025年7月28日  
**次回更新**: 新機能追加・フィードバック反映時