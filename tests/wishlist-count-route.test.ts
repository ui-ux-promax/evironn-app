import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { authMock, countMock, runWithRequestContextMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  countMock: vi.fn(),
  runWithRequestContextMock: vi.fn((_request: NextRequest, callback: () => Promise<Response>) => callback()),
}));

vi.mock('@/auth', () => ({ auth: authMock }));
vi.mock('@/lib/wishlist', () => ({ getWishlistCount: countMock }));
vi.mock('@/lib/request-context', () => ({ runWithRequestContext: runWithRequestContextMock }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));

import { GET } from '@/app/api/wishlist/count/route';

describe('GET /api/wishlist/count', () => {
  it('reads guest cookie ownership without creating a wishlist', async () => {
    authMock.mockResolvedValue(null);
    countMock.mockResolvedValue(2);

    const response = await GET(
      new NextRequest('http://localhost/api/wishlist/count', { headers: { cookie: 'wishlistToken=guest-token' } }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ count: 2 });
    expect(countMock).toHaveBeenCalledWith(null, 'guest-token');
  });

  it('reads authenticated ownership while preserving the active-product count', async () => {
    const session = { user: { id: 'u1' } };
    authMock.mockResolvedValue(session);
    countMock.mockResolvedValue(1);

    const response = await GET(new NextRequest('http://localhost/api/wishlist/count'));

    expect(await response.json()).toEqual({ count: 1 });
    expect(countMock).toHaveBeenCalledWith(session, undefined);
  });
});
