### 已有路由的结构模式（参考 src/routes/tasks.ts）

```typescript
import { Router, Request, Response } from 'express';
import { getAllTasks, getTaskById } from '../storage';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const tasks = getAllTasks();
  res.json({ tasks, total: tasks.length });
});

router.get('/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const task = getTaskById(id);
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  res.json(task);
});

export default router;
```

特点：`Router()` 创建、处理函数签名 `(req, res)`、错误返回 `res.status(4xx).json({ error: 'message' })`、`export default router`。

### 已有中间件的模式（参考 src/middleware/requestLogger.ts）

```typescript
import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, _res: Response, next: NextFunction): void {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
}
```

特点：签名为 `(req, res, next)`、调用 `next()` 传递控制权。

### 数据存储模式（参考 src/storage.ts）

```typescript
import { Task } from './types';

const tasks: Task[] = [
  { id: 1, title: 'Setup CI', description: 'Configure GitHub Actions', status: 'completed', category: 'chore', createdAt: '2026-01-01T00:00:00Z' },
  { id: 2, title: 'Fix login bug', description: 'Session expires too early', status: 'pending', category: 'bug', createdAt: '2026-01-02T00:00:00Z' },
];

export function getAllTasks(): Task[] { return [...tasks]; }
```

特点：模块级函数、`export function`、返回副本（`[...tasks]`）、从 `../types` 导入类型。

### 数据模型（参考 src/types.ts）

```typescript
export interface Task {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'completed';
  category: 'feature' | 'bug' | 'chore' | 'docs';
  createdAt: string;
}
```

特点：`export interface`、TypeScript 联合类型 `'pending' | 'completed'`。

### 已有测试的模式（参考 src/__tests__/tasks.test.ts）

```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index';

describe('GET /api/tasks', () => {
  it('returns all tasks', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(200);
    expect(res.body.tasks).toHaveLength(2);
  });
});
```

特点：vitest + `describe`/`it`/`expect`、每个 `it` 一个场景。
