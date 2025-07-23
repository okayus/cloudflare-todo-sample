# Backend Development Q&A

## Q: 現状バックエンド動作確認をローカルでできる？ローカルでFirebase認証できる？

### A: 部分的に可能、ただし設定が必要

#### 🟢 **現在可能なこと**

1. **基本的なローカル開発サーバー起動**
   ```bash
   cd packages/backend
   pnpm dev  # wrangler dev でローカルサーバー起動
   ```

2. **非認証エンドポイントの動作確認**
   - ヘルスチェック: `GET http://localhost:8787/health`
   - OpenAPI仕様書: `GET http://localhost:8787/` 

3. **テスト実行による機能確認**
   ```bash
   pnpm test        # 全38テスト実行
   pnpm test:watch  # ウォッチモード
   ```

#### 🟡 **設定が必要なこと（Firebase認証のローカル動作）**

**現状の課題:**
- `wrangler.jsonc`でFirebase Project IDが仮設定（`"your-firebase-project-id"`）
- Firebase Authエミュレーターとの連携設定なし

**必要な設定手順:**

##### 1. Firebase プロジェクト設定
```bash
# Firebase CLIインストール（未インストールの場合）
npm install -g firebase-tools

# Firebaseプロジェクト作成・Authentication有効化
firebase login
firebase init auth
```

##### 2. 環境変数設定
```json
// wrangler.jsonc の vars セクション更新
"vars": {
  "ENVIRONMENT": "development",
  "FIREBASE_PROJECT_ID": "your-actual-project-id",  // 実際のProject ID
  "PUBLIC_JWK_CACHE_KEY": "firebase-jwk-cache"
}
```

##### 3. Firebase Auth エミュレーター連携（推奨）
```json
// wrangler.jsonc に追加
"vars": {
  "ENVIRONMENT": "development", 
  "FIREBASE_PROJECT_ID": "demo-project",
  "PUBLIC_JWK_CACHE_KEY": "firebase-jwk-cache",
  "FIREBASE_AUTH_EMULATOR_HOST": "localhost:9099"  // エミュレーター使用
}
```

```bash
# 別ターミナルでFirebase エミュレーター起動
firebase emulators:start --only auth

# バックエンド起動
pnpm dev
```

#### 🔴 **現在困難なこと**

1. **D1データベースローカル連携**
   - Cloudflare D1はローカルでの完全な再現が制限的
   - テストはSQLite（better-sqlite3）でエミュレーション

2. **KVストレージローカル連携**  
   - JWT公開鍵キャッシュがローカルで制限的
   - 実際の認証テストではクラウド環境推奨

#### 🛠️ **推奨開発フロー**

##### Phase 1: ローカル開発（非認証部分）
```bash
# 基本機能の開発・テスト
pnpm test        # ユニットテスト
pnpm typecheck   # 型チェック
pnpm lint        # コード品質
```

##### Phase 2: 認証連携テスト（Firebaseエミュレーター）
```bash
# Firebase エミュレーター + ローカルWorkers
firebase emulators:start --only auth
pnpm dev
```

##### Phase 3: 統合テスト（Cloudflare環境）
```bash
# 実際のCloudflare環境でテスト
pnpm deploy      # Dev環境デプロイ
```

#### 📚 **参考情報**

- **Firebase Auth Emulator**: https://firebase.google.com/docs/emulator-suite/connect_auth
- **Wrangler Local Development**: https://developers.cloudflare.com/workers/wrangler/commands/#dev
- **firebase-auth-cloudflare-workers**: エミュレーター対応済み

#### 🎯 **次のステップ**

1. Firebase プロジェクト作成・設定
2. エミュレーター環境構築  
3. フロントエンド連携テスト環境準備
4. E2Eテスト環境構築

---

*最終更新: 2025-01-23*
*関連: Phase 3.2 Firebase Authentication Integration*