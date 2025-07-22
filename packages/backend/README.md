# Cloudflare Todo Sample - Backend API

Cloudflare Workers上で動作するToDoアプリケーションのバックエンドAPI。  
OpenAPI 3.1準拠、Firebase Authentication対応、TDD実践による学習用プロジェクトです。

## 🛠️ 技術スタック

- **Framework**: [Hono](https://hono.dev/) - 軽量で高速なWebフレームワーク
- **OpenAPI**: [Chanfana](https://github.com/cloudflare/chanfana) - OpenAPI 3.1自動生成
- **Database**: Cloudflare D1 (SQLite) - サーバーレスSQL database
- **Cache**: Cloudflare KV - JWT公開鍵キャッシュ用
- **Auth**: Firebase Authentication - JWT認証
- **Platform**: Cloudflare Workers - エッジコンピューティング

## 🚀 セットアップ手順

### 1. 前提条件

1. [Cloudflare Workers](https://workers.dev)アカウント作成（無料プランで十分）
2. Node.js 18+ インストール
3. pnpm インストール (`npm install -g pnpm`)

### 2. 依存関係インストール

```bash
pnpm install
```

### 3. Cloudflare認証

```bash
wrangler login
```

### 4. Cloudflareリソース設定確認

プロジェクトには以下のリソースが設定済みです：

```bash
# D1データベース（設定済み）
# Database ID: 07aab756-fe4a-4042-9e12-177b680ed67d
# Binding: DB

# KVネームスペース（設定済み）  
# Namespace ID: a9500f6c3127441b94e29a15f4fa7bb0
# Preview ID: 4d9b8ee3bfb04fbb92f9fb1c09adc173
# Binding: JWT_CACHE
```

## 🔧 Firebase Authentication設定

### 1. Firebaseプロジェクト作成

1. [Firebase Console](https://console.firebase.google.com/)でプロジェクト作成
2. **Authentication** > **Sign-in method** で以下を有効化：
   - Email/Password認証
   - Google認証（OAuth）

### 2. Firebase設定情報の取得

Firebase Console > プロジェクト設定 > 全般 から以下の情報を取得：

- **Project ID**: `your-firebase-project-id`

### 3. Workers Secrets設定

Firebase設定をCloudflare Workers Secretsに保存：

```bash
# Firebase Project IDを設定（必須）
wrangler secret put FIREBASE_PROJECT_ID
# 入力: your-firebase-project-id

# 本番環境でのみ必要（開発時は不要）
# wrangler secret put FIREBASE_CLIENT_EMAIL
```

### 4. 環境変数確認

設定が正しく反映されているかローカルサーバーで確認：

```bash
# 開発サーバー起動
wrangler dev

# ブラウザで http://localhost:8787/ を開いてSwagger UIを確認
```

## Project structure

1. Your main router is defined in `src/index.ts`.
2. Each endpoint has its own file in `src/endpoints/`.
3. For more information read the [chanfana documentation](https://chanfana.pages.dev/) and [Hono documentation](https://hono.dev/docs).

## Development

1. Run `wrangler dev` to start a local instance of the API.
2. Open `http://localhost:8787/` in your browser to see the Swagger interface where you can try the endpoints.
3. Changes made in the `src/` folder will automatically trigger the server to reload, you only need to refresh the Swagger interface.
