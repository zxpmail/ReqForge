# Development Dimension Checklist

## Must-Have

- **Code Structure & Modularity**: Verify the codebase follows a consistent module/package layout. Components have single responsibility. Dependencies flow inward (no circular imports). Public APIs are exported through barrel files or index modules. Layers (presentation, business logic, data access) are clearly separated.

- **Type Safety**: Full static type coverage (TypeScript strict mode, Pyright, or equivalent). No `any`/`Object`/unsafe casts. Generic types are used where appropriate. External API responses are validated at the boundary (zod, io-ts, pydantic). `null`/`undefined` is handled explicitly — no silent falsy checks for missing values.

- **Error Handling Patterns**: All async operations have try/catch or `.catch()` handlers. User-facing errors surface readable messages (not stack traces). Errors are categorized (expected vs unexpected) with appropriate recovery or fallback. Unhandled promise rejections crash the process in development; in production they route to a dead-letter handler.

- **Testing Coverage**: Unit tests cover all business logic branches (happy path + edge cases + failure modes). Integration tests exercise real I/O boundaries (DB, API, filesystem). E2E tests cover at least the primary user flow. Tests are deterministic — no flaky timeouts or cross-test state leakage. CI fails on test failure.

- **Security Basics**: All user inputs are validated and sanitized (length, type, encoding, allowlist). Authentication tokens are stored securely (httpOnly cookies, not localStorage); session expiry is enforced. CSRF tokens or SameSite cookies are in place for state-changing requests. XSS is prevented via output encoding / CSP headers. SQL/NoSQL injection guards are in place.

- **API Design Consistency**: Endpoints follow a consistent naming convention (RESTful / GraphQL / RPC). Request/response shapes are uniform across similar routes. HTTP status codes are used correctly (2xx success, 4xx client error, 5xx server error). Pagination, filtering, sorting follow a single pattern. API versioning strategy is defined and applied.

## Recommended

- **Performance Considerations**: N+1 queries are eliminated (eager loading, batching, data loader pattern). Expensive computations are cached or memoized. Bundle size is measured and optimized (tree-shaking, code splitting). Critical rendering path is optimized for web targets. Database queries have appropriate indexes.

- **State Management**: Client-side state follows a predictable pattern (context, store, or atomic state). Server state is cached and invalidated consistently. Persistent state (localStorage, IndexedDB) has schema versioning and migration. Global state is minimal — prefer local/compound state where possible.

- **Database Schema Design**: Migrations are versioned, reversible, and tested. Indexes are present on foreign keys and frequent query columns. Constraints (NOT NULL, UNIQUE, CHECK) enforce data integrity at the DB level. Schema changes are backward-compatible (no breaking ALTER TABLE on live prod). Connection pooling is configured.

- **Logging/Observability**: Structured logging (JSON format) is used across services. Log levels (DEBUG/INFO/WARN/ERROR) are consistent and configurable. Correlation IDs or trace IDs span service boundaries. Health check endpoints return dependency status. Metrics (request rate, error rate, latency) are collected for critical paths.

## Optional

- **Configuration Management**: Environment variables are validated at startup (missing vars cause early failure). Defaults are documented in `.env.example` or equivalent. Secrets never appear in config files committed to version control. Configuration is hierarchical with clear override order (defaults < env < secrets < runtime flags).

- **Build Configuration**: Build tooling (webpack, vite, esbuild, tsc, etc.) is configured for both development speed and production optimization. Source maps are generated for debugging but not served in production. Build output is deterministic and reproducible. CI build step is cached where possible.
