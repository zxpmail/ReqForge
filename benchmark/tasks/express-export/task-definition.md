# Task: Express API — Add configurable data export system

## Background

Express task management API. Existing structure:
- `src/types.ts` — `Task` interface with id, title, description, status, category, createdAt
- `src/storage.ts` — in-memory storage with `getAllTasks()` returning Task[]
- `src/routes/tasks.ts` — CRUD routes for tasks (GET, POST, DELETE)
- `src/middleware/requestLogger.ts` — existing request logging middleware
- `src/index.ts` — app setup with middleware and route mounting

## Requirement

Create a data export system. Users submit an export configuration (chosen fields, output format, optional filters), the system processes it asynchronously, and the result can be polled and retrieved.

### Function signatures in `src/services/exportService.ts`

```typescript
interface ExportConfig {
  fields: string[];            // Task field names to include
  format: 'json' | 'csv';     // Output format
  filters?: {
    status?: 'pending' | 'completed';
    category?: 'feature' | 'bug' | 'chore' | 'docs';
    startDate?: string;        // ISO date YYYY-MM-DD
    endDate?: string;          // ISO date YYYY-MM-DD
  };
}

interface ExportResult {
  exportId: string;            // Unique ID for this export
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;            // 0-100
  result?: {
    data: any;                 // Formatted output data
    format: string;            // 'json' or 'csv'
    exportedAt: string;        // ISO timestamp
  };
  error?: string;
}

// Submit a new export. Accepts tasks array and config, stores export in memory,
// processes asynchronously (setTimeout + Promise), resolves when complete.
async function submitExport(tasks: Task[], config: ExportConfig): Promise<ExportResult>;

// Poll the status/result of a previously submitted export
async function getExportStatus(exportId: string): Promise<ExportResult | null>;

// Validate export configuration; returns error message string, or null if valid
function validateExportConfig(config: ExportConfig): string | null;

// Format task data as JSON (preserve structure, wrap in metadata)
function formatAsJson(tasks: Task[], fields: string[]): object;

// Format task data as CSV (flatten to rows, first row = headers)
function formatAsCsv(tasks: Task[], fields: string[]): string;
```

### Behavioral requirements

#### Export lifecycle
1. `submitExport(config)` creates an export with `status: 'pending'`, `progress: 0`, unique `exportId`
2. Processing is simulated with `setTimeout` + Promise (async, use `await`)
3. On completion, the export has `status: 'completed'`, `progress: 100`, and `result` populated
4. Multiple exports must be tracked independently (each gets a unique exportId)

#### Validation (`validateExportConfig`)
1. `fields` must be non-empty → error `"fields cannot be empty"`
2. Each field must be a valid Task property name (`id`, `title`, `description`, `status`, `category`, `createdAt`) → error `"invalid field: <name>"`
3. `format` must be `'json'` or `'csv'` → error `"format must be 'json' or 'csv'"`
4. If `filters.status` is provided, must be `'pending'` or `'completed'`
5. If `filters.category` is provided, must be `'feature'`, `'bug'`, `'chore'`, or `'docs'`
6. If `filters.startDate` or `filters.endDate` is provided, must be valid ISO date YYYY-MM-DD

#### JSON format (`formatAsJson`)
1. Output structure: `{ exportMeta: { exportedAt, totalTasks, fields }, data: [ ... ] }`
2. Items in `data` array contain only the requested fields (not all Task properties)
3. `totalTasks` = number of items in `data`

#### CSV format (`formatAsCsv`)
1. First row is a header row with field names matching the requested `fields` array order
2. Subsequent rows are the data values in the same column order
3. Values containing commas, newlines, or double quotes must be properly escaped (wrapped in double quotes, internal quotes doubled)

#### Filter application
1. Filters apply BEFORE formatting (format function receives only the filtered tasks)
2. If `filters.status` provided, only include tasks with matching status
3. If `filters.category` provided, only include tasks with matching category
4. Date filtering: task.createdAt >= startDate AND task.createdAt <= endDate (inclusive)
   - Parse dates with `new Date(startDate + 'T00:00:00Z')` / `new Date(endDate + 'T23:59:59Z')`
5. No filters → all tasks included

### Route handler behavior (`src/routes/export.ts`)

Two endpoints following existing Router patterns:

1. **POST /api/exports** — Submit a new export
   - Reads `ExportConfig` from `req.body`
   - Calls `validateExportConfig(config)` → if invalid, respond 400 `{ error: '<message>' }`
   - Calls `submitExport(config)` with the validated config
   - Responds 201 with the ExportResult (pending state)

2. **GET /api/exports/:id** — Poll export status/result
   - Calls `getExportStatus(req.params.id)`
   - If null, respond 404 `{ error: 'Export not found' }`
   - Otherwise respond 200 with the ExportResult (may be pending, processing, or completed)

See existing route patterns: `Router()`, `res.status(4xx).json({ error: '...' })`, `export default router`.

### Files

Create **two files**:
1. `src/services/exportService.ts` — All export logic (validate, submit, poll, format)
2. `src/routes/export.ts` — Express route handler (POST + GET endpoints)

### Red lines

- Don't modify `src/routes/tasks.ts`, `src/storage.ts`, `src/types.ts`, `src/index.ts`, or any other existing files
- All function signatures above must match exactly (tests import by name)
- Import `getAllTasks` from `../storage` in the route handler, pass tasks to `submitExport`
