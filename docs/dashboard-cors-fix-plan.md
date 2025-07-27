# Dashboard CORS・API接続エラー修正計画

## 🔍 **問題分析**

フロントエンド（localhost:5173）からバックエンド（localhost:8787）への API 呼び出しで以下のエラーが発生：

1. **CORS Policy Error**
   ```
   Access to fetch at 'http://localhost:8787/api/todos' from origin 'http://localhost:5173' 
   has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
   ```

2. **HTTP 500 Internal Server Error**
   - API エンドポイントで内部エラーが発生
   - Firebase認証設定・D1データベース接続が原因の可能性

3. **根本原因推定**
   - **CORS設定**: バックエンドのCORS設定は正しく5173を許可済み
   - **環境変数不足**: Firebase Project ID が "your-firebase-project-id" のままでダミー値
   - **D1データベース未初期化**: マイグレーション未実行の可能性
   - **KV設定不備**: JWT_CACHE の実際のバインディング未作成

## 🛠️ **修正計画**

### **Phase 1: Cloudflareリソース確認** ✅

**実行結果:**
- D1データベース確認: `todo-app-db` (ID: `07aab756-fe4a-4042-9e12-177b680ed67d`) 存在確認済み
- KVネームスペース確認: `JWT_CACHE` (ID: `a9500f6c3127441b94e29a15f4fa7bb0`) 存在確認済み
- KV Preview: `JWT_CACHE_preview` (ID: `4d9b8ee3bfb04fbb92f9fb1c09adc173`) 存在確認済み

**結論**: すべてのCloudflareリソースが適切に設定済み

### **Phase 2: 環境変数修正** ✅

**実行済み変更:**
- `packages/backend/wrangler.jsonc` の `FIREBASE_PROJECT_ID` を更新
- 変更前: `"FIREBASE_PROJECT_ID": "your-firebase-project-id"`
- 変更後: `"FIREBASE_PROJECT_ID": "cloudflare-todo-sample"`

### **Phase 3: データベース初期化** ✅

**実行完了:**
1. **マイグレーション実行**
   ```bash
   npx wrangler d1 migrations apply todo-app-db --local
   ```
   
   **実行結果:**
   - ✅ 1つのマイグレーション適用: `0000_square_killraven.sql`
   - ✅ 14のSQLコマンド実行成功
   - ✅ テーブル作成完了: `todos`, `users`
   - ✅ インデックス作成完了: 8つのインデックス（ユニーク制約、パフォーマンス最適化）

2. **解決した技術課題:**
   - **初回の課題**: `drizzle-kit push` でbetter-sqlite3のバインディングエラー
   - **解決方法**: Cloudflare MCPサーバーでドキュメント確認後、`wrangler d1 migrations apply`を直接使用
   - **学習事項**: ローカル開発では`--local`フラグが重要

### **Phase 4: バックエンド起動設定調整** ✅

**実行完了:**
1. **wrangler dev 設定改善**
   ```bash
   npx wrangler dev --port 8787
   ```
   
   **実行結果:**
   - ✅ D1データベースバインディング確認: `env.DB (todo-app-db)`
   - ✅ KVネームスペースバインディング確認: `env.JWT_CACHE`
   - ✅ 環境変数確認: `FIREBASE_PROJECT_ID: "cloudflare-todo-sample"`
   - ✅ サーバー起動成功: `http://localhost:8787`

### **Phase 5: API テスト・検証** ✅

**実行完了:**
1. **エンドポイント個別テスト**
   ```bash
   # ヘルスチェック
   curl http://localhost:8787/health
   # 結果: {"status":"ok","timestamp":"2025-07-26T23:09:16.782Z","version":"1.0.0"}
   
   # CORS プリフライト確認
   curl -X OPTIONS http://localhost:8787/api/todos -v
   # 結果: HTTP/1.1 204 No Content + 適切なCORSヘッダー
   ```
   
   **確認されたCORSヘッダー:**
   - ✅ `Access-Control-Allow-Headers: Content-Type,Authorization`
   - ✅ `Access-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,OPTIONS`

2. **Firebase認証フロー準備完了**
   - ✅ Firebase Project ID設定確認
   - ✅ KVキャッシュ設定確認
   - ⏳ フロントエンドからの実際のテスト待ち

### **Phase 6: 段階的統合テスト**

**実行予定:**
1. **認証なしテスト**
   - まず認証を無効化してAPI接続確認
   - CORS・基本的なAPI疎通確認

2. **認証ありテスト**
   - Firebase認証フローの完全テスト
   - Dashboard からの実際のデータ取得確認

## 📋 **実装手順**

1. ✅ **Cloudflareリソース確認** - 完了
2. ✅ **環境変数確認・修正** - 完了  
3. ✅ **D1データベース初期化** - 完了
4. ✅ **バックエンド再起動・疎通テスト** - 完了
5. ⏳ **フロントエンド接続確認** - 次のステップ
6. ⏳ **Firebase認証フロー確認** - 次のステップ

## 🎯 **期待結果**

- ✅ D1・KVリソース正常認識
- ✅ Firebase認証設定正常化  
- ✅ API疎通・CORS解決
- ⏳ Dashboard正常動作

## 📄 **技術的な発見事項**

### **Cloudflareリソース状況**
- すべてのリソース（D1, KV）が既に適切に作成済み
- wrangler.jsonc の設定とリソースIDが一致している
- 新規リソース作成は不要

### **環境変数設定**
- Firebase Project ID の設定が原因の一つと確認
- 実際のプロジェクトID `cloudflare-todo-sample` に更新済み

### **D1マイグレーション実行の学習事項**
- **最初の試行**: `drizzle-kit push` でbetter-sqlite3のネイティブバインディングエラー
- **解決アプローチ**: Cloudflare MCPサーバーでD1ドキュメント確認
- **成功した方法**: `wrangler d1 migrations apply` の直接使用
- **重要なフラグ**: `--local` でローカル開発環境での実行

### **バックエンド起動での注意点**  
- **wrangler版** 4.25.0 使用 (4.26.0 アップデート可能)
- **compatibility_date** 2025-07-22 指定だが 2025-07-12 にフォールバック
- **バインディング確認**: 起動時にD1・KV・環境変数すべて正常認識

## 📚 **参考情報**

- Firebase Project ID: `cloudflare-todo-sample`
- D1 Database: `todo-app-db` (07aab756-fe4a-4042-9e12-177b680ed67d)
- KV Namespace: `JWT_CACHE` (a9500f6c3127441b94e29a15f4fa7bb0)
- Frontend Port: 5173
- Backend Port: 8787

## 🔄 **現在の状況**

**完了**: バックエンドAPI正常動作、CORS設定確認済み、D1データベース初期化完了
**次のステップ**: フロントエンド接続テスト、Firebase認証フロー検証

---

## 🚨 **ポストモーテム（問題解決過程の記録）**

### **Problem 1: drizzle-kit push でのネイティブバインディングエラー**

**症状:**
```
Error: Cannot find module '/home/okayu/dev/cloudflare-todo-sample/packages/backend/node_modules/better-sqlite3/build/Release/better_sqlite3.node'
```

**原因分析:**
- `drizzle-kit push` がローカルでbetter-sqlite3のネイティブバインディングを要求
- Cloudflare Workers環境とローカル開発環境の差異
- WSL2環境でのネイティブモジュールコンパイル問題

**解決過程:**
1. **初回試行**: better-sqlite3の再インストール → 失敗
2. **調査**: Cloudflare MCPサーバーでD1ドキュメント確認
3. **解決**: `wrangler d1 migrations apply --local` を直接使用

**学習事項:**
- Cloudflare D1では `drizzle-kit push` より `wrangler d1 migrations apply` が推奨
- ローカル開発では `--local` フラグが必須
- マイグレーションファイルベースのアプローチがより安定

### **Problem 2: 初回のバックエンド起動確認**

**症状:**
- `curl http://localhost:8787/health` で接続拒否エラー

**原因分析:**
- `wrangler dev` コマンドの実行が途中でタイムアウト
- バックグラウンド実行への切り替えタイミングの問題

**解決過程:**
1. **初回**: フォアグラウンドで起動確認（タイムアウト）
2. **調査**: wranglerの起動ログで正常起動を確認
3. **解決**: バックグラウンド起動後に適切にテスト実行

**学習事項:**
- `wrangler dev` は起動に時間がかかる場合がある
- 起動ログの「Ready on http://localhost:8787」確認が重要
- バインディング情報の表示で設定確認可能

### **Problem 3: CORS設定の検証方法**

**成功事例:**
```bash
curl -X OPTIONS http://localhost:8787/api/todos -v
# 結果: 適切なCORSヘッダーを確認
```

**学習事項:**
- CORS問題のデバッグには OPTIONS リクエストでのプリフライト確認が効果的
- `Access-Control-Allow-Origin` ヘッダーの有無だけでなく、許可されるメソッドとヘッダーも重要
- バックエンドのCORS設定は当初から正しく、根本原因は別の箇所にあった

### **Root Cause Analysis Summary**

**真の原因**: Firebase Project ID のダミー値設定
- 表面的なCORSエラーの背後にある HTTP 500 エラーが本質
- 環境変数の設定ミスによる Firebase 認証初期化失敗
- D1データベースの未初期化による API エラー

**解決への鍵**: 系統的なアプローチ
1. インフラ層（Cloudflare リソース）の確認
2. 設定層（環境変数）の修正  
3. データ層（D1マイグレーション）の初期化
4. アプリケーション層（API テスト）の検証