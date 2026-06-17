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

特点：签名为 `(req, res, next)`、调用 `next()` 传递控制权、显式 `void` 返回类型。

### 入口文件的路由挂载模式（参考 src/index.ts）

```typescript
import express from 'express';
import tasksRouter from './routes/tasks';
import statsRouter from './routes/stats';
import { requestLogger } from './middleware/requestLogger';

const app = express();
app.use(express.json());
app.use(requestLogger);
app.use('/api/tasks', statsRouter);
app.use('/api/tasks', tasksRouter);

export default app;
```

特点：用 `import` 导入路由/中间件、`app.use()` 挂载、`export default app`。

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

特点：supertest + `request(app).get()`、检查 `status` + `body`、每个 `it` 一个场景。

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
