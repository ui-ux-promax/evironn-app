import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn().mockResolvedValue({ user: { id: 'user-1' } }) }));
vi.mock('@/lib/cart', () => ({
  resolveOwnerCart: vi.fn().mockResolvedValue({ id: 'cart-1', token: 'token-1' }),
  recalcCartTotalByToken: vi.fn().mockResolvedValue({ items: [], totalAmount: 0 }),
}));
vi.mock('@/lib/request-context', () => ({ runWithRequestContext: vi.fn((_request, callback) => callback()) }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() } }));
vi.mock('@/lib/prisma-client', () => ({
  prisma: {
    cartItem: { findFirst: vi.fn(), update: vi.fn() },
  },
}));

import { PATCH } from '@/app/api/cart/[id]/route';
import { prisma } from '@/lib/prisma-client';

const findFirst = prisma.cartItem.findFirst as unknown as ReturnType<typeof vi.fn>;
const update = prisma.cartItem.update as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => vi.clearAllMocks());

describe('PATCH /api/cart/[id] canonical SKU compatibility', () => {
  it('validates requested quantity against canonical SKU stock', async () => {
    findFirst.mockResolvedValue({
      id: 'item-1',
      cartId: 'cart-1',
      skuId: 'sku-1',
      productVariantId: null,
      sku: { stock: 3 },
      productVariant: null,
    });
    update.mockResolvedValue({});
    const request = {
      cookies: { get: () => ({ value: 'token-1' }) },
      json: async () => ({ quantity: 2 }),
    };

    const response = await PATCH(request as never, { params: Promise.resolve({ id: 'item-1' }) });

    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalledWith({ where: { id: 'item-1' }, data: { quantity: 2 } });
  });
});
