# Task: React — Add sort, text filter, and pagination to Table component

## Background

React user management app. Existing structure:
- `src/data.ts` — `User` interface and `users` array with 5 users
- `src/components/Table.tsx` — Table component that renders users in an HTML table
- `src/App.tsx` — renders `<Table users={users} />`

The Table component renders columns: Name, Email, Role, Active, Created.

## Requirement

Add **three interacting features** to the Table component: column sorting, text filtering, and pagination.

### Feature 1: Column sorting

1. Clicking a column header sorts rows by that column in ascending order
2. Clicking the same header again reverses to descending order
3. Clicking a different header switches sort to that column (ascending)
4. Show ▲ (ascending) or ▼ (descending) next to the active column's header label
5. Only one column shows the sort indicator at a time, no indicator on initial render
6. String columns (name, email, role, createdAt): case-insensitive alphabetical via `localeCompare`
7. Boolean column (active): `false` sorts before `true`
8. Do NOT mutate the original array — use `[...users].sort(...)` or `Array.from()`

### Feature 2: Text filtering

1. Add a text `<input>` above the table with `data-testid="filter-input"`
2. As the user types, filter rows where **name** or **email** contains the search text (case-insensitive)
3. Initial render (empty filter) shows all users
4. No matching users → show empty table body (no "no results" message needed)

### Feature 3: Pagination

1. Show max **3 rows per page**
2. Add navigation below the table:
   - `<button data-testid="prev-page">Prev</button>`
   - `<button data-testid="next-page">Next</button>`
   - `<span data-testid="page-info">Page X of Y</span>`
3. Prev button is disabled on page 1
4. Next button is disabled on the last page
5. When the filter text changes, reset to page 1

### Feature interactions (critical — these must all work together)

1. **Sort affects**: the order of filtered results (across all pages)
2. **Filter affects**: which rows are visible (across all pages) — resets pagination to page 1
3. **Pagination affects**: which slice of sorted+filtered rows is visible

Derived state pipeline: `users → filter → sort → paginate`

### Files

- Modify `src/components/Table.tsx` — add sort, filter, and pagination features

### Red lines

- Don't modify `src/data.ts` or `src/App.tsx`
- Must preserve existing `data-testid` attributes: `users-table`, `th-name`, `th-email`, `th-role`, `th-active`, `th-created`
- Style must match existing component: functional component with TypeScript interface for props, `export default function`
- Use `useMemo` for derived state (filtered, sorted, paginated values) — do NOT compute in the render body
- Use `useState` for mutable state (sort key, sort direction, filter text, current page)
- Sort indicator must be exactly ▲ or ▼ characters (Unicode), appended to column label text
