/**
 * ランディングページコンポーネント
 * 
 * プロジェクト概要と技術スタックを紹介する
 * 最低限の静的ページ実装。
 * ログイン・サインアップページへのナビゲーションリンクを含む。
 * 
 * 今後の実装予定機能:
 * - Todo管理画面
 * - リアルタイム同期
 */
import { Link } from 'react-router-dom'

/**
 * ランディングページ
 * 
 * Cloudflare Todo Sample アプリケーションの
 * 概要と技術スタックを表示する。
 */
function Landing() {
  return (
    <div data-testid="landing-page" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1>🌟 Cloudflare Todo Sample</h1>
        <p style={{ fontSize: '1.2rem', color: '#666' }}>
          学習用TODOアプリケーション - 最新技術スタック実装
        </p>
        
        {/* 認証リンクセクション */}
        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link 
            to="/login" 
            style={{ 
              padding: '0.75rem 1.5rem', 
              backgroundColor: '#3b82f6', 
              color: 'white', 
              textDecoration: 'none', 
              borderRadius: '8px',
              fontWeight: '500',
              transition: 'background-color 0.2s',
              display: 'inline-block'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
          >
            🔑 ログイン
          </Link>
          <Link 
            to="/signup" 
            style={{ 
              padding: '0.75rem 1.5rem', 
              backgroundColor: '#10b981', 
              color: 'white', 
              textDecoration: 'none', 
              borderRadius: '8px',
              fontWeight: '500',
              transition: 'background-color 0.2s',
              display: 'inline-block'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#059669'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
          >
            ✨ サインアップ
          </Link>
        </div>
      </header>

      <main>
        <section style={{ marginBottom: '2rem' }}>
          <h2>📖 プロジェクト概要</h2>
          <p>
            このプロジェクトは、現代的なWeb開発技術を学習するための
            TODOアプリケーションです。Cloudflareエコシステムを活用した
            フルスタック実装を通じて、実践的な開発スキルを身につけます。
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2>🛠️ 技術スタック</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
              <h3>🖥️ フロントエンド</h3>
              <ul>
                <li>React 18 + TypeScript</li>
                <li>Vite (高速バンドラー)</li>
                <li>ESLint + Prettier</li>
                <li>Vitest (テストフレームワーク)</li>
              </ul>
            </div>
            
            <div style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
              <h3>⚡ バックエンド</h3>
              <ul>
                <li>Cloudflare Workers</li>
                <li>Hono (高速Webフレームワーク)</li>
                <li>Drizzle ORM + D1 Database</li>
                <li>Firebase Authentication</li>
              </ul>
            </div>
            
            <div style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
              <h3>🚀 インフラ・運用</h3>
              <ul>
                <li>Cloudflare Pages (フロントエンド)</li>
                <li>Cloudflare D1 (データベース)</li>
                <li>GitHub Actions (CI/CD)</li>
                <li>pnpm Monorepo</li>
              </ul>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2>🎯 実装済み機能</h2>
          <ul>
            <li>✅ バックエンドAPI (CRUD操作、認証、バリデーション)</li>
            <li>✅ データベーススキーマ (Drizzle ORM)</li>
            <li>✅ Firebase Authentication統合</li>
            <li>✅ CI/CDパイプライン</li>
            <li>✅ 共通型定義パッケージ</li>
            <li>✅ 包括的テストスイート</li>
          </ul>
        </section>

        <section>
          <h2>🚧 今後の実装予定</h2>
          <ul>
            <li>✅ 認証UI (ログイン・サインアップ)</li>
            <li>🔄 Todo管理画面 (作成・編集・削除)</li>
            <li>🔄 リアルタイム同期</li>
            <li>🔄 レスポンシブデザイン強化</li>
            <li>🔄 PWA対応</li>
          </ul>
        </section>
      </main>

      <footer style={{ textAlign: 'center', marginTop: '3rem', color: '#666' }}>
        <p>
          Built with ❤️ using Cloudflare Workers, React, and TypeScript
        </p>
        <p style={{ fontSize: '0.9rem' }}>
          Phase 4: 最低限フロントエンド実装 (CI/CDパイプライン完成)
        </p>
      </footer>
    </div>
  )
}

export default Landing