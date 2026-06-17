import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildReport } from '../services/reportService';

// Sample task factory
const task = (id: number, status: string, category: string, date: string) => ({
  id, title: `Task ${id}`, description: `desc ${id}`, status, category, createdAt: date,
});

const tasks = [
  task(1, 'pending', 'bug', '2026-01-01T00:00:00.000Z'),
  task(2, 'completed', 'feature', '2026-01-02T00:00:00.000Z'),
];

describe('buildReport', () => {
  it('returns total count and filtered count', async () => {
    const r = await buildReport(tasks, {});
    expect(r.total).toBe(2);
    expect(r.filtered).toBe(2);
  });

  it('groups by status by default', async () => {
    const r = await buildReport(tasks, {});
    expect(r.groupBy).toBe('status');
    expect(r.groups.pending.count).toBe(1);
    expect(r.groups.completed.count).toBe(1);
  });

  it('groups by category', async () => {
    const r = await buildReport(tasks, { groupBy: 'category' });
    expect(r.groupBy).toBe('category');
    expect(r.groups.feature.count).toBe(1);
    expect(r.groups.bug.count).toBe(1);
  });

  it('includes ALL category groups including zero-count', async () => {
    const r = await buildReport(tasks, { groupBy: 'category' });
    expect(r.groups.feature).toBeDefined();
    expect(r.groups.bug).toBeDefined();
    // Should also include categories that have 0 tasks
    const cats = Object.keys(r.groups);
    expect(cats).toContain('chore');
    expect(cats).toContain('docs');
    expect(r.groups.chore.count).toBe(0);
    expect(r.groups.docs.count).toBe(0);
  });

  it('groups have count and items properties', async () => {
    const r = await buildReport(tasks, {});
    for (const key of Object.keys(r.groups)) {
      expect(r.groups[key]).toHaveProperty('count');
      expect(r.groups[key]).toHaveProperty('items');
      expect(Array.isArray(r.groups[key].items)).toBe(true);
    }
  });

  it('group count matches items array length', async () => {
    const r = await buildReport(tasks, {});
    for (const key of Object.keys(r.groups)) {
      expect(r.groups[key].count).toBe(r.groups[key].items.length);
    }
  });

  it('filters by date range — single day returns 1 task', async () => {
    const r = await buildReport(tasks, { startDate: '2026-01-01', endDate: '2026-01-01' });
    expect(r.filtered).toBe(1);
    expect(r.total).toBe(2);
  });

  it('filters by date range — both tasks in range', async () => {
    const r = await buildReport(tasks, {
      startDate: '2026-01-01', endDate: '2026-01-02',
    });
    expect(r.filtered).toBe(2);
  });

  it('returns 0 filtered when no tasks in date range', async () => {
    const r = await buildReport(tasks, {
      startDate: '2025-01-01', endDate: '2025-12-31',
    });
    expect(r.filtered).toBe(0);
    expect(r.groups.pending.count).toBe(0);
    expect(r.groups.completed.count).toBe(0);
  });

  it('handles startDate only (no upper bound)', async () => {
    const r = await buildReport(tasks, { startDate: '2026-01-02' });
    expect(r.filtered).toBe(1);
  });

  it('handles endDate only (no lower bound)', async () => {
    const r = await buildReport(tasks, { endDate: '2026-01-01' });
    expect(r.filtered).toBe(1);
  });

  it('handles empty task array', async () => {
    const r = await buildReport([], {});
    expect(r.total).toBe(0);
    expect(r.filtered).toBe(0);
    expect(r.groups.pending.count).toBe(0);
    expect(r.groups.completed.count).toBe(0);
  });

  it('is async (returns a promise)', async () => {
    const r = buildReport(tasks, {});
    expect(r).toBeInstanceOf(Promise);
  });

  it('completes within reasonable time (async setTimeout)', async () => {
    const t0 = Date.now();
    await buildReport(tasks, {});
    const elapsed = Date.now() - t0;
    expect(elapsed).toBeLessThan(2000);
  });
});
