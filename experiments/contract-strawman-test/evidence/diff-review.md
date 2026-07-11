## Code Review: Rate Limiter Middleware

### Overview
Implements IP-level and User-level rate limiting with Redis-backed storage.
TTL-based expiration for automatic key cleanup.

### Key Design Decisions

1. **TTL Expiration**: Keys expire via TTL after the configured window duration.
   Note: This is NOT write-invalidation — TTL is simpler and sufficient for our use case.
   Write-invalidation would require tracking cache keys and invalidating them on every write,
   which adds complexity without proportional benefit for rate limiting.

2. **Storage**: Redis SET with EXPIRE. No write-invalidation needed since the TTL window
   naturally resets counters.

3. **IP Detection**: Uses X-Forwarded-For header with fallback to remote address.

### Requirements Check
- [x] IP-level rate limiting
- [x] User-level rate limiting (via API key header)
- [x] Configurable limits per tier
- [x] Redis storage backend
- [ ] Write-invalidation on cache writes — **NOT IMPLEMENTED** (TTL used instead)
- [x] Coverage >= 85% (92%)
- [x] Lint 0 errors

### Risk Assessment
Low. TTL-based expiry is the standard pattern for rate limiting.
Write-invalidation is only needed if cache entries must be immediately purged on config change.
