/**
 * メインアプリケーションコンポーネント
 * 
 * Firebase認証とReact Routerを統合したSPAアプリケーション。
 * 認証状態に基づく条件付きルーティングを提供。
 */
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { AppRouter } from './components/AppRouter'

/**
 * メインアプリケーション
 * 
 * 認証プロバイダーとルーターを組み合わせて、
 * 完全な認証機能付きSPAを構築。
 * 
 * 構成:
 * - AuthProvider: Firebase認証状態の管理
 * - BrowserRouter: HTML5 History APIを使用したルーティング
 * - AppRouter: アプリケーション固有のルーティング設定
 */
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="App">
          <AppRouter />
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App