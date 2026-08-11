import { beforeEach, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

vi.mock('@/lib/prisma-client', () => ({ prisma: {} }));
vi.mock('@/lib/demo-data/reset', () => ({ resetDemoData: vi.fn() }));
vi.mock('@/lib/demo-data/reset-lock', () => ({ withDemoResetLock: vi.fn((work) => work()) }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), info: vi.fn() } }));

import { resetDemoData } from '@/lib/demo-data/reset';
import { withDemoResetLock } from '@/lib/demo-data/reset-lock';
import { logger } from '@/lib/logger';
import { GET } from '@/app/api/cron/reset-demo/route';

const invariants = {
  categories: 4,
  products: 8,
  variants: 60,
  fixtureUsers: 8,
  visitorUsers: 0,
  carts: 0,
  subscribers: 0,
};

function request(token?: string) {
  return new Request('https://ritm.test/api/cron/reset-demo', {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  }) as NextRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.CRON_SECRET;
});

it('fails closed when CRON_SECRET is missing', async () => {
  const response = await GET(request());

  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({ ok: false });
  expect(resetDemoData).not.toHaveBeenCalled();
});

it('rejects missing or wrong authorization', async () => {
  process.env.CRON_SECRET = 'secret-1234567890';

  expect((await GET(request())).status).toBe(401);
  expect((await GET(request('wrong'))).status).toBe(401);
  expect(resetDemoData).not.toHaveBeenCalled();
});

it('runs reset under the lock for a valid bearer token', async () => {
  process.env.CRON_SECRET = 'secret-1234567890';
  vi.mocked(resetDemoData).mockResolvedValue(invariants);

  const response = await GET(request('secret-1234567890'));

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ ok: true, invariants });
  expect(withDemoResetLock).toHaveBeenCalledOnce();
});

it('hides reset errors from the response body', async () => {
  process.env.CRON_SECRET = 'secret-1234567890';
  vi.mocked(resetDemoData).mockRejectedValue(new Error('secret db host'));

  const response = await GET(request('secret-1234567890'));

  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({ ok: false });
  expect(logger.error).toHaveBeenCalledWith('demo_reset_failed', expect.any(Error), expect.any(Object));
});
