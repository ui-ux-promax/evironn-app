/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CartDto } from '@/services/dto/commerce-cart.dto';

const api = vi.hoisted(() => ({
  getCart: vi.fn(),
  addCartItem: vi.fn(),
  updateItemQuantity: vi.fn(),
  removeCartItem: vi.fn(),
  clearCart: vi.fn(),
}));

vi.mock('@/services/api-client', () => ({ Api: { cart: api } }));

import { useCartStore } from '@/store/cart';

const snapshot = (price: number, itemCount = 1): CartDto => ({
  items: [
    {
      id: 'line-1',
      skuId: 'sku-1',
      productVariantId: null,
      articleNumber: 'EV-1',
      productId: 'product-1',
      productName: 'Noma',
      name: 'Noma',
      productSlug: 'noma',
      quantity: itemCount,
      configuration: [],
      colorwayName: '',
      size: '',
      imageUrl: null,
      imageAlt: 'Noma',
      unitPrice: price,
      oldUnitPrice: null,
      lineTotal: price * itemCount,
      compareAtLineTotal: price * itemCount,
      stock: 5,
      active: true,
      available: true,
    },
  ],
  totals: {
    subtotal: price * itemCount,
    compareAtSubtotal: price * itemCount,
    saleDiscount: 0,
    couponDiscount: 0,
    total: price * itemCount,
    itemCount,
    lineCount: 1,
  },
});

beforeEach(() => {
  vi.clearAllMocks();
  useCartStore.setState({ items: [], totals: snapshot(0).totals, totalAmount: 0, loading: false, error: false });
});

describe('cart store canonical snapshots', () => {
  it('replaces items and totals from every server response', async () => {
    api.getCart.mockResolvedValue(snapshot(100));
    await useCartStore.getState().fetchCartItems();
    api.addCartItem.mockResolvedValue(snapshot(200, 2));
    await useCartStore.getState().addCartItem({ skuId: 'sku-1', quantity: 1 });
    api.updateItemQuantity.mockResolvedValue(snapshot(300, 3));
    await useCartStore.getState().updateItemQuantity('line-1', 3);
    api.removeCartItem.mockResolvedValue({
      items: [],
      totals: {
        subtotal: 0,
        compareAtSubtotal: 0,
        saleDiscount: 0,
        couponDiscount: 0,
        total: 0,
        itemCount: 0,
        lineCount: 0,
      },
    });
    await useCartStore.getState().removeCartItem('line-1');
    expect(useCartStore.getState().totalAmount).toBe(0);
    expect(useCartStore.getState().totals.itemCount).toBe(0);
  });

  it('retains the prior snapshot and exposes error after a failed mutation', async () => {
    useCartStore.setState({ ...snapshot(100), totalAmount: 100, loading: false, error: false });
    api.addCartItem.mockRejectedValue(new Error('conflict'));

    await expect(useCartStore.getState().addCartItem({ skuId: 'sku-1' })).rejects.toThrow('conflict');

    expect(useCartStore.getState()).toMatchObject({ totalAmount: 100, error: true, items: snapshot(100).items });
  });

  it('clears the complete snapshot including totals', async () => {
    useCartStore.setState({ ...snapshot(100), loading: false, error: false });
    api.clearCart.mockResolvedValue({
      items: [],
      totals: {
        subtotal: 0,
        compareAtSubtotal: 0,
        saleDiscount: 0,
        couponDiscount: 0,
        total: 0,
        itemCount: 0,
        lineCount: 0,
      },
    });
    await useCartStore.getState().clearCart();
    expect(useCartStore.getState()).toMatchObject({ items: [], totalAmount: 0, totals: { itemCount: 0 } });
  });
});
