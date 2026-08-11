import { expect, it, vi } from 'vitest';
import { checkReadiness } from '@/lib/observability/readiness';

it('reports only coarse readiness', async () => {
  expect(await checkReadiness({ queryDb: vi.fn().mockResolvedValue(undefined), rateLimitConfigured: true })).toEqual({
    ok: true,
  });
  expect(
    await checkReadiness({ queryDb: vi.fn().mockRejectedValue(new Error('secret host')), rateLimitConfigured: true }),
  ).toEqual({ ok: false });
  expect(await checkReadiness({ queryDb: vi.fn(), rateLimitConfigured: false })).toEqual({ ok: false });
});
