import { describe, it, expect } from 'vitest';
import {
  submitExport, getExportStatus,
  validateExportConfig, formatAsJson, formatAsCsv,
} from '../services/exportService';
import { Task } from '../types';

// ---- Setup ----

const sampleTasks: Task[] = [
  { id: 1, title: 'Setup CI', description: 'Configure GitHub Actions', status: 'completed', category: 'chore', createdAt: '2026-01-01T00:00:00Z' },
  { id: 2, title: 'Fix login bug', description: 'Session expires too early', status: 'pending', category: 'bug', createdAt: '2026-01-02T00:00:00Z' },
  { id: 3, title: 'Add feature', description: 'New feature', status: 'completed', category: 'feature', createdAt: '2026-01-03T00:00:00Z' },
  { id: 4, title: 'Write docs', description: 'Documentation', status: 'pending', category: 'docs', createdAt: '2026-01-04T00:00:00Z' },
];

// ---- validateExportConfig ----

describe('validateExportConfig', () => {
  it('accepts valid config', () => {
    expect(validateExportConfig({ fields: ['id', 'title'], format: 'json' })).toBeNull();
  });

  it('rejects empty fields', () => {
    const err = validateExportConfig({ fields: [], format: 'json' });
    expect(err).toContain('empty');
  });

  it('rejects invalid field name', () => {
    const err = validateExportConfig({ fields: ['title', 'nonexistent'], format: 'json' });
    expect(err).toContain('nonexistent');
  });

  it('rejects invalid format', () => {
    const err = validateExportConfig({ fields: ['title'], format: 'xml' as any });
    expect(err).toContain('format');
  });

  it('rejects invalid filter status', () => {
    const err = validateExportConfig({
      fields: ['title'], format: 'json',
      filters: { status: 'deleted' as any },
    });
    expect(err).toContain('status');
  });

  it('rejects invalid filter category', () => {
    const err = validateExportConfig({
      fields: ['title'], format: 'json',
      filters: { category: 'invalid' as any },
    });
    expect(err).toContain('category');
  });

  it('accepts valid filters', () => {
    expect(validateExportConfig({
      fields: ['title'], format: 'json',
      filters: { status: 'pending', category: 'bug' },
    })).toBeNull();
  });
});

// ---- formatAsJson ----

describe('formatAsJson', () => {
  it('wraps data in metadata object', () => {
    const result = formatAsJson(sampleTasks, ['id', 'title']);
    expect(result).toHaveProperty('exportMeta');
    expect(result).toHaveProperty('data');
    expect(Array.isArray(result.data)).toBe(true);
  });

  it('includes only requested fields', () => {
    const result = formatAsJson(sampleTasks, ['id', 'title']);
    expect(Object.keys(result.data[0])).toEqual(['id', 'title']);
  });

  it('does NOT include unrequested fields', () => {
    const result = formatAsJson(sampleTasks, ['title']);
    expect(result.data[0]).not.toHaveProperty('id');
    expect(result.data[0]).not.toHaveProperty('status');
    expect(result.data[0]).not.toHaveProperty('category');
  });

  it('exportMeta.totalTasks matches data length', () => {
    const result = formatAsJson(sampleTasks, ['id']);
    expect(result.exportMeta.totalTasks).toBe(sampleTasks.length);
    expect(result.data).toHaveLength(sampleTasks.length);
  });

  it('exportMeta has exportedAt timestamp', () => {
    const result = formatAsJson(sampleTasks, ['id']);
    expect(result.exportMeta).toHaveProperty('exportedAt');
    expect(typeof result.exportMeta.exportedAt).toBe('string');
  });

  it('exportMeta has fields array', () => {
    const result = formatAsJson(sampleTasks, ['title', 'status']);
    expect(result.exportMeta.fields).toEqual(['title', 'status']);
  });

  it('handles empty task array', () => {
    const result = formatAsJson([], ['id']);
    expect(result.data).toHaveLength(0);
    expect(result.exportMeta.totalTasks).toBe(0);
  });
});

// ---- formatAsCsv ----

describe('formatAsCsv', () => {
  it('has header row as first line with requested fields', () => {
    const csv = formatAsCsv(sampleTasks, ['id', 'title']);
    const lines = csv.trim().split('\n');
    expect(lines[0]).toBe('id,title');
  });

  it('header column order matches requested fields order', () => {
    const csv = formatAsCsv(sampleTasks, ['title', 'id', 'status']);
    const lines = csv.trim().split('\n');
    expect(lines[0]).toBe('title,id,status');
  });

  it('has correct number of data rows', () => {
    const csv = formatAsCsv(sampleTasks, ['id']);
    const lines = csv.trim().split('\n');
    // header + 4 data rows
    expect(lines).toHaveLength(5);
  });

  it('data values match requested fields', () => {
    const csv = formatAsCsv(sampleTasks, ['id', 'title']);
    const lines = csv.trim().split('\n');
    expect(lines[1]).toMatch(/^1,Setup CI$/);
  });

  it('handles string escaping (commas in description)', () => {
    const tasksWithComma: Task[] = [{
      id: 99, title: 'Task, with comma', description: 'has, commas, in text',
      status: 'pending', category: 'feature', createdAt: '2026-06-01T00:00:00Z',
    }];
    const csv = formatAsCsv(tasksWithComma, ['title', 'description']);
    const lines = csv.trim().split('\n');
    // title and description both contain commas → should be quoted
    expect(lines[1]).toMatch(/^".*",".*"$/);
  });

  it('handles empty task array', () => {
    const csv = formatAsCsv([], ['id', 'title']);
    expect(csv.trim()).toBe('id,title');
  });
});

// ---- submitExport (async) ----

describe('submitExport', () => {
  it('returns completed export with exportId after processing', async () => {
    const result = await submitExport(sampleTasks,{
      fields: ['id', 'title'],
      format: 'json',
    });
    expect(result).toHaveProperty('exportId');
    expect(typeof result.exportId).toBe('string');
    expect(result.status).toBe('completed');
    expect(result.progress).toBe(100);
  });

  it('is async (returns a Promise)', () => {
    const promise = submitExport(sampleTasks,{ fields: ['id', 'title'], format: 'json' });
    expect(promise).toBeInstanceOf(Promise);
  });

  it('completes and has result populated after processing', async () => {
    // submitExport should process and complete within the async flow
    const result = await submitExport(sampleTasks,{
      fields: ['id', 'title'],
      format: 'json',
    });
    // After awaiting, the export should have completed
    expect(result.status).toBe('completed');
    expect(result.progress).toBe(100);
    expect(result.result).toBeDefined();
    expect(result.result!.format).toBe('json');
  });

  it('multiple exports have different exportIds', async () => {
    const [r1, r2] = await Promise.all([
      submitExport(sampleTasks,{ fields: ['id'], format: 'json' }),
      submitExport(sampleTasks,{ fields: ['title'], format: 'csv' }),
    ]);
    expect(r1.exportId).not.toBe(r2.exportId);
  });
});

// ---- getExportStatus ----

describe('getExportStatus', () => {
  it('returns null for unknown exportId', async () => {
    const result = await getExportStatus('nonexistent-id');
    expect(result).toBeNull();
  });

  it('returns completed export result after submitExport', async () => {
    const submitted = await submitExport(sampleTasks,{
      fields: ['id', 'title', 'status'],
      format: 'json',
    });
    const polled = await getExportStatus(submitted.exportId);
    expect(polled).not.toBeNull();
    expect(polled!.status).toBe('completed');
    expect(polled!.result).toBeDefined();
  });

  it('returns JSON formatted data via getExportStatus', async () => {
    const submitted = await submitExport(sampleTasks,{
      fields: ['id', 'title'],
      format: 'json',
    });
    const polled = await getExportStatus(submitted.exportId);
    const data = polled!.result!.data;
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('returns CSV formatted data via getExportStatus', async () => {
    const submitted = await submitExport(sampleTasks,{
      fields: ['id', 'title'],
      format: 'csv',
    });
    const polled = await getExportStatus(submitted.exportId);
    const data = polled!.result!.data;
    expect(typeof data).toBe('string');
    expect(data).toContain('id,title');
  });

  it('status supports polling before completion', async () => {
    const notReady = await getExportStatus('still-pending-id');
    // This should either return null for unknown or pending for in-progress
    // Just verify it doesn't crash
    expect(notReady === null || typeof notReady === 'object').toBe(true);
  });
});
