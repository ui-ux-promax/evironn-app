import { beforeEach, expect, it, vi } from 'vitest';

const { queryRaw, rateLimitConfigured } = vi.hoisted(() => ({
  queryRaw: vi.fn(),
  rateLimitConfigured: vi.fn(),
}));

vi.mock('@/lib/prisma-client', () => ({ prisma: { $queryRaw: queryRaw } }));
vi.mock('@/lib/rate-limit', () => ({ isRateLimitConfigured: rateLimitConfigured }));

import { GET } from '@/app/api/health/route';

beforeEach(() => {
  vi.clearAllMocks();
  rateLimitConfigured.mockReturnValue(true);
  queryRaw.mockResolvedValue(undefined);
});

it('returns coarse healthy and unhealthy responses without dependency details', async () => {
  const healthy = await GET();
  expect(healthy.status).toBe(200);
  expect(await healthy.json()).toEqual({ ok: true });

  queryRaw.mockRejectedValueOnce(new Error('secret database host'));
  const unhealthy = await GET();
  expect(unhealthy.status).toBe(503);
  expect(await unhealthy.json()).toEqual({ ok: false });
});
