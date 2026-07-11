/**
 * Rate Limiter Middleware — TTL-based key expiry
 *
 * NOTE: Uses TTL expiration, NOT write-invalidation.
 * Keys automatically expire after the configured window duration.
 */

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

class RateLimiter {
  private store: Map<string, { count: number; resetAt: number }>;

  constructor(private config: RateLimitConfig) {
    this.store = new Map();
  }

  async isRateLimited(key: string): Promise<boolean> {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetAt) {
      // TTL expired — reset counter
      this.store.set(key, { count: 1, resetAt: now + this.config.windowMs });
      return false;
    }

    if (entry.count >= this.config.maxRequests) {
      return true; // rate limited
    }

    entry.count++;
    return false;
  }

  // TTL-based, not write-invalidation — keys expire naturally after the window
}

export function createRateLimiter(config: RateLimitConfig): RateLimiter {
  return new RateLimiter(config);
}
