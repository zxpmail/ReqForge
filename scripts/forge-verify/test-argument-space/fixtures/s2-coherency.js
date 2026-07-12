// S2 coherency: write does NOT invalidate (version-counter no-op)
class RateLimiter {
  constructor() { this._cache = new Map(); this._store = {}; this._v = 0; }
  set(k, v) { this._cache.set(k, v); }
  get(k) { return this._cache.get(k); }
  write(k, v) { this._store[k] = v; this._v++; } // coherency bookkeeping, no invalidation
}
module.exports = { RateLimiter };
