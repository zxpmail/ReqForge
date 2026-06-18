import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index';

describe('GET /api/tasks', () => {
  it('returns all tasks', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(200);
    expect(res.body.tasks).toHaveLength(2);
    expect(res.body.total).toBe(2);
  });
});

describe('POST /api/tasks', () => {
  it('creates a new task', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'New task', description: 'desc', category: 'feature' });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('New task');
    expect(res.body.status).toBe('pending');
  });

  it('rejects missing title', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ category: 'bug' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('title');
  });

  it('rejects invalid category', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'test', category: 'invalid' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid category');
  });
});

describe('DELETE /api/tasks/:id', () => {
  it('deletes existing task', async () => {
    const res = await request(app).delete('/api/tasks/1');
    expect(res.status).toBe(204);
  });

  it('returns 404 for missing task', async () => {
    const res = await request(app).delete('/api/tasks/999');
    expect(res.status).toBe(404);
  });
});
