import { beforeEach, expect, it, vi } from 'vitest';

const redis = vi.hoisted(() => ({
  options: undefined as Record<string, string> | undefined,
  set: vi.fn(),
  eval: vi.fn(),
}));

vi.mock('@upstash/redis', () => ({
  Redis: class {
    constructor(options: Record<string, string>) {
      redis.options = options;
    }

    set(...args: unknown[]) {
      return redis.set(...args);
    }

    eval(...args: unknown[]) {
      return redis.eval(...args);
    }
  },
}));

import { withDemoResetLock } from '@/lib/demo-data/reset-lock';

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.stubEnv('KV_REST_API_URL', '');
  vi.stubEnv('KV_REST_API_TOKEN', '');
  vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
  vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
  vi.clearAllMocks();
  redis.options = undefined;
  redis.set.mockResolvedValue('OK');
  redis.eval.mockResolvedValue(1);
});

it('acquires complete preferred Redis pair with owner-safe release', async () => {
  vi.stubEnv('KV_REST_API_URL', 'https://kv.example');
  vi.stubEnv('KV_REST_API_TOKEN', 'kv-token');

  const work = vi.fn(async () => 'done');
  await expect(withDemoResetLock(work)).resolves.toBe('done');

  expect(redis.options).toEqual({ url: 'https://kv.example', token: 'kv-token' });
  expect(redis.set).toHaveBeenCalledWith('evironn:demo-reset-lock', expect.any(String), { nx: true, ex: 900 });
  const owner = redis.set.mock.calls[0][1];
  expect(owner).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  expect(work).toHaveBeenCalledOnce();
  expect(redis.eval).toHaveBeenCalledWith(
    'if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end',
    ['evironn:demo-reset-lock'],
    [owner],
  );
});

it('prevents competing owner from running reset work', async () => {
  vi.stubEnv('KV_REST_API_URL', 'https://kv.example');
  vi.stubEnv('KV_REST_API_TOKEN', 'kv-token');
  redis.set.mockResolvedValueOnce('OK').mockResolvedValueOnce(null);

  const work = vi.fn(async () => undefined);
  await withDemoResetLock(work);

  await expect(withDemoResetLock(work)).rejects.toThrow('Demo reset already running');
  expect(work).toHaveBeenCalledOnce();
});

it('fails closed for incomplete mixed Redis aliases before work', async () => {
  vi.stubEnv('KV_REST_API_URL', 'https://kv.example');
  delete process.env.KV_REST_API_TOKEN;
  vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'upstash-token');

  const work = vi.fn(async () => undefined);

  await expect(withDemoResetLock(work)).rejects.toThrow('Demo reset lock is not configured');
  expect(work).not.toHaveBeenCalled();
  expect(redis.options).toBeUndefined();
  expect(redis.set).not.toHaveBeenCalled();
});

it('propagates configured Redis acquisition and release errors unchanged', async () => {
  vi.stubEnv('KV_REST_API_URL', 'https://kv.example');
  vi.stubEnv('KV_REST_API_TOKEN', 'kv-token');

  const acquisitionFailure = new Error('Redis acquisition failed');
  redis.set.mockRejectedValueOnce(acquisitionFailure);
  await expect(withDemoResetLock(async () => undefined)).rejects.toBe(acquisitionFailure);

  const releaseFailure = new Error('Redis release failed');
  redis.set.mockResolvedValueOnce('OK');
  redis.eval.mockRejectedValueOnce(releaseFailure);
  await expect(withDemoResetLock(async () => undefined)).rejects.toBe(releaseFailure);
});
