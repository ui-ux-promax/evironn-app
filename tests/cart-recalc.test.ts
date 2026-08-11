import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma-client', () => ({
  prisma: {
    cart: { findFirst: vi.fn(), update: vi.fn() },
  },
}));

import { recalcCartTotalByToken } from '@/lib/cart';
import { prisma } from '@/lib/prisma-client';

const findFirst = prisma.cart.findFirst as unknown as ReturnType<typeof vi.fn>;
const update = prisma.cart.update as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => vi.clearAllMocks());

describe('recalcCartTotalByToken', () => {
  it('calculates totals from canonical furniture SKUs', async () => {
    findFirst.mockResolvedValue({
      id: 'cart-1',
      token: 'token-1',
      totalAmount: 0,
      items: [
        {
          id: 'item-1',
          quantity: 2,
          productVariant: null,
          sku: {
            id: 'sku-1',
            articleNumber: 'EV-NWL-OAK',
            combinationKey: 'finish=oak',
            price: 124000,
            oldPrice: null,
            stock: 3,
            active: true,
            product: { id: 'product-1', name: 'Noma', slug: 'noma', active: true },
            media: [],
            selections: [],
          },
        },
      ],
    });
    update.mockResolvedValue({});

    const result = await recalcCartTotalByToken('token-1');

    expect(update).toHaveBeenCalledWith({ where: { id: 'cart-1' }, data: { totalAmount: 248000 } });
    expect(result?.totalAmount).toBe(248000);
  });
});
