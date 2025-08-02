/**
 * ランディングページコンポーネント
 * 
 * モダンデザインによるプロジェクト紹介ページ。
 * ヒーローセクション、技術スタック、機能紹介を含む。
 * グラデーション、アニメーション、レスポンシブ対応。
 */
import { Link } from 'react-router-dom'

/**
 * ランディングページ
 * 
 * Cloudflare Todo Sample アプリケーションの
 * モダンなプロジェクト紹介ページ。
 */
function Landing() {
  return (
    <div data-testid="landing-page" className="min-h-screen bg-gradient-hero">
      {/* ヒーローセクション */}
      <section className="relative overflow-hidden">
        <div className="bg-hero-pattern absolute inset-0 opacity-30"></div>
        <div className="container-app relative">
          <div className="text-center section-padding">
            <div className="animate-fade-in">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                <span className="text-gradient-hero">Cloudflare</span>
                <br className="sm:hidden" />
                <span className="text-secondary-900"> Todo Sample</span>
              </h1>
              <p className="text-lg sm:text-xl text-secondary-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                学習用TODOアプリケーション - 現代的技術スタックによるフルスタック実装
              </p>
            </div>
            
            {/* CTA ボタン */}
            <div className="animate-slide-up flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                to="/login" 
                className="btn-primary px-8 py-3 text-base shadow-colored hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                ログイン
              </Link>
              <Link 
                to="/signup" 
                className="btn-success px-8 py-3 text-base shadow-colored hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                サインアップ
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* プロジェクト概要セクション */}
      <section className="bg-white">
        <div className="container-app section-padding">
          <div className="animate-slide-up max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-secondary-900 mb-4">
                <span className="text-gradient">📖 プロジェクト概要</span>
              </h2>
              <p className="text-lg text-secondary-600 leading-relaxed">
                このプロジェクトは、現代的なWeb開発技術を学習するための
                TODOアプリケーションです。Cloudflareエコシステムを活用した
                フルスタック実装を通じて、実践的な開発スキルを身につけます。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 技術スタックセクション */}
      <section className="bg-gradient-card">
        <div className="container-app section-padding">
          <div className="animate-slide-up">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-secondary-900 mb-4">
                <span className="text-gradient">🛠️ 技術スタック</span>
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              <div className="card-hover p-6">
                <div className="text-center mb-4">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">🖥️</span>
                  </div>
                  <h3 className="text-xl font-semibold text-secondary-900">フロントエンド</h3>
                </div>
                <ul className="space-y-2 text-secondary-600">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-primary-500 rounded-full mr-3"></span>
                    React 18 + TypeScript
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-primary-500 rounded-full mr-3"></span>
                    Vite + Tailwind CSS
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-primary-500 rounded-full mr-3"></span>
                    ESLint + Prettier
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-primary-500 rounded-full mr-3"></span>
                    Vitest + Playwright
                  </li>
                </ul>
              </div>
              
              <div className="card-hover p-6">
                <div className="text-center mb-4">
                  <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <h3 className="text-xl font-semibold text-secondary-900">バックエンド</h3>
                </div>
                <ul className="space-y-2 text-secondary-600">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-warning-500 rounded-full mr-3"></span>
                    Cloudflare Workers
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-warning-500 rounded-full mr-3"></span>
                    Hono Framework
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-warning-500 rounded-full mr-3"></span>
                    Drizzle ORM + D1
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-warning-500 rounded-full mr-3"></span>
                    Firebase Auth
                  </li>
                </ul>
              </div>
              
              <div className="card-hover p-6">
                <div className="text-center mb-4">
                  <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">🚀</span>
                  </div>
                  <h3 className="text-xl font-semibold text-secondary-900">インフラ・運用</h3>
                </div>
                <ul className="space-y-2 text-secondary-600">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-success-500 rounded-full mr-3"></span>
                    Cloudflare Pages
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-success-500 rounded-full mr-3"></span>
                    GitHub Actions
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-success-500 rounded-full mr-3"></span>
                    pnpm Monorepo
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-success-500 rounded-full mr-3"></span>
                    OpenAPI Spec
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 機能セクション */}
      <section className="bg-white">
        <div className="container-app section-padding">
          <div className="animate-slide-up max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* 実装済み機能 */}
              <div className="card-soft p-8">
                <div className="flex items-center mb-6">
                  <div className="w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-xl">🎯</span>
                  </div>
                  <h2 className="text-2xl font-bold text-secondary-900">実装済み機能</h2>
                </div>
                <div className="space-y-3">
                  {[
                    'バックエンドAPI (CRUD操作、認証、バリデーション)',
                    'データベーススキーマ (Drizzle ORM)',
                    'Firebase Authentication統合',
                    'CI/CDパイプライン',
                    '共通型定義パッケージ',
                    '包括的テストスイート',
                    'モダンUI/UXデザイン'
                  ].map((feature, index) => (
                    <div key={index} className="flex items-start">
                      <svg className="w-4 h-4 text-success-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-secondary-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 今後の実装予定 */}
              <div className="card-soft p-8">
                <div className="flex items-center mb-6">
                  <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-xl">🚧</span>
                  </div>
                  <h2 className="text-2xl font-bold text-secondary-900">拡張可能性</h2>
                </div>
                <div className="space-y-3">
                  {[
                    { text: 'リアルタイム同期 (WebSocket)', status: 'planning' },
                    { text: 'ファイル添付機能 (R2)', status: 'planning' },
                    { text: 'プッシュ通知', status: 'planning' },
                    { text: 'オフライン対応 (PWA)', status: 'planning' },
                    { text: 'チーム・共有機能', status: 'future' },
                    { text: 'カレンダー連携', status: 'future' },
                    { text: '国際化 (i18n)', status: 'future' }
                  ].map((feature, index) => (
                    <div key={index} className="flex items-start">
                      <svg className="w-4 h-4 text-primary-400 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex items-center">
                        <span className="text-secondary-700 mr-2">{feature.text}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          feature.status === 'planning' 
                            ? 'bg-warning-100 text-warning-700' 
                            : 'bg-secondary-100 text-secondary-600'
                        }`}>
                          {feature.status === 'planning' ? '計画中' : '将来'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* フッター */}
      <footer className="bg-secondary-900 text-white">
        <div className="container-app py-12">
          <div className="text-center">
            <div className="flex justify-center items-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-success-500 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold">T</span>
              </div>
              <span className="text-xl font-bold">Cloudflare Todo Sample</span>
            </div>
            <p className="text-secondary-300 mb-2">
              Built with ❤️ using Cloudflare Workers, React, and TypeScript
            </p>
            <div className="flex justify-center items-center space-x-4 text-sm text-secondary-400">
              <span className="flex items-center">
                <span className="w-2 h-2 bg-success-500 rounded-full mr-2"></span>
                本番稼働中
              </span>
              <span>•</span>
              <span>学習目的プロジェクト</span>
              <span>•</span>
              <span>2025年7月28日更新</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing