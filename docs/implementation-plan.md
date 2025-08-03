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

#### 継続的デプロイ (CD) パイプライン 🔄 **【Phase 4で完成予定】**
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

## ✅ Phase 4: 最低限フロントエンド実装（CI/CDパイプライン完成） 【完了】

**戦略的判断**: CI/CDパイプライン完成を最優先し、最低限のフロントエンド実装でデプロイ可能な状態を構築。

### ✅ 4.1 packages/shared作成（最低限） 【完了】
- [x] プロジェクト構造作成（package.json, tsconfig.json, eslint.config.js）
- [x] API型定義実装（Todo, User, APIResponse - バックエンドと共通）
- [x] ユーティリティ関数実装（date.ts, validation.ts）
- [x] エクスポート設定（index.ts）
- [x] 包括的ユニットテスト（42テストケース）
- [x] CI/CDパイプライン追加対応

### ✅ 4.2 packages/frontend作成（静的ページのみ） 【完了】
- [x] Vite + React + TypeScript環境構築
- [x] 基本設定（ESLint, TypeScript, Vitest）
- [x] 静的ページ実装（Landing.tsx, ComingSoon.tsx）
- [x] ビルド・デプロイ設定（wrangler.toml）
- [x] 基本テスト環境構築

### ✅ 4.3 CI/CDパイプライン拡張 【完了】
- [x] CI workflow更新（matrix: [backend, shared, frontend]）
- [x] CD workflow作成（Cloudflare Workers + Pages）
- [x] 品質チェック統合（全パッケージでLint・TypeCheck・Test）
- [x] デプロイ自動化（環境別対応、ヘルスチェック）

**実装済みコンポーネント:**
- **packages/shared**: API型定義・ユーティリティ関数 (42テスト通過)
- **packages/frontend**: React静的ページ (Landing・ComingSoon)
- **CI/CD Pipeline**: 3パッケージ並列テスト・自動デプロイ

**品質指標達成:**
- TypeScript strict mode: 100%
- ESLint警告: 0件
- テストカバレッジ: 全42テスト通過
- ビルド成功: 全3パッケージ

**最低限実装の手順:**
```bash
# Step 1: Shared Package作成（30分）
mkdir -p packages/shared/src/types
cd packages/shared
# package.json, tsconfig.json, API型定義作成

# Step 2: Frontend Skeleton作成（90分）
cd ../
npm create vite@latest frontend -- --template react-ts
cd frontend
# 基本設定、静的ページ2つ実装

# Step 3: CI/CD拡張（30分）
# .github/workflows/ci.yml更新
# .github/workflows/deploy.yml作成
```

**省略する機能（次フェーズ実装）:**
- Firebase認証UI
- Todo管理画面  
- リアルタイム同期
- 高度なレスポンシブデザイン
- React Router設定
- Firebase SDK統合

**実装される最低限機能:**
- **Landing Page**: プロジェクト概要・技術スタック紹介
- **Coming Soon Page**: 今後の実装予定機能案内
- **基本レスポンシブ**: Tailwind CSS minimal setup
- **型安全性**: shared types活用

## 📅 Phase 5: デプロイ・運用

### ✅ 5.1 Cloudflareデプロイ（基盤） 【完了】
- [x] Workers デプロイ（バックエンドAPI）✅ **Issue #15で完了済み**
- [x] Pages デプロイ（フロントエンド）✅ **Issue #16で完了済み**
- [x] GitHub Actions CI/CD自動デプロイ設定 ✅ **Issue #17で完了済み**
- [x] Firebase Authentication設定 ✅ **Issue #18で完了済み**
- [ ] カスタムドメイン設定
- [ ] SSL・セキュリティ設定強化

### ✅ 5.2 フロントエンド機能拡張（認証UI実装）【完了】
- [x] Firebase環境変数設定・初期動作確認 ✅ **Phase 1認証コンテキスト基盤完了**
- [x] ログイン機能実装・動作確認 ✅ **Issue #18で完了済み**
- [x] 認証フロー基盤完成 ✅ **TDD方式で76/76テスト通過**

### 🔄 5.3 ダッシュボード機能実装（Todo管理UI）
- [ ] Dashboard基盤コンポーネント実装（TDD方式）
- [ ] タスク登録機能実装（TaskCreateForm）
- [ ] タスク一覧表示機能実装（TaskList）
- [ ] 認証ルートガード実装（ProtectedRoute）
- [ ] バックエンドAPI統合（POST/GET /api/todos）

### ✅ 5.4 フロントエンドプロダクションビルドセキュリティ強化 【Issue #38】

#### Phase 1: Console削除・Minify強化 ✅ **【PR #39完了】**
- [x] **Console削除・Minify強化**: esbuildでconsole.log等を本番環境で削除（40箇所→0箇所）
- [x] **ソースマップ制御**: 本番環境でhiddenソースマップに設定
- [x] **Bundle最適化**: 7.05 kB削減（1.5%削減）、Gzip: 2.09 kB削減

**実装完了内容:**
- `packages/frontend/vite.config.ts`: esbuild `drop: ['console', 'debugger']`設定
- プロダクションビルドでconsole文完全削除確認済み
- 本番環境デプロイ・動作確認完了

#### Phase 2: セキュリティヘッダー・ESLint強化 🔄 **【PR #40進行中】**

**🔍 セキュリティ現状調査結果:**
- ❌ **重大**: セキュリティヘッダー未設定（XSS、クリックジャッキング脆弱性）
- ❌ **重要**: ESLintセキュリティプラグイン未導入
- ✅ **良好**: eval()、innerHTML、dangerouslySetInnerHTML使用なし
- ⚠️ **注意**: Firebase統合でCSP設定が必要

**緊急実装予定:**
- [ ] **セキュリティヘッダー設定**: 最優先実装（重大な脆弱性対策）
  - CSP（Firebase対応）、XSS対策、クリックジャッキング防止、HTTPS強制
- [ ] **ESLintセキュリティ強化**: eslint-plugin-securityの導入
- [ ] **Bundle分析・最適化**: rollup-plugin-visualizer、チャンク分割
- [ ] **セキュリティスキャン**: Mozilla Observatory、Security Headers等

**実装対象ファイル:**
```
packages/frontend/public/_headers          # 新規作成：Cloudflare Pagesセキュリティヘッダー
packages/frontend/package.json            # eslint-plugin-security追加
packages/frontend/eslint.config.js        # セキュリティルール設定
packages/frontend/vite.config.ts          # Bundle分析ツール追加
```

**期待されるセキュリティ効果:**
- XSS/CSRF/クリックジャッキング攻撃防止
- Mozilla Observatory A評価獲得
- OWASP推奨セキュリティベストプラクティス準拠
- 開発時セキュリティ脆弱性自動検出

### 🔄 5.5 ドキュメント最終化
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
- **Week 2**: Phase 4 完了（最低限フロントエンド・CI/CDパイプライン完成）
- **Week 3**: Phase 5 完了（デプロイ・運用）+ フロントエンド機能拡張
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

**最終更新**: 2025年7月26日  
**次回更新予定**: Phase 5.3ダッシュボード機能実装完了時  
**現在フェーズ**: Phase 5.3 - ダッシュボード機能実装（Todo管理UI）🔄

**Phase 5.2 認証UI実装完了の成果:**
- ✅ 認証フロー基盤完成（TDD方式・76/76テスト通過）
  - Firebase設定・AuthContext・LoginFormの完全なテスト駆動実装
  - 実際のFirebase Authentication統合・動作確認完了
  - TypeScript strict mode・ESLint・any型完全排除
- ✅ Cloudflareデプロイ基盤完成（Issue #15-18すべて完了）
- ✅ CI/CDパイプライン完成（自動テスト・自動デプロイ）
- ✅ プロダクション品質のバックエンドAPI（110テスト、型安全性）

**Issue #20 ダッシュボード実装の計画:**
- 🔄 Dashboard基盤コンポーネント実装（TDD方式）【開始】
- ⏳ TaskCreateForm実装（タスク登録機能）
- ⏳ TaskList実装（タスク一覧表示機能）
- ⏳ ProtectedRoute実装（認証ルートガード）
- ⏳ バックエンドAPI統合・統合テスト