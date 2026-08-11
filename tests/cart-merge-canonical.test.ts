import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/cart', () => ({ recalcCartTotalByToken: vi.fn().mockResolvedValue(null) }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() } }));
vi.mock('@/lib/prisma-client', () => ({
  prisma: {
    cart: { findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn(), delete: vi.fn() },
    cartItem: { upsert: vi.fn(), delete: vi.fn(), findMany: vi.fn(), update: vi.fn() },
  },
}));

import { mergeGuestCart } from '@/lib/cart-merge';
import { prisma } from '@/lib/prisma-client';

const cart = prisma.cart as unknown as Record<string, ReturnType<typeof vi.fn>>;
const cartItem = prisma.cartItem as unknown as Record<string, ReturnType<typeof vi.fn>>;

beforeEach(() => {
  vi.clearAllMocks();
  cart.findFirst.mockResolvedValue({ id: 'guest', token: 'guest-token', userId: null });
  cart.findMany.mockResolvedValue([
    {
      id: 'prior',
      token: 'prior-token',
      userId: 'user-1',
      items: [{ id: 'item-1', skuId: 'sku-1', productVariantId: null, quantity: 2 }],
    },
  ]);
  cartItem.findMany.mockResolvedValue([
    { id: 'merged-1', skuId: 'sku-1', productVariantId: null, quantity: 2, sku: { stock: 5 }, productVariant: null },
  ]);
});

describe('mergeGuestCart canonical SKU compatibility', () => {
  it('moves canonical SKU items before deleting the source cart', async () => {
    await mergeGuestCart('guest-token', 'user-1');

    expect(cartItem.upsert).toHaveBeenCalledWith({
      where: { cartId_skuId: { cartId: 'guest', skuId: 'sku-1' } },
      create: { cartId: 'guest', skuId: 'sku-1', quantity: 2 },
      update: { quantity: { increment: 2 } },
    });
    expect(cartItem.delete).toHaveBeenCalledWith({ where: { id: 'item-1' } });
    expect(cart.delete).toHaveBeenCalledWith({ where: { id: 'prior' } });
  });

  it('clamps canonical SKU quantity to canonical stock', async () => {
    cartItem.findMany.mockResolvedValue([
      { id: 'merged-1', skuId: 'sku-1', productVariantId: null, quantity: 7, sku: { stock: 5 }, productVariant: null },
    ]);

    await mergeGuestCart('guest-token', 'user-1');

    expect(cartItem.update).toHaveBeenCalledWith({ where: { id: 'merged-1' }, data: { quantity: 5 } });
  });

  it('removes an unavailable item instead of writing forbidden zero quantity', async () => {
    cartItem.findMany.mockResolvedValue([
      { id: 'merged-1', skuId: 'sku-1', productVariantId: null, quantity: 2, sku: { stock: 0 }, productVariant: null },
    ]);

    await mergeGuestCart('guest-token', 'user-1');

    expect(cartItem.delete).toHaveBeenCalledWith({ where: { id: 'merged-1' } });
    expect(cartItem.update).not.toHaveBeenCalledWith({ where: { id: 'merged-1' }, data: { quantity: 0 } });
  });
});
