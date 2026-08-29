import { Redis } from '@upstash/redis';

function getRedisCredentials(): { url: string; token: string } | undefined {
  const preferred = {
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  };
  if (preferred.url && preferred.token) return preferred as { url: string; token: string };

  const fallback = {
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  };
  if (fallback.url && fallback.token) return fallback as { url: string; token: string };

  return undefined;
}

export async function withDemoResetLock<T>(work: () => Promise<T>): Promise<T> {
  const credentials = getRedisCredentials();
  if (!credentials) throw new Error('Demo reset lock is not configured');

  const redis = new Redis(credentials);
  const lockKey = 'evironn:demo-reset-lock';
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
