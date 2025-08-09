/**
 * Cloudflare Workers TODOアプリケーション
 *
 * Hono + OpenAPI + Drizzle ORMを使用したTODO管理システム。
 * RESTful APIエンドポイントを提供。
 */
import { fromHono } from 'chanfana';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { TaskCreate } from './endpoints/taskCreate';
import { TaskDelete } from './endpoints/taskDelete';
import { TaskFetch } from './endpoints/taskFetch';
import { TaskList } from './endpoints/taskList';
import { TaskUpdate } from './endpoints/taskUpdate';
import { VerifyAuth, GetCurrentUser } from './routes/auth';
import { type Env } from './types';

// Honoアプリケーションの初期化
const app = new Hono<{ Bindings: Env }>();

// ミドルウェア設定
app.use('*', logger()); // アクセスログ出力
/**
 * 環境に応じた許可オリジンを取得
 *
 * 開発環境と本番環境で異なるフロントエンドURLを
 * 適切に設定し、セキュリティを保ちながらCORS制御を行う。
 *
 * @param env - Cloudflare Workers環境変数
 * @returns 許可するオリジンの配列
 */
function getAllowedOrigins(env: Env): string[] {
  const baseOrigins = [
    'http://localhost:3000', // 開発環境（React dev server）
    'http://localhost:5173', // 開発環境（Vite dev server）
  ];

  // 本番環境では本番フロントエンドURLを追加
  if (env.ENVIRONMENT === 'production') {
    baseOrigins.push('https://cloudflare-todo-sample-frontend.pages.dev');
  }

  return baseOrigins;
}

app.use('*', (c, next) => {
  const corsMiddleware = cors({
    // CORS設定（フロントエンド連携用）
    origin: getAllowedOrigins(c.env),
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  });
  return corsMiddleware(c, next);
});

// OpenAPIレジストリ設定
const openapi = fromHono(app, {
  docs_url: '/',
});

// 認証エンドポイントの登録
openapi.post('/api/auth/verify', VerifyAuth);
openapi.get('/api/auth/me', GetCurrentUser);

// TODOエンドポイントの登録
openapi.get('/api/todos', TaskList);
openapi.post('/api/todos', TaskCreate);
openapi.get('/api/todos/:taskSlug', TaskFetch);
openapi.patch('/api/todos/:taskSlug', TaskUpdate);
openapi.delete('/api/todos/:taskSlug', TaskDelete);

// ヘルスチェックエンドポイント
app.get('/health', c => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// レガシーエンドポイント（後方互換性のため）
openapi.get('/api/tasks', TaskList);
openapi.post('/api/tasks', TaskCreate);
openapi.get('/api/tasks/:taskSlug', TaskFetch);
openapi.patch('/api/tasks/:taskSlug', TaskUpdate);
openapi.delete('/api/tasks/:taskSlug', TaskDelete);

// Honoアプリケーションのエクスポート
export default app;
