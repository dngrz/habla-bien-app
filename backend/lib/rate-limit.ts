interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

const WINDOW_MS = 60 * 60 * 1000; // 1 hora
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX ?? 10);

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
}

/**
 * Rate limit simple en memoria por IP. Suficiente para una demo self-hosted
 * con una sola instancia; no comparte estado entre réplicas.
 */
export function checkRateLimit(key: string, now: number = Date.now()): RateLimitResult {
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS - 1, retryAfterSec: 0 };
  }

  if (bucket.count >= MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count += 1;
  return {
    allowed: true,
    remaining: MAX_REQUESTS - bucket.count,
    retryAfterSec: 0,
  };
}

export function resetRateLimit(): void {
  buckets.clear();
}
