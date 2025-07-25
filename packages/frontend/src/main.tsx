/**
 * アプリケーションのエントリーポイント
 * 
 * Reactアプリケーションの初期化を行う。
 * 最低限の実装でCI/CDパイプライン完成を優先。
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// ルート要素の存在確認（型安全性重視）
const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found')
}

// Reactアプリケーション初期化
createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)