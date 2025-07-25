/**
 * メインアプリケーションコンポーネント
 * 
 * 最低限の静的ページのみ実装。
 * Landing Page のコンテンツを表示する。
 */
import Landing from './components/Landing'

/**
 * メインアプリケーション
 * 
 * Phase 4では最低限実装のため、
 * ルーティングは次のフェーズで実装予定。
 */
function App() {
  return (
    <div className="App">
      <Landing />
    </div>
  )
}

export default App