/**
 * Coming Soon ページコンポーネント
 * 
 * 今後実装予定の機能を案内する
 * 静的ページ実装。
 * 
 * 表示される予定機能:
 * - Firebase認証フロー
 * - Todo管理画面
 * - リアルタイム同期
 * - PWA機能
 */

/**
 * Coming Soon ページ
 * 
 * 次のフェーズで実装予定の機能一覧と
 * 開発ロードマップを表示する。
 */
function ComingSoon() {
  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem', textAlign: 'center' }}>
      <header style={{ marginBottom: '3rem' }}>
        <h1>🚧 Coming Soon</h1>
        <p style={{ fontSize: '1.2rem', color: '#666' }}>
          次のフェーズで実装予定の機能
        </p>
      </header>

      <main>
        <section style={{ marginBottom: '2rem' }}>
          <h2>🔮 Phase 5: フル機能実装</h2>
          <div style={{ textAlign: 'left', margin: '2rem 0' }}>
            <h3>🔐 認証システム</h3>
            <ul>
              <li>Firebase認証UI</li>
              <li>Google/Email認証</li>
              <li>ユーザープロフィール管理</li>
              <li>セッション管理</li>
            </ul>

            <h3>📝 Todo管理機能</h3>
            <ul>
              <li>リアルタイムTodo作成・編集・削除</li>
              <li>カテゴリ別分類</li>
              <li>優先度設定</li>
              <li>期限設定・通知</li>
              <li>検索・フィルタリング</li>
            </ul>

            <h3>💨 パフォーマンス最適化</h3>
            <ul>
              <li>リアルタイム同期 (WebSocket)</li>
              <li>オフライン対応 (PWA)</li>
              <li>画像最適化</li>
              <li>コード分割</li>
            </ul>

            <h3>📱 UI/UX強化</h3>
            <ul>
              <li>Tailwind CSS完全統合</li>
              <li>アニメーション効果</li>
              <li>ダークモード対応</li>
              <li>モバイルファースト設計</li>
            </ul>
          </div>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2>📅 開発ロードマップ</h2>
          <div style={{ textAlign: 'left' }}>
            <div style={{ padding: '1rem', margin: '1rem 0', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
              <strong>Phase 4 (現在)</strong>: 最低限フロントエンド + CI/CD完成
            </div>
            <div style={{ padding: '1rem', margin: '1rem 0', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
              <strong>Phase 5</strong>: フル機能実装 (認証UI + Todo管理)
            </div>
            <div style={{ padding: '1rem', margin: '1rem 0', backgroundColor: '#e8f5e8', borderRadius: '8px' }}>
              <strong>Phase 6</strong>: 最適化・PWA対応
            </div>
            <div style={{ padding: '1rem', margin: '1rem 0', backgroundColor: '#fff3e0', borderRadius: '8px' }}>
              <strong>Phase 7</strong>: 本番運用・監視設定
            </div>
          </div>
        </section>

        <section>
          <h2>🎯 現在の進捗</h2>
          <div style={{ textAlign: 'left' }}>
            <p><strong>✅ 完了済み</strong></p>
            <ul>
              <li>バックエンドAPI実装</li>
              <li>データベース設計・実装</li>
              <li>Firebase認証統合</li>
              <li>CI/CDパイプライン構築</li>
              <li>monorepo構成完成</li>
            </ul>
            
            <p><strong>🔄 実装中</strong></p>
            <ul>
              <li>フロントエンド基盤構築</li>
              <li>静的ページ実装</li>
              <li>デプロイ自動化</li>
            </ul>
          </div>
        </section>
      </main>

      <footer style={{ marginTop: '3rem', color: '#666' }}>
        <p>
          Stay tuned for updates! 🚀
        </p>
      </footer>
    </div>
  )
}

export default ComingSoon