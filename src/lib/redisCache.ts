import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export async function getCachedData<T>(key: string, fetchFn: () => Promise<T>, ttlSeconds: number = 300): Promise<T> {
  try {
    const cached = await redis.get<T>(key);
    if (cached) {
      return cached;
    }
  } catch (err) {
    console.warn(`Redis get error for key ${key}:`, err);
  }

  const data = await fetchFn();

  try {
    if (data !== undefined && data !== null) {
       // Cache the successfully fetched data
      await redis.set(key, data, { ex: ttlSeconds });
    }
  } catch (err) {
    console.warn(`Redis set error for key ${key}:`, err);
  }

  return data;
}

export async function invalidateCache(pattern: string) {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    console.error("Redis invalidate error:", err);
  }
}
