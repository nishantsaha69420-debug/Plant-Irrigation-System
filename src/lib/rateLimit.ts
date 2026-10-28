// In-memory rate limiter for auth requests (brute-force defense)
interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

// Clean up stale entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitMap.entries()) {
      if (now > record.resetAt) {
        rateLimitMap.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function checkRateLimit(
  identifier: string,
  maxAttempts: number = 5,
  windowSeconds: number = 60
): RateLimitResult {
  const now = Date.now();
  const existing = rateLimitMap.get(identifier);

  if (!existing || now > existing.resetAt) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetAt: now + windowSeconds * 1000,
    });
    return {
      allowed: true,
      remaining: maxAttempts - 1,
      retryAfterSeconds: 0,
    };
  }

  if (existing.count >= maxAttempts) {
    const retryAfter = Math.ceil((existing.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, retryAfter),
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: maxAttempts - existing.count,
    retryAfterSeconds: 0,
  };
}

export function resetRateLimit(identifier: string): void {
  rateLimitMap.delete(identifier);
}
