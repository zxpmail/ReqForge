import { Router, Request, Response } from 'express';
import { getAllTasks } from '../storage';

const router = Router();

router.get('/stats', (_req: Request, res: Response) => {
  const tasks = getAllTasks();

  const byStatus: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  const allCategories = ['feature', 'bug', 'chore', 'docs'];

  for (const task of tasks) {
    byStatus[task.status] = (byStatus[task.status] || 0) + 1;
    byCategory[task.category] = (byCategory[task.category] || 0) + 1;
  }

  // Ensure zero-count categories are included
  for (const cat of allCategories) {
    if (!(cat in byCategory)) byCategory[cat] = 0;
  }

  res.json({ total: tasks.length, byStatus, byCategory });
});

export default router;
