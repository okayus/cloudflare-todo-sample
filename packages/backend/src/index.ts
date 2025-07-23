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
import { type Env } from './types';

// Honoアプリケーションの初期化
const app = new Hono<{ Bindings: Env }>();

// ミドルウェア設定
app.use('*', logger()); // アクセスログ出力
app.use(
  '*',
  cors({
    // CORS設定（フロントエンド連携用）
    origin: ['http://localhost:3000', 'http://localhost:5173'], // 開発環境
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
);

// OpenAPIレジストリ設定
const openapi = fromHono(app, {
  docs_url: '/',
});

// TODOエンドポイントの登録
openapi.get('/api/todos', TaskList);
openapi.post('/api/todos', TaskCreate);
openapi.get('/api/todos/:taskSlug', TaskFetch);
openapi.put('/api/todos/:taskSlug', TaskUpdate);
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
openapi.put('/api/tasks/:taskSlug', TaskUpdate);
openapi.delete('/api/tasks/:taskSlug', TaskDelete);

// Honoアプリケーションのエクスポート
export default app;
