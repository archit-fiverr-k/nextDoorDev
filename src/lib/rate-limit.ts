interface RateLimitBucket {
  hits: number;
  resetTime: number;
}

const limiterMap = new Map<string, RateLimitBucket>();

// Cleanup helper to prevent memory leaks using standard ES5-compatible forEach
setInterval(
  () => {
    const now = Date.now();
    limiterMap.forEach((bucket, key) => {
      if (now > bucket.resetTime) {
        limiterMap.delete(key);
      }
    });
  },
  5 * 60 * 1000
); // Clean expired buckets every 5 minutes

/**
 * Slide window rate-limiting helper
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { success: boolean; limit: number; remaining: number; resetTime: number } {
  const now = Date.now();
  const bucket = limiterMap.get(key);

  if (!bucket) {
    const newBucket = { hits: 1, resetTime: now + windowMs };
    limiterMap.set(key, newBucket);
    return { success: true, limit, remaining: limit - 1, resetTime: newBucket.resetTime };
  }

  if (now > bucket.resetTime) {
    bucket.hits = 1;
    bucket.resetTime = now + windowMs;
    return { success: true, limit, remaining: limit - 1, resetTime: bucket.resetTime };
  }

  if (bucket.hits >= limit) {
    return { success: false, limit, remaining: 0, resetTime: bucket.resetTime };
  }

  bucket.hits += 1;
  return { success: true, limit, remaining: limit - bucket.hits, resetTime: bucket.resetTime };
}
