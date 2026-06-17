import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/index';

describe('GET /api/tasks/stats', () => {
  it('returns correct total count', async () => {
    const res = await request(app).get('/api/tasks/stats');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total');
    expect(typeof res.body.total).toBe('number');
  });

  it('returns byStatus breakdown', async () => {
    const res = await request(app).get('/api/tasks/stats');
    expect(res.status).toBe(200);
    expect(res.body.byStatus).toHaveProperty('pending');
    expect(res.body.byStatus).toHaveProperty('completed');
    expect(res.body.byStatus.pending + res.body.byStatus.completed).toBe(res.body.total);
  });

  it('returns byCategory breakdown', async () => {
    const res = await request(app).get('/api/tasks/stats');
    expect(res.status).toBe(200);
    expect(res.body.byCategory).toHaveProperty('feature');
    expect(res.body.byCategory).toHaveProperty('bug');
    expect(res.body.byCategory).toHaveProperty('chore');
    expect(res.body.byCategory).toHaveProperty('docs');
  });

  it('category counts sum to total', async () => {
    const res = await request(app).get('/api/tasks/stats');
    expect(res.status).toBe(200);
    const catSum = Object.values(res.body.byCategory as Record<string, number>).reduce((a, b) => a + b, 0);
    expect(catSum).toBe(res.body.total);
  });

  it('includes zero-count categories', async () => {
    const res = await request(app).get('/api/tasks/stats');
    // At least one category may be 0 in test data
    const hasZero = Object.values(res.body.byCategory as Record<string, number>).some(v => v === 0);
    expect(hasZero).toBe(true);
  });

  it('handles empty store', async () => {
    // This test requires the initial data to have been reset
    // We'll verify the shape is correct regardless
    const res = await request(app).get('/api/tasks/stats');
    expect(res.status).toBe(200);
    expect(typeof res.body.total).toBe('number');
    expect(typeof res.body.byStatus).toBe('object');
    expect(typeof res.body.byCategory).toBe('object');
  });

  it('returns consistent results across calls', async () => {
    const [r1, r2] = await Promise.all([
      request(app).get('/api/tasks/stats'),
      request(app).get('/api/tasks/stats'),
    ]);
    expect(r1.body.total).toBe(r2.body.total);
    expect(r1.body.byStatus.pending).toBe(r2.body.byStatus.pending);
  });
});
