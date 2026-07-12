// S3 purge: write invalidates via purgeCacheOnWrite (different method name, same side effect)
class RateLimiter {
  constructor() { this._cache = new Map(); this._store = {}; }
  set(k, v) { this._cache.set(k, v); }
  get(k) { return this._cache.get(k); }
  write(k, v) { this._store[k] = v; this.purgeCacheOnWrite(k); }
  purgeCacheOnWrite(k) { this._cache.delete(k); } // real invalidation, renamed
}
module.exports = { RateLimiter };
