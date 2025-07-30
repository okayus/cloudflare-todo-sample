# Cloudflare Todo Sample

🌟 **学習用TODOアプリケーション** - 現代的技術スタックによるフルスタック実装

[![Deploy Status](https://github.com/okayus/cloudflare-todo-sample/actions/workflows/deploy.yml/badge.svg)](https://github.com/okayus/cloudflare-todo-sample/actions/workflows/deploy.yml)
[![CI Status](https://github.com/okayus/cloudflare-todo-sample/actions/workflows/ci.yml/badge.svg)](https://github.com/okayus/cloudflare-todo-sample/actions/workflows/ci.yml)

## プロジェクト概要

TypeScript・React・Hono・Cloudflareエコシステムを使用したモノレポによる学習用TODOアプリケーション。Firebase認証、完全CRUD操作、本番環境での実運用を通じて、現代的なWeb開発技術を実践的に習得するプロジェクトです。

### 🎯 主な特徴
- **✅ 完全実装**: 認証・CRUD・本番運用まで完全実装済み
- **🚀 サーバーレス**: Cloudflare Workers・Pages・D1・KVを活用
- **🔒 セキュア**: Firebase Authentication・JWT検証・CORS対応
- **🧪 高品質**: TypeScript・テスト・CI/CD・OpenAPI仕様書
- **📱 レスポンシブ**: モバイル・タブレット・デスクトップ対応

### 🌐 稼働中のデモ
- **フロントエンド**: https://cloudflare-todo-sample-frontend.pages.dev
- **API**: https://backend.toshiaki-mukai-9981.workers.dev
- **API仕様書**: https://backend.toshiaki-mukai-9981.workers.dev/ (Swagger UI)

## 技術スタック

### 🖥️ フロントエンド
- **React 18** + **TypeScript** - 関数型コンポーネント・Hooks
- **Vite** - 高速開発・ビルド環境
- **Tailwind CSS** - ユーティリティファーストCSS
- **React Router v7** - SPA ルーティング
- **React Hook Form** + **Zod** - フォーム・バリデーション
- **Firebase SDK v12** - 認証クライアント

### ⚡ バックエンド
- **Cloudflare Workers** - サーバーレス Runtime
- **Hono** - 高性能Webフレームワーク
- **Chanfana** - OpenAPI 3.0自動生成
- **Drizzle ORM** - タイプセーフ SQL ORM
- **Firebase Auth Workers** - JWT検証ライブラリ
- **Zod** - スキーマバリデーション

### 🏗️ インフラ・データ
- **Cloudflare Pages** - フロントエンドホスティング
- **Cloudflare D1** - SQLiteデータベース
- **Cloudflare KV** - キーバリューストア（JWTキャッシュ）
- **Firebase Authentication** - ユーザー認証サービス

### 🔄 開発・運用
- **pnpm Workspace** - モノレポパッケージ管理
- **GitHub Actions** - CI/CDパイプライン
- **Vitest** - ユニット・統合テスト
- **Playwright** - E2Eテスト
- **ESLint** + **Prettier** - コード品質・フォーマット

## クイックスタート

### 前提条件
- Node.js v18.17.0+
- pnpm v8.0.0+
- Cloudflareアカウント
- Firebaseプロジェクト

### セットアップ
```bash
# 1. リポジトリクローン
git clone https://github.com/okayus/cloudflare-todo-sample.git
cd cloudflare-todo-sample

# 2. 依存関係インストール
pnpm install

# 3. Cloudflare認証
pnpm wrangler auth login

# 4. 開発サーバー起動
pnpm dev
```

詳細なセットアップ手順は **[開発者ガイド](./docs/developer-guide.md)** を参照してください。

## プロジェクト構造

```
cloudflare-todo-sample/
├── 📚 docs/                    # ドキュメント
│   ├── project-specification.md    # プロジェクト仕様書
│   ├── system-architecture.md      # システム構成書  
│   ├── developer-guide.md          # 開発者ガイド
│   ├── api-specification.md        # API仕様書
│   └── deployment-guide.md         # デプロイメントガイド
│
├── 📦 packages/                # モノレポパッケージ
│   ├── frontend/               # React SPA
│   ├── backend/                # Hono Workers API
│   └── shared/                 # 共通型定義
│
├── 🔄 .github/workflows/       # CI/CDパイプライン
├── 📝 pnpm-workspace.yaml      # Workspace設定
└── 📖 CLAUDE.md               # 開発指針・ルール
```

## ドキュメント

### 📖 主要ドキュメント
- **[プロジェクト仕様書](./docs/project-specification.md)** - 完成プロジェクトの全容・実装詳細
- **[システム構成書](./docs/system-architecture.md)** - 本番インフラ・アーキテクチャ詳細
- **[開発者ガイド](./docs/developer-guide.md)** - セットアップ・開発フロー・トラブルシューティング
- **[API仕様書](./docs/api-specification.md)** - RESTful API・OpenAPI仕様
- **[デプロイメントガイド](./docs/deployment-guide.md)** - CI/CD・本番デプロイ手順

### 📋 設計・要件
- **[要件定義書](./docs/requirements.md)** - 機能・非機能要件・達成状況
- **[システム設計書](./docs/system-design.md)** - アーキテクチャ・DB設計・API設計

## 開発コマンド

```bash
# 開発サーバー
pnpm dev                    # 全サービス並行起動
pnpm --filter=backend dev   # バックエンドのみ
pnpm --filter=frontend dev  # フロントエンドのみ

# ビルド
pnpm build:all             # 全パッケージビルド
pnpm typecheck             # TypeScript型チェック

# テスト
pnpm test                  # 全テスト実行
pnpm test:coverage         # カバレッジ付きテスト
pnpm test:browser          # E2Eテスト (Playwright)

# コード品質
pnpm lint                  # ESLintチェック
pnpm lint:fix              # ESLint自動修正

# データベース
pnpm --filter=backend db:generate  # Drizzleスキーマ生成
pnpm --filter=backend db:migrate   # マイグレーション実行
pnpm --filter=backend db:studio    # Drizzle Studio起動
```

## 実装済み機能

### 🔐 認証システム
- Firebase Authentication統合
- メールアドレス・パスワード認証
- JWT Token自動管理・検証
- セッション永続化・自動ログイン

### 📝 ToDo管理
- **作成**: タイトル・説明・期限日設定
- **一覧**: ページネーション・フィルタ・ソート・検索
- **更新**: 部分更新・完了状態切り替え
- **削除**: 論理削除・安全な削除フロー

### 🎨 ユーザーインターフェース
- レスポンシブデザイン（モバイルファースト）
- 直感的なユーザビリティ
- リアルタイムフィードバック
- エラーハンドリング・ローディング状態

### 🛡️ セキュリティ・品質
- JWT認証・CORS設定
- 入力値バリデーション（Zod）
- SQLインジェクション対策
- TypeScript型安全性・ESLint品質チェック

## 貢献・開発参加

### 🤝 コントリビューション
1. **Issue確認・作成** - バグ報告・機能要望
2. **Fork & ブランチ作成** - `feature/issue-XX-description`
3. **実装・テスト** - コード品質チェック・テスト追加
4. **プルリクエスト** - レビュー・マージ

詳細は **[開発者ガイド](./docs/developer-guide.md#コントリビューション方法)** を参照してください。

### 📝 コーディング規約
- **TypeScript**: strict mode・explicit typing・no any
- **React**: 関数型コンポーネント・Hooks・純粋関数
- **Commits**: Conventional Commits準拠
- **Testing**: TDD・高カバレッジ・E2Eテスト

## ライセンス・学習目的

このプロジェクトは**学習目的**で作成されており、現代的なWeb開発技術の実践的習得を目的としています。

### 🎓 学習成果
- **フルスタック開発**: React・TypeScript・サーバーレス統合
- **クラウドネイティブ**: Cloudflareエコシステム実運用
- **認証統合**: Firebase Authentication実装
- **API設計**: OpenAPI・RESTful API設計
- **CI/CD**: GitHub Actions自動化・品質保証

### 📞 サポート・質問
- **GitHub Issues**: バグ報告・機能要望
- **GitHub Discussions**: 技術的質問・議論
- **Pull Requests**: コード改善・機能追加提案

---

**プロジェクト管理**: 個人学習プロジェクト  
**最終更新**: 2025年7月28日  
**ステータス**: 🟢 本番稼働中