# プロジェクト仕様書

**作成日**: 2025年7月28日  
**バージョン**: 1.0.0  
**ステータス**: ✅ 実装完了・本番稼働中  

## プロジェクト概要

### 基本情報
- **プロジェクト名**: Cloudflare Todo Sample
- **目的**: TypeScript・React・Hono・Cloudflareエコシステムを使用した学習用ToDoアプリケーション
- **アプローチ**: モノレポ構成による現代的なフルスタック開発の実践
- **開発期間**: 2024年12月 〜 2025年7月（継続中）
- **開発規模**: 単一開発者・学習プロジェクト

### 達成目標 ✅
- [x] **ログイン機能付きToDoアプリの完全実装**
- [x] **TDD（テスト駆動開発）による品質向上**
- [x] **OpenAPIスキーマ駆動開発とAPI設計**
- [x] **Cloudflare Workersエコシステムの活用**
- [x] **CI/CD（GitHub Actions）による自動化**
- [x] **Firebase Authentication統合**
- [x] **本番環境での実運用**

## 実装済み機能

### 1. ユーザー認証機能 ✅
**Firebase Authentication統合**
- **ユーザー登録・ログイン**: メールアドレス・パスワード認証
- **認証状態管理**: JWT Token + React Context
- **自動ログイン**: Token有効期間内での継続セッション
- **セキュアな認証**: Cloudflare Workers上でのJWT検証
- **KVキャッシュ**: Firebase公開鍵の効率的キャッシュ（TTL: 1時間）

**実装詳細**:
```typescript
// Firebase JWT検証フロー（Cloudflare Workers）
1. Authorization Bearer Tokenの抽出
2. Firebase公開鍵のKVキャッシュ確認・取得
3. JWT署名検証（exp, iss, aud, sub検証）
4. ユーザー情報のD1データベース同步・作成
```

### 2. ToDoタスク管理機能（完全CRUD） ✅
**RESTful API + React UI**

#### Create（作成）
- **API**: `POST /api/todos`
- **機能**: タイトル・説明・期限日時によるタスク作成
- **バリデーション**: Zodスキーマによる厳密検証
- **UI**: React Hook Formによる使いやすいフォーム

#### Read（読み取り）
- **API**: `GET /api/todos`, `GET /api/todos/:slug`
- **機能**: ユーザー別タスク一覧・詳細表示
- **ページネーション**: 20件/ページ（カスタマイズ可能）
- **フィルタリング**: 完了状態・期限日での絞り込み
- **ソート**: 作成日・期限日・タイトル順
- **検索**: タイトル・説明文での全文検索

#### Update（更新）
- **API**: `PUT /api/todos/:slug`
- **機能**: タスク情報の部分更新・完了状態切り替え
- **リアルタイム更新**: 即座にUI反映

#### Delete（削除）
- **API**: `DELETE /api/todos/:slug`
- **機能**: 論理削除による安全な削除（復元可能性を考慮）
- **UI**: 削除確認フローによる誤操作防止

### 3. ユーザーインターフェース ✅
**React 18 + TypeScript + Tailwind CSS**

#### レスポンシブデザイン
- **アプローチ**: モバイルファーストデザイン
- **レイアウト**: CSS Gridによる柔軟なレイアウト
- **スタイリング**: Tailwind CSSによる統一デザインシステム
- **対応デバイス**: モバイル・タブレット・デスクトップ

#### ユーザビリティ
- **直感的操作**: シンプルで分かりやすいUI/UX
- **フィードバック**: ローディング状態・エラー表示
- **アクセシビリティ**: セマンティックHTML・キーボード操作対応

#### 実装済み画面
- **ランディングページ**: プロジェクト概要・技術スタック紹介
- **ログイン・サインアップ**: Firebase認証UI
- **ダッシュボード**: ユーザー情報・タスクサマリー
- **タスク管理**: 一覧・作成・編集・削除機能

## 技術仕様

### アーキテクチャ
**モノレポ構成（pnpm workspace）**
```
packages/
├── frontend/     # React + TypeScript + Vite
├── backend/      # Hono + TypeScript + Cloudflare Workers  
└── shared/       # 共通型定義・ユーティリティ
```

### 技術スタック詳細

#### フロントエンド
```json
"主要依存関係": {
  "react": "^18.3.1",
  "react-dom": "^18.3.1", 
  "react-router-dom": "^7.7.1",
  "firebase": "^12.0.0",
  "react-hook-form": "^7.61.1",
  "zod": "^4.0.10"
},
"開発ツール": {
  "vite": "^6.0.1",
  "typescript": "^5.6.2",
  "vitest": "^3.2.4",
  "eslint": "^9.15.0"
}
```

**特徴**:
- **React 18**: 最新のReact機能（Suspense・ErrorBoundary）
- **TypeScript strict mode**: 最高レベルの型安全性
- **Vite**: 高速ビルド・HMR開発体験
- **関数型コンポーネント**: Hooks・純粋関数型アプローチ

#### バックエンド
```json
"主要依存関係": {
  "hono": "^4.6.20",
  "chanfana": "^2.6.3",
  "drizzle-orm": "^0.44.3",
  "firebase-auth-cloudflare-workers": "^2.0.6",
  "zod": "^3.24.1"
},
"開発ツール": {
  "wrangler": "^4.25.0",
  "drizzle-kit": "^0.31.4",
  "vitest": "^2.1.8"
}
```

**特徴**:
- **Hono**: 高性能・軽量Webフレームワーク
- **Chanfana**: OpenAPI 3.0自動生成・ドキュメント化
- **Drizzle ORM**: タイプセーフなSQL ORM
- **Workers特化**: Cloudflare Runtime最適化

#### インフラ・デプロイ
```yaml
Cloudflareサービス:
  - Workers: バックエンドAPI実行環境
  - Pages: フロントエンドホスティング
  - D1: SQLiteデータベース（本番稼働中）
  - KV: キーバリューストア（JWTキャッシュ）

CI/CD:
  - GitHub Actions: 自動テスト・ビルド・デプロイ
  - 品質ゲート: ESLint・TypeScript・Vitest
  - 環境分離: development・production環境
```

## データベース設計

### D1 Database（SQLite）
**実装済みテーブル構造**

#### USERSテーブル
```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,              -- Firebase UID
    email TEXT UNIQUE NOT NULL,       -- メールアドレス
    display_name TEXT,                -- 表示名
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- インデックス最適化
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
```

#### TODOSテーブル
```sql
CREATE TABLE todos (
    id TEXT PRIMARY KEY,              -- UUID
    user_id TEXT NOT NULL,            -- Firebase UID（外部キー）
    title TEXT NOT NULL,              -- タスクタイトル
    description TEXT,                 -- タスク説明
    completed BOOLEAN DEFAULT FALSE,  -- 完了状態
    due_date DATETIME NOT NULL,       -- 期限日時
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,              -- 論理削除用
    slug TEXT NOT NULL,               -- URL用スラッグ
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- パフォーマンス最適化インデックス
CREATE INDEX idx_todos_user_id ON todos(user_id);
CREATE INDEX idx_todos_completed ON todos(completed);
CREATE INDEX idx_todos_due_date ON todos(due_date);
CREATE UNIQUE INDEX idx_todos_slug ON todos(slug);
```

**正規化レベル**: 第3正規形準拠・外部キー制約実装

## API仕様

### OpenAPI 3.0準拠
**ベースURL**: `https://backend.toshiaki-mukai-9981.workers.dev`
**認証方式**: Bearer Token（Firebase JWT）

### 実装済みエンドポイント

#### 認証API
```yaml
POST /api/auth/verify:
  概要: JWT認証確認・ユーザー情報取得
  レスポンス: ユーザー情報・認証状態

GET /api/auth/me:
  概要: 現在のユーザー情報取得
  レスポンス: プロフィール情報
```

#### ToDoAPI
```yaml
GET /api/todos:
  概要: タスク一覧取得（ページネーション・フィルタ対応）
  パラメータ: page, limit, completed, sort, order, search
  レスポンス: タスク配列・ページネーション情報

POST /api/todos:
  概要: 新規タスク作成
  リクエスト: title, description, due_date
  レスポンス: 作成されたタスク情報

GET /api/todos/:slug:
  概要: 特定タスク詳細取得
  レスポンス: タスク詳細情報

PUT /api/todos/:slug:
  概要: タスク更新（部分更新対応）
  リクエスト: title?, description?, completed?, due_date?
  レスポンス: 更新されたタスク情報

DELETE /api/todos/:slug:
  概要: タスク削除（論理削除）
  レスポンス: 削除確認メッセージ
```

### レスポンス標準化
```typescript
// 成功レスポンス
interface SuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
  request_id: string;
}

// エラーレスポンス  
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  request_id: string;
}
```

## 品質指標・テスト戦略

### テストカバレッジ実績
```yaml
バックエンド:
  - ユニットテスト: Services・Utils・Middleware
  - 統合テスト: API Endpoints・Database
  - 型安全性: TypeScript strict mode

フロントエンド:
  - コンポーネントテスト: React Testing Library
  - E2Eテスト: Playwright（認証フロー）
  - フォームバリデーションテスト: Zod統合

共通:
  - Linting: ESLint（TypeScript・React・Node.js）
  - Formatting: Prettier統一フォーマット
  - 型チェック: TypeScript最新版
```

### CI/CDパイプライン
```yaml
継続的インテグレーション:
  - 自動テスト実行（全パッケージ）
  - TypeScript型チェック
  - ESLint・Prettier品質チェック
  - ビルド成功確認

継続的デプロイメント:
  - mainブランチへのPush時自動デプロイ  
  - Backend: Cloudflare Workers
  - Frontend: Cloudflare Pages
  - 本番環境ヘルスチェック
```

## セキュリティ実装

### 認証・認可
```yaml
JWT検証:
  - Firebase公開鍵による署名検証
  - Claims検証（exp, aud, iss, sub）
  - KVキャッシュによる性能最適化

CORS設定:
  - 許可オリジン: 開発・本番環境URL
  - 許可メソッド: REST API標準メソッド
  - 資格情報: 厳密管理
```

### データ保護
```yaml
入力値検証:
  - Zodスキーマによる厳密バリデーション
  - SQLインジェクション対策（Drizzle ORM）
  - XSS攻撃対策（自動エスケープ）

通信暗号化:
  - HTTPS強制（Cloudflare SSL）
  - セキュアヘッダー設定
```

## パフォーマンス実績

### レスポンス時間
```yaml
API平均応答時間:
  - 認証エンドポイント: ~200ms
  - CRUD操作: ~150ms
  - 一覧取得: ~180ms

初回ページロード:
  - フロントエンド: ~2.1秒
  - 静的リソース: CDNキャッシュ活用
```

### スケーラビリティ
```yaml
Cloudflare Edge Network:
  - グローバル配信: 世界200+拠点
  - オートスケーリング: トラフィック応答
  - Cold Start: Workers最適化済み

キャッシュ戦略:
  - Firebase JWT公開鍵: KV（1時間TTL）
  - 静的リソース: CDNキャッシュ
  - API レスポンス: 適切なHTTPヘッダー
```

## 運用・監視

### ログ・監視体系
```yaml
アプリケーションログ:
  - 構造化ログ（JSON）
  - リクエストトレーシング
  - エラー詳細記録

Cloudflare Analytics:
  - Workers Analytics: リクエスト統計
  - Pages Analytics: ページビュー
  - D1 Analytics: データベース性能
```

### エラーハンドリング
```yaml
障害対応:
  - 自動復旧機能
  - 詳細エラーメッセージ
  - ユーザーフレンドリーなUI

デバッグ支援:
  - wrangler tail: リアルタイムログ
  - Request ID: 問題追跡
  - 詳細スタックトレース
```

## プロジェクト成果

### 学習目標達成状況
- [x] **TDD開発プロセス習得**: Vitest・Testing Library活用
- [x] **OpenAPIスキーマ駆動開発実践**: Chanfana・Zod統合
- [x] **Cloudflareエコシステム理解**: Workers・Pages・D1・KV実運用
- [x] **モノレポ構成理解**: pnpm workspace・共通パッケージ管理
- [x] **純粋関数型プログラミング実践**: React Hooks・Immutable操作

### 技術的成果指標
- [x] **全CRUD操作正常動作**: Create・Read・Update・Delete完全実装
- [x] **認証機能正常動作**: Firebase Authentication統合完了
- [x] **CI/CDパイプライン正常動作**: GitHub Actions完全自動化
- [x] **セキュリティ要件100%遵守**: JWT検証・CORS・入力検証
- [x] **本番環境稼働**: Cloudflare本番環境での安定運用

### ビジネス価値
- **技術習得**: 現代的フルスタック開発スキル獲得
- **ポートフォリオ**: 実運用レベルのプロジェクト成果物
- **ベストプラクティス**: 高品質コード・設計パターン習得
- **インフラ経験**: クラウドネイティブ技術実践経験

## 今後の拡張可能性

### Phase 5: 高度機能実装
- [ ] **リアルタイム同期**: WebSocket・Server-Sent Events
- [ ] **ファイル添付**: Cloudflare R2統合
- [ ] **プッシュ通知**: Web Push API
- [ ] **オフライン対応**: Service Worker・IndexedDB

### 運用強化
- [ ] **監視・アラート**: 詳細メトリクス・SLA監視
- [ ] **A/Bテスト**: 機能改善・UX最適化
- [ ] **国際化（i18n）**: 多言語対応
- [ ] **アクセシビリティ強化**: WCAG 2.1 AA準拠

### スケールアップ
- [ ] **マルチテナント化**: 複数組織対応
- [ ] **チーム機能**: 共同作業・権限管理
- [ ] **API外部公開**: サードパーティ統合
- [ ] **モバイルアプリ**: React Native・PWA

## 関連資料

- [システム設計書](./system-design.md)
- [API仕様書](./api-specification.md)
- [デプロイメントガイド](./deployment-guide.md)
- [要件定義書](./requirements.md)
- [ポストモーテム集](./firebase-auth-401-postmortem.md)

---

**プロジェクト責任者**: 個人学習プロジェクト  
**最終更新**: 2025年7月28日  
**次回レビュー**: Phase 5機能実装検討時