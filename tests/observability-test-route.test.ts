import { beforeEach, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';

vi.mock('@/lib/admin/require-admin', () => ({ requireAdminApi: vi.fn() }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));
vi.mock('@sentry/nextjs', () => ({ flush: vi.fn().mockResolvedValue(true) }));

import { requireAdminApi } from '@/lib/admin/require-admin';
import { logger } from '@/lib/logger';
import { flush } from '@sentry/nextjs';
import { POST } from '@/app/api/admin/observability/test/route';

beforeEach(() => vi.clearAllMocks());

it('forwards admin denial', async () => {
  vi.mocked(requireAdminApi).mockResolvedValue(NextResponse.json({ message: 'Forbidden' }, { status: 403 }));
  expect((await POST()).status).toBe(403);
  expect(logger.error).not.toHaveBeenCalled();
});

it('emits a controlled event for ADMIN', async () => {
  vi.mocked(requireAdminApi).mockResolvedValue(null);
  const response = await POST();
  const body = await response.json();
  expect(response.status).toBe(200);
  expect(body).toEqual({ ok: true, eventId: expect.any(String) });
  expect(logger.error).toHaveBeenCalledWith('portfolio_sentry_test', expect.any(Error), { eventId: body.eventId });
  expect(flush).toHaveBeenCalledWith(2_000);
});
