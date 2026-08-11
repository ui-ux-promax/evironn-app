import { Redis } from '@upstash/redis';

export async function withDemoResetLock<T>(work: () => Promise<T>): Promise<T> {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error('Demo reset lock is not configured');

  const redis = new Redis({ url, token });
  const lockKey = 'ritm:demo-reset-lock';
  const lockToken = crypto.randomUUID();
  const acquired = await redis.set(lockKey, lockToken, { nx: true, ex: 900 });
  if (acquired !== 'OK') throw new Error('Demo reset already running');

  try {
    return await work();
  } finally {
    await redis.eval(
      'if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end',
      [lockKey],
      [lockToken],
    );
  }
}
