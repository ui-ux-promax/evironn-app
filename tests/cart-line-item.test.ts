/** @vitest-environment jsdom */
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CartLineItem } from '@/components/shared/cart/cart-line-item';
import type { CartLineDto } from '@/services/dto/commerce-cart.dto';

const updateItemQuantity = vi.hoisted(() => vi.fn());
(globalThis as typeof globalThis & { React: typeof React }).React = React;

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => React.createElement('img', { src, alt }),
}));
vi.mock('@/store', () => ({
  useCartStore: (
    selector: (state: {
      updateItemQuantity: typeof updateItemQuantity;
      removeCartItem: () => Promise<void>;
    }) => unknown,
  ) => selector({ updateItemQuantity, removeCartItem: vi.fn() }),
}));
vi.mock('@/components/shared/wishlist/wishlist-heart', () => ({
  WishlistHeart: () => React.createElement('button', { type: 'button' }, 'wishlist'),
}));

const item: CartLineDto = {
  id: 'cart-item-1',
  skuId: 'sku-1',
  articleNumber: 'EV-HOODIE-SAGE-M',
  productId: 'product-1',
  quantity: 1,
  name: 'Hoodie',
  productSlug: 'hoodie',
  configuration: [],
  imageUrl: null,
  imageAlt: 'Hoodie',
  unitPrice: 5400,
  oldUnitPrice: null,
  lineTotal: 5400,
  oldLineTotal: null,
  stock: 5,
  available: true,
};

afterEach(() => {
  cleanup();
  updateItemQuantity.mockClear();
});

describe('CartLineItem', () => {
  it('disables increment when the cart already contains every unit in stock', () => {
    render(React.createElement(CartLineItem, { item: { ...item, stock: 1 } }));

    expect((screen.getByRole('button', { name: 'Больше' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('shows a local spinner while increasing its quantity', () => {
    updateItemQuantity.mockReturnValueOnce(new Promise<void>(() => {}));
    render(React.createElement(CartLineItem, { item }));

    fireEvent.click(screen.getByRole('button', { name: 'Больше' }));

    expect((screen.getByRole('button', { name: 'Меньше' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Больше' }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByLabelText('Обновляем количество').querySelector('svg.animate-spin')).not.toBeNull();
  });
});
