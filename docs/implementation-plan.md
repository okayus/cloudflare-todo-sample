# 実装計画書

## 📋 実装概要

本計画書は、Cloudflare Todo Sampleアプリケーションの段階的実装手順を定義します。  
TDD（テスト駆動開発）とOpenAPIスキーマ駆動開発を実践し、品質の高いアプリケーションを構築します。

## 🎯 実装目標

- [x] **Phase 1**: プロジェクト基盤整備 ✅
- [ ] **Phase 2**: バックエンド完全実装
- [ ] **Phase 3**: 共通パッケージ・フロントエンド実装  
- [ ] **Phase 4**: テスト・CI/CD実装
- [ ] **Phase 5**: デプロイ・運用

## 📅 Phase 1: プロジェクト基盤整備

### ✅ 1.1 設計ドキュメント整備
- [x] 要件定義書作成
- [x] システム設計書作成（ER図、シーケンス図含む）
- [x] API仕様書作成（OpenAPI準拠）  
- [x] 実装計画書作成（本ドキュメント）

### 🔄 1.2 GitHubリポジトリ初期化
- [ ] GitHubリポジトリ作成
- [ ] 初期コミット・プッシュ
- [ ] ブランチ保護設定（main）
- [ ] Issue・PR テンプレート作成

**実装手順:**
```bash
# 1. GitHub CLI でリポジトリ作成
gh repo create cloudflare-todo-sample --public --description "学習用ToDoアプリ（Cloudflare + React + Firebase）"

# 2. リモートリポジトリ設定
git remote add origin https://github.com/[username]/cloudflare-todo-sample.git

# 3. 初期コミット・プッシュ
git add .
git commit -m "🎉 Initial commit: Project setup with backend API structure

📝 Setup complete:
- Backend: Hono + TypeScript + Zod + Chanfana (OpenAPI)
- Monorepo: pnpm workspace configuration
- Docs: Requirements, system design, API specification, implementation plan
- MCP: Cloudflare documentation and workers bindings integration

🎯 Next: Initialize GitHub repository and implement database layer

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

git push -u origin main

# 4. ブランチ保護設定（GitHub Web UIまたはAPI）
```

## 📅 Phase 2: バックエンド完全実装

### 🔄 2.1 Cloudflareリソース設定
- [ ] Cloudflare D1データベース作成
- [ ] Cloudflare KVネームスペース作成（JWT公開鍵キャッシュ用）
- [ ] Workers Secrets設定（Firebase設定）
- [ ] wrangler.jsonc更新（バインディング追加）

**実装手順:**
```bash
# 1. D1データベース作成
wrangler d1 create todo-app-db

# 2. KVネームスペース作成
wrangler kv:namespace create "JWT_CACHE"

# 3. wrangler.jsonc更新
# [[d1_databases]]、[[kv_namespaces]]セクション追加

# 4. Firebase設定（Secrets設定）
wrangler secret put FIREBASE_PROJECT_ID
wrangler secret put FIREBASE_CLIENT_EMAIL
```

### 🔄 2.2 データベース設計・実装
- [ ] Drizzle ORM依存関係追加
- [ ] スキーマ定義（users、todos テーブル）
- [ ] マイグレーションファイル作成
- [ ] データベース初期化スクリプト作成

**実装手順:**
```bash
# 1. 依存関係追加
cd packages/backend
pnpm add drizzle-orm drizzle-kit @cloudflare/d1

# 2. Drizzleスキーマファイル作成
# src/database/schema.ts

# 3. マイグレーション生成
npx drizzle-kit generate:sqlite

# 4. マイグレーション適用
wrangler d1 migrations apply todo-app-db --local
wrangler d1 migrations apply todo-app-db
```

**ファイル構成:**
```
packages/backend/src/
├── database/
│   ├── schema.ts           # Drizzleスキーマ定義
│   ├── migrations/         # マイグレーションファイル
│   └── connection.ts       # DB接続設定
├── middleware/
│   ├── auth.ts            # JWT認証ミドルウェア
│   ├── cors.ts            # CORS設定
│   └── errorHandler.ts    # エラーハンドリング
├── services/
│   ├── authService.ts     # 認証ロジック
│   ├── todoService.ts     # Todo操作ロジック
│   └── userService.ts     # ユーザー操作ロジック
└── utils/
    ├── jwt.ts             # JWT検証ユーティリティ
    ├── validator.ts       # バリデーション
    └── logger.ts          # ログ出力
```

### 🔄 2.3 Firebase Authentication統合
- [ ] Firebase JWT検証ライブラリ選定・追加
- [ ] JWT検証ミドルウェア実装
- [ ] 認証エンドポイント追加（`POST /api/auth/verify`）
- [ ] ユーザー管理サービス実装

**実装手順:**
```typescript
// 1. JWT検証ライブラリ追加
pnpm add jose  // Cloudflare Workers対応JWT検証ライブラリ

// 2. 認証ミドルウェア実装例
export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: '認証が必要です' } }, 401);
  }
  
  const token = authHeader.substring(7);
  const user = await verifyFirebaseJWT(token, c.env);
  
  c.set('user', user);
  await next();
}

// 3. JWT検証実装
async function verifyFirebaseJWT(token: string, env: Env) {
  // Firebase公開鍵キャッシュからの検証
  // KV Storeを使用したキャッシュ実装
}
```

### 🔄 2.4 CRUD機能実装  
- [ ] 既存エンドポイントをデータベース操作に修正
- [ ] エラーハンドリング強化
- [ ] バリデーション詳細化
- [ ] ページネーション実装

**実装対象エンドポイント:**
1. `GET /api/todos` - タスク一覧取得（フィルタ・ソート・ページネーション）
2. `POST /api/todos` - タスク作成
3. `GET /api/todos/:slug` - タスク詳細取得
4. `PUT /api/todos/:slug` - タスク更新
5. `DELETE /api/todos/:slug` - タスク削除（論理削除）
6. `POST /api/auth/verify` - 認証確認・ユーザー情報取得

**実装順序:**
1. 認証機能 → 2. ユーザー管理 → 3. Todo作成 → 4. Todo取得 → 5. Todo更新 → 6. Todo削除

## 📅 Phase 3: 共通パッケージ・フロントエンド実装

### 🔄 3.1 packages/shared作成
- [ ] 共通型定義（APIレスポンス、エラー型など）
- [ ] API型定義（OpenAPI仕様との一致確認）
- [ ] ユーティリティ関数（日付操作、バリデーションなど）
- [ ] 定数定義

**ファイル構成:**
```
packages/shared/src/
├── types/
│   ├── api.ts             # APIレスポンス型
│   ├── todo.ts            # Todo関連型
│   ├── user.ts            # User関連型
│   └── common.ts          # 共通型（ページネーション等）
├── utils/
│   ├── date.ts            # 日付操作
│   ├── validation.ts      # バリデーション
│   └── formatter.ts       # フォーマッタ
├── constants/
│   ├── api.ts             # APIエンドポイント
│   ├── config.ts          # 設定値
│   └── messages.ts        # メッセージ定数
└── index.ts               # エクスポート
```

### 🔄 3.2 packages/frontend作成
- [ ] Vite + React + TypeScript環境構築
- [ ] Tailwind CSS設定
- [ ] React Router設定
- [ ] Firebase SDK設定
- [ ] 基本レイアウト・コンポーネント実装

**実装手順:**
```bash
# 1. フロントエンド環境構築
cd packages
npm create vite@latest frontend -- --template react-ts

# 2. 依存関係追加
cd frontend
pnpm add react-router-dom firebase @shared tailwindcss
pnpm add -D @types/react-router-dom autoprefixer postcss

# 3. Tailwind CSS初期化
npx tailwindcss init -p

# 4. Firebase設定
# src/config/firebase.ts
```

**コンポーネント実装順序:**
1. **認証UI**: Login、Register、AuthLayout
2. **レイアウト**: Header、Sidebar、MainLayout
3. **Todo UI**: TodoList、TodoItem、TodoForm、TodoDetail
4. **共通UI**: Loading、ErrorBoundary、Modal

### 🔄 3.3 認証UI実装
- [ ] ログインページ
- [ ] ユーザー登録ページ
- [ ] 認証コンテキスト（React Context）
- [ ] ProtectedRoute実装

### 🔄 3.4 Todo UI実装
- [ ] ダッシュボードページ
- [ ] Todoリストページ（フィルタ・ソート・ページネーション）
- [ ] Todo作成・編集フォーム
- [ ] Todo詳細ページ

## 📅 Phase 4: テスト・CI/CD実装

### 🔄 4.1 テスト実装（TDD）
- [ ] バックエンドユニットテスト（Vitest）
  - 認証ミドルウェアテスト
  - Todoサービステスト  
  - APIエンドポイントテスト
- [ ] フロントエンドコンポーネントテスト
  - React Testing Library
  - コンポーネント単体テスト
- [ ] E2Eテスト（Playwright）
  - ログイン・ログアウトフロー
  - Todo CRUD フロー

**実装手順:**
```bash
# 1. バックエンドテストセットアップ
cd packages/backend
pnpm add -D vitest @vitest/ui c8

# 2. フロントエンドテストセットアップ
cd packages/frontend  
pnpm add -D vitest jsdom @testing-library/react @testing-library/jest-dom

# 3. E2Eテストセットアップ
pnpm add -D playwright @playwright/test

# 4. テスト実行スクリプト追加
# package.json の scripts セクション
```

### 🔄 4.2 GitHub Actions CI/CD
- [ ] Lint・TypeCheck・Test自動実行
- [ ] 自動デプロイ設定（Cloudflare Workers + Pages）
- [ ] コード品質チェック（ESLint、Prettier）
- [ ] セキュリティチェック

**GitHub Actions ワークフロー:**
```yaml
# .github/workflows/ci.yml
# .github/workflows/deploy.yml
```

## 📅 Phase 5: デプロイ・運用

### 🔄 5.1 Cloudflareデプロイ
- [ ] Workers デプロイ（バックエンドAPI）
- [ ] Pages デプロイ（フロントエンド）
- [ ] カスタムドメイン設定
- [ ] SSL・セキュリティ設定

### 🔄 5.2 ドキュメント最終化
- [ ] README更新（セットアップ手順、使い方）
- [ ] 運用マニュアル作成
- [ ] トラブルシューティングガイド
- [ ] API仕様書最終確認

## 🔧 開発ルール・規約

### コーディング規約
- **TypeScript strict mode**: `any`型使用禁止
- **JSDoc**: 全関数・クラスに日本語コメント必須
- **変数・関数名**: なぜそうしたかの理由をコメントで説明
- **コミット前チェック**: typecheck + test + lint 実行必須

### Git運用ルール  
- **ブランチ**: `feature/issue-番号-機能名` 形式
- **コミット**: Conventional Commits準拠
- **PR**: 必ずissueと紐づけ
- **レビュー**: 自己レビュー必須

### TDD開発フロー
1. **Red**: 失敗するテストを先に書く
2. **Green**: テストが通る最小限の実装
3. **Refactor**: コードの改善・リファクタリング

### OpenAPIスキーマ駆動開発
1. **Schema First**: API仕様書を先に定義
2. **Code Generation**: スキーマから型定義生成  
3. **Validation**: リクエスト・レスポンスの自動バリデーション

## 📊 進捗管理

### マイルストーン
- **Week 1**: Phase 1-2 完了（バックエンド実装）
- **Week 2**: Phase 3 完了（フロントエンド実装）
- **Week 3**: Phase 4 完了（テスト・CI/CD）
- **Week 4**: Phase 5 完了（デプロイ・運用）

### チェックリスト更新ルール
- 作業開始時: 該当項目を「🔄 進行中」に変更
- 完了時: 該当項目を「✅ 完了」に変更  
- 計画変更時: 本ドキュメントを更新してコミット

---

**最終更新**: 2024年1月1日  
**次回更新予定**: Phase 2 完了時