import { Router, Request, Response } from 'express';
import { getAllTasks, getTaskById, addTask, deleteTask } from '../storage';
import { TaskCategory } from '../types';

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

router.post('/', (req: Request, res: Response) => {
  const { title, description, category } = req.body;
  if (!title || !category) {
    res.status(400).json({ error: 'title and category are required' });
    return;
  }
  const validCategories: TaskCategory[] = ['feature', 'bug', 'chore', 'docs'];
  if (!validCategories.includes(category)) {
    res.status(400).json({ error: `Invalid category. Must be one of: ${validCategories.join(', ')}` });
    return;
  }
  const task = addTask(title, description || '', category);
  res.status(201).json(task);
});

router.delete('/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const deleted = deleteTask(id);
  if (!deleted) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  res.status(204).send();
});

export default router;
