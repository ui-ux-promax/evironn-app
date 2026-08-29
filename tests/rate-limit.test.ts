import { beforeEach, describe, expect, it, vi } from 'vitest';

const upstash = vi.hoisted(() => ({
  limit: vi.fn(),
  slidingWindow: vi.fn((points: number, window: string) => ({ points, window })),
  ratelimitOptions: undefined as Record<string, unknown> | undefined,
  redisOptions: undefined as Record<string, unknown> | undefined,
}));

vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: class {
    constructor(options: Record<string, unknown>) {
      upstash.ratelimitOptions = options;
    }

    static slidingWindow = upstash.slidingWindow;

    limit(key: string) {
      return upstash.limit(key);
    }
  },
}));

vi.mock('@upstash/redis', () => ({
  Redis: class {
    constructor(options: Record<string, unknown>) {
      upstash.redisOptions = options;
    }
  },
}));

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
  vi.stubEnv('KV_REST_API_URL', '');
  vi.stubEnv('KV_REST_API_TOKEN', '');
  vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
  vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
  vi.clearAllMocks();
  upstash.ratelimitOptions = undefined;
  upstash.redisOptions = undefined;
});

describe('rate-limit Redis configuration boundaries', () => {
  it('uses one complete preferred KV alias pair', async () => {
    vi.stubEnv('KV_REST_API_URL', 'https://kv.example');
    vi.stubEnv('KV_REST_API_TOKEN', 'kv-token');
    upstash.limit.mockResolvedValue({ success: false, remaining: 0, reset: 123 });

    const { checkAuthRateLimit, isRateLimitConfigured } = await import('@/lib/rate-limit');
    const result = await checkAuthRateLimit('1.2.3.4:person@example.com');

    expect(isRateLimitConfigured()).toBe(true);
    expect(result).toEqual({ success: false, remaining: 0, reset: 123 });
    expect(upstash.redisOptions).toEqual({ url: 'https://kv.example', token: 'kv-token' });
    expect(upstash.ratelimitOptions).toEqual(
      expect.objectContaining({ prefix: 'evironn-app:auth', limiter: { points: 5, window: '10 m' } }),
    );
  });

  it('treats mixed aliases as unavailable and fails open', async () => {
    vi.stubEnv('KV_REST_API_URL', 'https://kv.example');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'upstash-token');

    const { checkAuthRateLimit, isRateLimitConfigured } = await import('@/lib/rate-limit');
    const result = await checkAuthRateLimit('1.2.3.4:person@example.com');

    expect(isRateLimitConfigured()).toBe(false);
    expect(result).toEqual({ success: true, remaining: -1, reset: 0 });
    expect(upstash.limit).not.toHaveBeenCalled();
  });

  it('propagates configured Redis runtime errors unchanged', async () => {
    vi.stubEnv('KV_REST_API_URL', 'https://kv.example');
    vi.stubEnv('KV_REST_API_TOKEN', 'kv-token');
    const failure = new Error('upstream Redis unavailable');
    upstash.limit.mockRejectedValue(failure);

    const { checkAuthRateLimit } = await import('@/lib/rate-limit');

    await expect(checkAuthRateLimit('1.2.3.4:person@example.com')).rejects.toBe(failure);
  });

  it('fails open for ordinary consumers without Redis configuration', async () => {
    const { checkAuthRateLimit, checkCartRateLimit } = await import('@/lib/rate-limit');

    expect((await checkAuthRateLimit('1.2.3.4:person@example.com')).success).toBe(true);
    expect((await checkCartRateLimit('1.2.3.4')).success).toBe(true);
  });
});
