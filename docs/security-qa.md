# セキュリティ対策 Q&A

## Q: "セキュリティヘッダー未設定（XSS、クリックジャッキング脆弱性）"とは何？ソースコードのどこで判断した？

### A: セキュリティヘッダーとは

**セキュリティヘッダー**とは、Webサーバーがブラウザに送信するHTTPレスポンスヘッダーの一種で、様々なWeb攻撃を防ぐためのセキュリティ機能をブラウザに指示するものです。

### 具体的な脆弱性

#### 1. XSS（Cross-Site Scripting）脆弱性
- **問題**: 悪意のあるスクリプトがページ内で実行される攻撃
- **対策ヘッダー**: `Content-Security-Policy` (CSP)
- **効果**: 許可されていないスクリプトの実行をブロック

#### 2. クリックジャッキング脆弱性
- **問題**: 悪意のあるサイトが当サイトをiframe内に埋め込み、ユーザーを騙してクリックさせる攻撃
- **対策ヘッダー**: `X-Frame-Options`
- **効果**: iframeでの埋め込みを拒否

### ソースコードでの判断根拠

#### 1. ヘッダー設定ファイルの不存在

```bash
# 調査コマンド
find packages/frontend -name "_headers" -o -name "headers" -o -name "*.headers" 2>/dev/null

# 結果
ヘッダー設定ファイルが見つかりません
```

**判断**: Cloudflare Pagesで使用される`_headers`ファイルが存在しない

#### 2. プロジェクト構造の確認

```
packages/frontend/
├── dist/
├── eslint.config.js
├── index.html
├── package.json
├── src/
├── vite.config.ts
└── wrangler.toml
```

**判断**: `public/_headers`ファイルが存在しない（通常`public/`ディレクトリ内に配置）

#### 3. 本番環境での確認試行

```bash
# 本番環境のヘッダーチェック（タイムアウト）
curl -I https://cloudflare-todo-sample-frontend.pages.dev/ 2>/dev/null | grep -E "(Content-Security-Policy|X-Frame-Options|X-Content-Type-Options|X-XSS-Protection|Strict-Transport-Security|Referrer-Policy)"

# 結果: タイムアウト（接続できない、またはヘッダー未設定）
```

#### 4. Vite設定ファイルの確認

```typescript
// packages/frontend/vite.config.ts
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  css: {
    postcss: './postcss.config.js',
  },
  build: {
    // セキュリティヘッダーの設定なし
  },
  // ...
}))
```

**判断**: Vite設定にもセキュリティヘッダーの設定がない

### 必要なセキュリティヘッダー

Cloudflare Pagesで設定すべき主要なセキュリティヘッダー：

```
# packages/frontend/public/_headers（未作成）
/*
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://*.googleapis.com https://*.firebase.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.googleapis.com https://*.firebase.com wss://*.firebase.com; img-src 'self' data: https:; frame-ancestors 'none'
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 0
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  Referrer-Policy: strict-origin-when-cross-origin
```

### Firebaseとの関係

現在のプロジェクトはFirebase Authenticationを使用しており、CSPでFirebaseドメインを許可する必要があります：

```typescript
// packages/frontend/src/config/firebase.ts（確認済み）
import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth'
```

**判断**: Firebase統合により、`*.googleapis.com`, `*.firebase.com`のCSP許可が必要

### 結論

1. **ファイル不存在**: `_headers`ファイルが存在しない
2. **設定未実装**: Vite設定にもセキュリティヘッダー設定なし
3. **Firebase要件**: CSPでFirebaseドメイン許可が必要
4. **脆弱性確認**: XSS・クリックジャッキング対策が未実装

これらの調査結果から、セキュリティヘッダー未設定と判断しました。

## Q: セキュリティヘッダー未設定による攻撃を自分で試せる？

### A: はい、学習目的で安全に攻撃を再現できます

**⚠️ 重要**: 以下は学習・検証目的でのみ実施してください。他人のサイトに対する攻撃は違法行為です。

### 1. クリックジャッキング攻撃の再現

#### Step 1: 攻撃用HTMLファイルを作成

```html
<!-- clickjacking-test.html -->
<!DOCTYPE html>
<html>
<head>
    <title>クリックジャッキング攻撃テスト</title>
    <style>
        .overlay {
            position: relative;
            width: 500px;
            height: 300px;
            background: lightblue;
            border: 2px solid red;
        }
        
        .victim-iframe {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0.3; /* 透明度を上げて iframe を見えるようにする */
            border: none;
        }
        
        .fake-button {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: green;
            color: white;
            padding: 10px 20px;
            border: none;
            cursor: pointer;
            font-size: 16px;
        }
    </style>
</head>
<body>
    <h1>🎁 無料プレゼント！</h1>
    <p>下のボタンをクリックして豪華賞品をゲット！</p>
    
    <div class="overlay">
        <!-- 実際は当サイトを iframe で読み込む -->
        <iframe 
            class="victim-iframe" 
            src="https://cloudflare-todo-sample-frontend.pages.dev/">
        </iframe>
        
        <!-- ユーザーが見える偽のボタン -->
        <button class="fake-button">🎁 プレゼントを受け取る</button>
    </div>
    
    <p><small>※実際の攻撃では opacity: 0 で iframe を完全に透明にします</small></p>
</body>
</html>
```

#### Step 2: 攻撃の検証

1. **現在の状態（脆弱）**: iframe内に当サイトが表示される
2. **対策後の状態**: `X-Frame-Options: DENY`により iframe が拒否される

```bash
# ブラウザで確認
open clickjacking-test.html
```

**期待される結果**:
- **対策前**: iframe内にサイトが表示され、クリックジャッキングが可能
- **対策後**: ブラウザコンソールに「X-Frame-Options に DENY が設定されています」エラー

### 2. CSP未設定によるXSS攻撃の再現

#### Step 1: XSSテスト用のHTMLを作成

```html
<!-- xss-test.html -->
<!DOCTYPE html>
<html>
<head>
    <title>XSS攻撃テスト</title>
</head>
<body>
    <h1>XSS (Cross-Site Scripting) テスト</h1>
    
    <!-- 1. Script injection テスト -->
    <h2>1. Script Injection テスト</h2>
    <p>CSP未設定の場合、以下のスクリプトが実行されます:</p>
    <div id="xss-test-1">
        <script>
            // 悪意のあるスクリプトの例
            alert('🚨 XSS攻撃成功！ CSPが設定されていません');
            console.log('🚨 機密情報を盗取中...', {
                cookies: document.cookie,
                localStorage: localStorage.getItem('authToken'),
                sessionStorage: sessionStorage.getItem('userSession')
            });
        </script>
    </div>
    
    <!-- 2. External script injection テスト -->
    <h2>2. External Script Injection テスト</h2>
    <div id="xss-test-2">
        <script src="data:text/javascript,alert('🚨 外部スクリプト実行成功！')"></script>
    </div>
    
    <!-- 3. Inline event handler テスト -->
    <h2>3. Inline Event Handler テスト</h2>
    <button onclick="alert('🚨 インラインイベント実行成功！')">クリックしてください</button>
    
    <div style="margin-top: 20px; padding: 10px; background: #ffe6e6; border: 1px solid #ff0000;">
        <strong>⚠️ 注意</strong>: 
        <ul>
            <li>CSP未設定の場合: 上記すべてのスクリプトが実行される</li>
            <li>CSP設定後: script-src 'self' により外部・インラインスクリプトがブロックされる</li>
        </ul>
    </div>
</body>
</html>
```

#### Step 2: CSP設定前後の比較

**CSP未設定時の動作**:
```javascript
// ブラウザコンソールで実行
// これらが成功すればCSP未設定
eval('console.log("eval実行成功 - CSP未設定")');
document.body.innerHTML += '<script>alert("innerHTML injection成功")</script>';
```

**CSP設定後の期待動作**:
```
Content Security Policy: ページの設定により、以下のリソースの読み込みがブロックされました: インラインスクリプト ('unsafe-inline' がscript-srcで許可されていないため)
```

### 3. セキュリティヘッダー検証ツール

#### ブラウザ開発者ツールでの確認

```javascript
// ブラウザコンソールで実行
console.log('現在のセキュリティヘッダー確認:');
fetch(window.location.href)
  .then(response => {
    console.log('X-Frame-Options:', response.headers.get('X-Frame-Options'));
    console.log('Content-Security-Policy:', response.headers.get('Content-Security-Policy'));
    console.log('X-Content-Type-Options:', response.headers.get('X-Content-Type-Options'));
    console.log('Strict-Transport-Security:', response.headers.get('Strict-Transport-Security'));
  });
```

#### オンラインツールでの検証

1. **Mozilla Observatory**: https://observatory.mozilla.org/
   ```
   # サイトのセキュリティスコアを確認
   URL: https://cloudflare-todo-sample-frontend.pages.dev/
   期待結果: D または F評価（セキュリティヘッダー未設定のため）
   ```

2. **Security Headers**: https://securityheaders.com/
   ```
   # 詳細なヘッダー分析
   URL: https://cloudflare-todo-sample-frontend.pages.dev/
   期待結果: 多数の「Missing」警告
   ```

### 4. 安全な検証環境の構築

#### ローカル検証用サーバー

```bash
# ローカルでセキュリティテスト環境を構築
mkdir security-test
cd security-test

# 簡易HTTPサーバーで攻撃テストページを配信
python3 -m http.server 8080

# ブラウザで確認
open http://localhost:8080/clickjacking-test.html
```

### 5. 対策実装後の検証

#### 期待される結果

```
# セキュリティヘッダー実装後
X-Frame-Options: DENY
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://*.googleapis.com https://*.firebase.com; ...
X-Content-Type-Options: nosniff
```

**攻撃の失敗例**:
- クリックジャッキング: iframe読み込みエラー
- XSS: スクリプト実行ブロック
- MIME sniffing: Content-Type強制

### ⚠️ 重要な注意事項

1. **学習目的のみ**: 自分のサイトでのみテストする
2. **違法行為禁止**: 他人のサイトへの攻撃は犯罪
3. **責任ある開示**: 脆弱性発見時は適切に報告
4. **テスト環境**: 本番環境では行わない

この方法により、セキュリティヘッダーの重要性を実体験として理解できます。