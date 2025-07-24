# 実装計画書

## 📋 実装概要

本計画書は、Cloudflare Todo Sampleアプリケーションの段階的実装手順を定義します。  
TDD（テスト駆動開発）とOpenAPIスキーマ駆動開発を実践し、品質の高いアプリケーションを構築します。

## 🎯 実装目標

- [x] **Phase 1**: プロジェクト基盤整備 ✅
- [x] **Phase 1.5**: Cloudflareリソース設定 ✅
- [x] **Phase 2**: CIパイプライン構築 ✅ **CDパイプラインは未実装**
- [x] **Phase 3**: データベース実装・CRUD操作 ✅
- [x] **Phase 3.2**: Firebase Authentication統合 ✅ **【完了】**
- [ ] **Phase 4**: 共通パッケージ・フロントエンド実装 🔄 **【次期実装】**
- [ ] **Phase 5**: デプロイ・運用

## ⚠️ 実装順序変更について

**2025年7月22日更新**: 開発品質を最優先し、CI/CDパイプライン構築を前倒し実装することに決定。

**変更理由:**
- ✅ **品質保証**: 全ての後続コード変更が自動テスト・リントを通過
- ✅ **開発効率**: 手動デプロイ・テスト作業の自動化で開発スピード向上
- ✅ **学習価値**: プロダクション開発プロセスの早期体験
- ✅ **デプロイ安全性**: 本番環境の一貫性とロールバック対応

## 📅 Phase 1: プロジェクト基盤整備

### ✅ 1.1 設計ドキュメント整備
- [x] 要件定義書作成
- [x] システム設計書作成（ER図、シーケンス図含む）
- [x] API仕様書作成（OpenAPI準拠）  
- [x] 実装計画書作成（本ドキュメント）

### ✅ 1.2 GitHubリポジトリ初期化
- [x] GitHubリポジトリ作成
- [x] 初期コミット・プッシュ
- [x] ブランチ保護設定（main）
- [ ] Issue・PR テンプレート作成

## 📅 Phase 1.5: Cloudflareリソース設定 ✅

### ✅ 1.5.1 Cloudflareリソース設定
- [x] Cloudflare D1データベース作成（`todo-app-db`）
- [x] Cloudflare KVネームスペース作成（JWT公開鍵キャッシュ用）
- [x] wrangler.jsonc更新（バインディング追加）
- [x] TypeScript型定義更新（`wrangler types`）
- [x] Firebase設定手順をREADMEに記載

**完了済みリソース:**
```bash
# D1データベース
Database ID: 07aab756-fe4a-4042-9e12-177b680ed67d
Binding: DB

# KVネームスペース
Production ID: a9500f6c3127441b94e29a15f4fa7bb0  
Preview ID: 4d9b8ee3bfb04fbb92f9fb1c09adc173
Binding: JWT_CACHE
```

## 📅 Phase 2: CI/CDパイプライン構築 ✅🔄 【CI完了・CD未実装】

### ✅ 2.1 GitHub Actions ワークフロー設計

#### 継続的インテグレーション (CI) パイプライン ✅
- [x] `.github/workflows/ci.yml` 作成
- [x] Lint・TypeScript型チェック自動実行
- [x] ユニットテスト実行・カバレッジレポート
- [x] モノレポ対応（backend/frontend/shared 並列処理）

#### 継続的デプロイ (CD) パイプライン 🔄
- [ ] `.github/workflows/deploy.yml` 作成
- [ ] Cloudflare Workers（バックエンド）自動デプロイ
- [ ] Cloudflare Pages（フロントエンド）自動デプロイ
- [ ] デプロイ前テスト・品質チェック

### ✅ 2.2 開発環境・コード品質設定

#### Linting・Formatting設定 ✅
- [x] ESLint設定ファイル作成（`.eslintrc.js`）
- [x] Prettier設定ファイル作成（`.prettierrc`）
- [x] TypeScript strict設定確認

#### テストフレームワーク設定 ✅
- [x] Vitest設定ファイル作成（`vitest.config.ts`）
- [x] 各パッケージにテストスクリプト追加
- [x] カバレッジ設定・閾値設定

#### Package.json Scripts整備 ✅
- [x] 各パッケージに標準スクリプト追加
  - `lint`: ESLint実行
  - `lint:fix`: ESLint修正
  - `typecheck`: TypeScript型チェック
  - `test`: テスト実行
  - `test:coverage`: カバレッジレポート

### 🔄 2.3 プロジェクト構造強化

#### GitHub Templates作成
- [ ] `.github/ISSUE_TEMPLATE/` 作成
  - `bug_report.md`: バグ報告テンプレート
  - `feature_request.md`: 機能要求テンプレート  
  - `task.md`: タスクテンプレート
- [ ] `.github/pull_request_template.md` 作成

#### ドキュメント整備
- [ ] `CONTRIBUTING.md` 作成（開発ガイドライン）
- [ ] Cloudflareリポジトリsecrets設定手順文書化
- [ ] デプロイ・CI/CD運用マニュアル作成

**実装完了条件:**
- ✅ 全PRでCI/CDが自動実行される
- ✅ mainブランチへのpushで自動デプロイが動作する  
- ✅ Lint・TypeScript・テストが全て通る
- ✅ GitHub ActionsのSecretsが正しく設定されている

## 📅 Phase 3: バックエンド完全実装（データベース・認証・CRUD）

### ✅ 3.1 データベース設計・実装 【完了】
- [x] Drizzle ORM依存関係追加
- [x] スキーマ定義（users、todos テーブル）
- [x] マイグレーションファイル作成
- [x] データベース初期化スクリプト作成
- [x] データベース接続ユーティリティ実装
- [x] 共通DB操作ユーティリティ実装（ID生成、スラッグ生成、エラーハンドリング）

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

### ✅ 3.3 サービス層・CRUD機能実装 【完了】
- [x] TodoService実装（CRUD操作、フィルタリング、ソート、ページネーション）
- [x] UserService実装（Firebase認証統合準備、ユーザー管理）
- [x] 既存エンドポイントをデータベース操作に修正
- [x] エラーハンドリング強化（ビジネスロジックエラー vs DBエラー分離）
- [x] バリデーション詳細化（Zodスキーマ活用）
- [x] ページネーション実装
- [x] 包括的テストスイート作成（38テストケース）

### ✅ 3.2 Firebase Authentication統合 【完了】
- [x] Firebase JWT検証ライブラリ選定・追加（firebase-auth-cloudflare-workers）
- [x] JWT検証ミドルウェア実装（authMiddleware, optionalAuthMiddleware）
- [x] 認証ヘルパー関数実装（JWT抽出、エラー正規化、Auth初期化）
- [x] 認証エンドポイント追加（`POST /api/auth/verify`, `GET /api/auth/me`）
- [x] 既存エンドポイントの認証統合（userIdパラメータ除去、Bearer認証）
- [x] 包括的テストスイート作成（70テスト追加、計110テスト）
- [x] OpenAPI仕様書更新（Bearer認証スキーマ、セキュリティ定義）
- [x] CORS設定更新（Authorization headerサポート）

**実装済みエンドポイント:** ✅
1. `GET /api/todos` - タスク一覧取得（フィルタ・ソート・ページネーション・認証）✅
2. `POST /api/todos` - タスク作成（認証）✅
3. `GET /api/todos/:slug` - タスク詳細取得（認証）✅
4. `PUT /api/todos/:slug` - タスク更新（認証）✅
5. `DELETE /api/todos/:slug` - タスク削除（論理削除・認証）✅
6. `POST /api/auth/verify` - Firebase ID Token検証・ユーザー同期 ✅
7. `GET /api/auth/me` - 認証済みユーザー情報取得 ✅

**実装された追加機能:**
- 論理削除されたTODOの復元機能
- ユーザーごとのデータ分離（認証統合）
- URL用スラッグ生成（日本語対応）
- 包括的エラーハンドリング
- 型安全なデータベース操作
- Firebase Authentication統合（JWT検証）
- 認証ミドルウェア（必須・オプショナル）
- Bearer認証スキーマ（OpenAPI準拠）
- JWT公開鍵キャッシュ（Cloudflare KV活用）
- 統一エラーメッセージ（セキュリティ考慮）

## 📅 Phase 4: 共通パッケージ・フロントエンド実装

### 🔄 4.1 packages/shared作成
- [ ] 共通型定義（APIレスポンス、エラー型など）
- [ ] API型定義（OpenAPI仕様との一致確認）
- [ ] ユーティリティ関数（日付操作、バリデーションなど）
- [ ] 定数定義

### 🔄 4.2 packages/frontend作成
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

### マイルストーン（更新版）
- **Week 1**: Phase 1, 1.5, 2(CI), 3(DB), 3.2(Auth) 完了（基盤・CI・データベース・認証）✅
- **Week 2**: Phase 4 完了（共通パッケージ・フロントエンド実装） + Phase 2(CD) 完了
- **Week 3**: Phase 5 完了（デプロイ・運用）
- **Week 4**: 追加機能・改善

### 実装フォーカス変更履歴
- **2025-07-22**: CI/CDパイプライン構築を優先実装に変更
  - **理由**: 開発品質保証・デプロイ安全性・学習価値の最大化
  - **影響**: データベース実装をPhase 3に延期
- **2025-07-23**: データベース実装フェーズ完了
  - **成果**: 完全なCRUD操作、テスト38件、型安全な実装
  - **次期**: Firebase Authentication統合に焦点
- **2025-07-24**: Firebase Authentication統合フェーズ完了
  - **成果**: 完全な認証システム、テスト70件追加（計110件）、型安全な実装
  - **次期**: 共通パッケージ・フロントエンド実装に焦点

### チェックリスト更新ルール
- 作業開始時: 該当項目を「🔄 進行中」に変更
- 完了時: 該当項目を「✅ 完了」に変更  
- 計画変更時: 本ドキュメントを更新してコミット

---

**最終更新**: 2025年7月24日  
**次回更新予定**: Phase 4（共通パッケージ・フロントエンド実装）開始時  
**現在フェーズ**: Phase 4 - 共通パッケージ・フロントエンド実装 🔄

**Phase 3.2 Firebase Authentication統合の成果:**
- ✅ 6段階の段階的実装（依存関係→ミドルウェア→エンドポイント→統合→テスト→フロントエンド準備）
- ✅ 完全な認証システム（JWT検証、ユーザー同期、セッション管理）
- ✅ 70テストケース追加（計110テスト、100%パス、型安全性確保）
- ✅ 認証ミドルウェア（必須認証・オプショナル認証）
- ✅ 認証ヘルパー関数（JWT抽出、エラー正規化、Auth初期化）
- ✅ Bearer認証対応（OpenAPI、CORS、エンドポイント統合）
- ✅ Firebase Authライブラリ統合（Cloudflare Workers最適化）
- ✅ 初学者向けQ&A教育ドキュメント追加（725行）