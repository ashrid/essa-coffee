import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Check if Redis is configured
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

// Create ratelimiter only if Redis is configured, otherwise use a no-op fallback
export const ratelimit =
  redisUrl && redisToken
    ? new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(5, "15 m"),
        analytics: true,
      })
    : null;

// Fallback in-memory rate limiter for development (resets on server restart)
const inMemoryStore = new Map<string, { count: number; resetAt: number }>();

export async function checkRateLimit(
  identifier: string,
  maxRequests: number = 5,
  windowMs: number = 15 * 60 * 1000
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  // Use Upstash Redis if available
  if (ratelimit) {
    const result = await ratelimit.limit(identifier);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: Date.now() + (result.reset - new Date().getTime()),
    };
  }

  // Fallback to in-memory for development
  const now = Date.now();
  const record = inMemoryStore.get(identifier);

  if (!record || now > record.resetAt) {
    // New window
    const newRecord = { count: 1, resetAt: now + windowMs };
    inMemoryStore.set(identifier, newRecord);
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      reset: newRecord.resetAt,
    };
  }

  // Existing window
  record.count++;
  return {
    success: record.count <= maxRequests,
    limit: maxRequests,
    remaining: Math.max(0, maxRequests - record.count),
    reset: record.resetAt,
  };
}
