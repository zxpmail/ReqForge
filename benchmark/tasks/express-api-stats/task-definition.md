# Task: Express API — Add report service with filtering and grouping

## Background

Express task management API. Existing structure:
- `src/types.ts` — `Task` interface with id, title, description, status, category, createdAt
- `src/storage.ts` — in-memory storage with `getAllTasks()` returning Task[]
- `src/routes/tasks.ts` — CRUD routes for tasks (GET, POST, DELETE)
- `src/middleware/requestLogger.ts` — existing request logging middleware
- `src/index.ts` — app setup with middleware and route mounting

## Requirement

Expose `buildReport` function in `src/services/reportService.ts` that takes a list of tasks and filter parameters, and returns filtered + grouped statistics.

### Function signature

```typescript
interface ReportFilters {
  startDate?: string;  // ISO date YYYY-MM-DD
  endDate?: string;    // ISO date YYYY-MM-DD
  groupBy?: string;    // "status" or "category" (default: "status")
}

interface ReportGroup {
  count: number;
  items: Task[];
}

interface ReportResult {
  total: number;
  filtered: number;
  groupBy: string;
  groups: Record<string, ReportGroup>;
}

async function buildReport(tasks: Task[], filters: ReportFilters): Promise<ReportResult>
```

### Behavioral requirements

1. `total` = `tasks.length` (pre-filter count)
2. `filtered` = number of tasks matching date filter (all tasks if no date filter)
3. `groups` = tasks grouped by the `groupBy` field, each group has `count` (number) and `items` (array of Task objects)
4. Date filtering: task.createdAt >= startDate AND task.createdAt <= endDate (inclusive)
   - If only `startDate` is provided, filter from that date forward (no upper bound)
   - If only `endDate` is provided, filter up to that date (no lower bound)
   - Parse dates with `new Date(startDate + 'T00:00:00Z')` / `new Date(endDate + 'T23:59:59Z')`
5. `groupBy` defaults to `"status"` when not provided or undefined
6. Empty groups (no tasks in a given status/category) should have `{ count: 0, items: [] }` — include ALL possible categories or statuses
7. No tasks match filter → all groups have count 0, items empty
8. **Async operation**: wrap the computation in a `setTimeout` + Promise to simulate async (use `await`)

### Files

Create **two files**:
1. `src/services/reportService.ts` — buildReport function (async business logic with setTimeout/Promise)
2. `src/routes/report.ts` — Express route handler that parses query params, calls buildReport, responds with JSON

### Route handler behavior

- Parse `startDate`, `endDate`, `groupBy` from `req.query`
- Import `getAllTasks` from `../storage` and pass to `buildReport`
- Invalid date strings → respond 400 `{ error: 'Invalid date format' }`
- Invalid `groupBy` (not "status" or "category") → respond 400 `{ error: 'groupBy must be "status" or "category"' }`
- Async route handler must use try/catch
- Follow existing Router patterns: `Router()`, `res.status(4xx).json({ error: '...' })`, `export default router`
- Import service from `../services/reportService`

### Red lines

- Don't modify `src/routes/tasks.ts`, `src/storage.ts`, `src/types.ts`, or `src/index.ts`
- The `buildReport` signature must match the interface above (the test imports it by name)
- `buildReport` must import `getAllTasks` from `../storage` and pass `tasks` as first argument from the route handler
