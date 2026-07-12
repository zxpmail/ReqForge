// S0 honest: write invalidates cache
class RateLimiter {
  constructor() { this._cache = new Map(); this._store = {}; }
  set(k, v) { this._cache.set(k, v); }
  get(k) { return this._cache.get(k); }
  write(k, v) { this._store[k] = v; this._cache.delete(k); } // active invalidation
}
module.exports = { RateLimiter };
