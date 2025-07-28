# 本番環境API接続問題ポストモーテム

## 📋 概要

- **発生日時**: 2025年7月28日
- **影響範囲**: 本番環境フロントエンド全機能（認証は正常動作）
- **症状**: CORSエラーによりAPI通信が完全に失敗
- **MTTR**: 約2時間（問題特定から修正完了まで）
- **影響ユーザー**: 本番環境利用者全員

## 🚨 問題の症状

### エラーメッセージ
```
Access to fetch at 'http://localhost:8787/api/todos' from origin 'https://cloudflare-todo-sample-frontend.pages.dev' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### 観測された動作
- Firebase認証は正常に動作（ログイン・サインアップ成功）
- ダッシュボード画面でTodo一覧取得が失敗
- 開発者ツールで `localhost:8787` へのアクセスを確認
- 本番環境にも関わらずローカル開発用URLを使用

## ⏰ タイムライン

| 時刻 | 出来事 | 対応者 |
|------|--------|--------|
| 03:30 | Firebase認証修正完了、mainブランチにマージ・デプロイ | Claude Code |
| 03:35 | 本番環境でFirebase認証動作確認（成功） | ユーザー |
| 03:40 | ダッシュボード画面でCORSエラー発生を確認 | ユーザー |
| 03:45 | エラーログ解析開始、localhost:8787アクセスを特定 | Claude Code |
| 04:00 | `VITE_API_BASE_URL` 環境変数未設定が原因と判明 | Claude Code |
| 04:15 | バックエンドWorkerデプロイ状況確認 | Claude Code |
| 04:30 | `wrangler list` でWorker URL特定：`https://backend.toshiaki-mukai-9981.workers.dev` | ユーザー |
| 04:35 | GitHub Secretsに `VITE_API_BASE_URL` 設定完了 | ユーザー |
| 04:40 | デプロイワークフロー修正・再デプロイ準備 | Claude Code |

## 🔍 根本原因分析

### 直接的な原因
1. **環境変数未設定**: `VITE_API_BASE_URL` がGitHub Secretsに設定されていなかった
2. **デフォルト値の使用**: コード内のフォールバック値 `http://localhost:8787` が本番でも適用された

### 根本的な原因
1. **環境変数管理プロセスの不備**: Firebase環境変数追加時にAPI URL設定を見落とした
2. **デプロイ前チェックリストの不在**: 必須環境変数の確認プロセスがなかった
3. **本番環境監視の不足**: API接続状況の自動確認機能がなかった

### コード詳細
```typescript
// packages/frontend/src/utils/todoApi.ts:26
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787'
```

この実装により、環境変数が未設定の場合は常にローカル開発用URLが使用される。

## 🛠️ 修正内容

### 1. GitHub Secrets設定
```
VITE_API_BASE_URL = https://backend.toshiaki-mukai-9981.workers.dev
```

### 2. デプロイワークフロー修正
```yaml
# .github/workflows/deploy.yml
- name: 🏗️ Build frontend
  env:
    VITE_API_BASE_URL: ${{ secrets.VITE_API_BASE_URL }}
    # 他のFirebase環境変数...
```

### 3. 環境変数ファイル更新
```bash
# packages/frontend/.env.local（開発用）
VITE_API_BASE_URL=http://localhost:8787

# packages/frontend/.env.example（本番用例）  
VITE_API_BASE_URL=https://backend.your-subdomain.workers.dev
```

## 📚 学習内容

### Viteの環境変数処理
- `VITE_*` プレフィックスの環境変数のみがクライアントサイドで利用可能
- ビルド時に静的に置換されるため、デプロイ時の設定が重要
- `import.meta.env` でアクセス

### Cloudflare Workersのデプロイ
- Workers URLの形式: `https://[worker-name].[subdomain].workers.dev`
- `wrangler list` でデプロイ済みWorkerとURLを確認可能
- サブドメインはCloudflareアカウントに紐づく

### CORSエラーの原因
- 異なるオリジン間通信での制約
- 本番フロントエンド → ローカルバックエンドは典型的なCORSエラーパターン
- `localhost` は本番環境からアクセス不可

## 🚀 再発防止策

### 1. 環境変数チェックリスト作成
新しいマイクが`deploy.yml`に環境変数確認ステップを追加：

```yaml
- name: 🔍 Environment Variables Check
  run: |
    echo "Checking required environment variables..."
    
    # Firebase設定確認
    [ -n "$VITE_FIREBASE_API_KEY" ] && echo "✅ VITE_FIREBASE_API_KEY" || echo "❌ VITE_FIREBASE_API_KEY"
    [ -n "$VITE_FIREBASE_AUTH_DOMAIN" ] && echo "✅ VITE_FIREBASE_AUTH_DOMAIN" || echo "❌ VITE_FIREBASE_AUTH_DOMAIN"
    
    # API URL確認
    [ -n "$VITE_API_BASE_URL" ] && echo "✅ VITE_API_BASE_URL" || echo "❌ VITE_API_BASE_URL"
    
    # 必須チェック
    if [ -z "$VITE_API_BASE_URL" ] || [ -z "$VITE_FIREBASE_API_KEY" ]; then
      echo "❌ Required environment variables are missing!"
      exit 1
    fi
    
    echo "✅ All required environment variables are set"
  env:
    VITE_API_BASE_URL: ${{ secrets.VITE_API_BASE_URL }}
    VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
    # 他の環境変数...
```

### 2. デプロイ前確認プロセス
- [ ] GitHub Secretsの全必須項目確認
- [ ] バックエンドWorkerの正常動作確認
- [ ] フロントエンドビルドでの環境変数組み込み確認

### 3. 本番環境監視改善
- Health Checkエンドポイントの追加
- フロントエンド→バックエンド接続状況の自動確認
- エラー発生時の通知機能

### 4. 文書化改善
- 環境変数設定ガイドの更新
- デプロイ手順チェックリストの作成
- トラブルシューティングガイドの充実

## 💡 改善提案

### 短期的改善（即座に実装可能）
1. **環境変数バリデーション**: ビルド時に必須環境変数をチェック
2. **デバッグ情報追加**: 本番環境でのAPI URL表示（開発者ツール）
3. **フェイルファスト**: 環境変数未設定時のビルド失敗

### 長期的改善（将来的に検討）
1. **設定管理ツール**: 環境別の設定を一元管理
2. **自動テスト**: デプロイ後の疎通確認自動化
3. **監視ダッシュボード**: リアルタイムでの API健全性監視

## 🎓 初学者向け学習ポイント

### 環境変数の重要性
- **開発環境と本番環境の分離**: 異なる設定値を使用する必要性
- **セキュリティ**: API キーやURLを環境変数で管理する理由
- **CI/CD**: GitHub Secretsと環境変数の関係

### デバッグ手法
- **ブラウザ開発者ツール**: Network タブでのリクエスト確認
- **エラーログ解析**: CORSエラーメッセージの読み方
- **段階的切り分け**: 認証→API通信の順序でのテスト

### Cloudflare特有の知識
- **Workers URL構造**: サブドメインとWorker名の関係
- **Viteビルドプロセス**: 環境変数の静的置換タイミング
- **デプロイパイプライン**: CI/CDでの環境変数設定方法

## 📖 参考資料

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [CORS Policy Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

## 📝 まとめ

今回の問題は**環境変数管理の不備**が根本原因でした。Firebase認証修正に注力した結果、API接続設定を見落とすという典型的なヒューマンエラーです。

**重要な教訓**:
1. 新機能追加時は関連する全ての設定を確認する
2. 環境変数は系統的にチェックリスト化して管理する
3. 本番デプロイ前の確認プロセスを標準化する
4. 問題発生時は段階的に切り分けて調査する

この経験を通じて、より堅牢なデプロイプロセスと監視体制を構築していきます。