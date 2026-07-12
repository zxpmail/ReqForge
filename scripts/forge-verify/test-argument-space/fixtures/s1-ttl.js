// S1 TTL: write does NOT invalidate (cache expires via TTL)
class RateLimiter {
  constructor() { this._cache = new Map(); this._store = {}; }
  set(k, v) { this._cache.set(k, v); }
  get(k) { return this._cache.get(k); }
  write(k, v) { this._store[k] = v; } // no invalidation
}
module.exports = { RateLimiter };
