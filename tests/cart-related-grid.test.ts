/** @vitest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CartRelatedGrid } from '@/components/shared/cart/cart-related-grid';
import type { ProductCardData } from '@/lib/product-summary';

const addCartItem = vi.hoisted(() => vi.fn());
(globalThis as typeof globalThis & { React: typeof React }).React = React;

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => React.createElement('img', { src, alt }),
}));
vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) =>
    React.createElement('a', { href }, children),
}));
vi.mock('@/store', () => ({
  useCartStore: (selector: (state: { addCartItem: typeof addCartItem }) => unknown) => selector({ addCartItem }),
}));

const items: ProductCardData[] = [
  {
    id: 'product-1',
    slug: 'hoodie',
    name: 'Hoodie',
    brand: 'RITM',
    categoryName: 'Hoodies',
    imageUrl: '/hoodie.jpg',
    imageAlt: 'Hoodie',
    minPrice: 5400,
    minCompareAtPrice: null,
    badges: [],
    soldOut: false,
    colorways: [
      {
        id: 'cw-1',
        name: 'Sage',
        swatchHex: '#789',
        imageUrl: '/hoodie.jpg',
        variants: [{ size: 'M', sizeOrder: 3, inStock: true, variantId: 'variant-1' }],
      },
    ],
    sizes: [{ size: 'M', sizeOrder: 3, inStock: true, variantId: 'variant-1' }],
  },
];

describe('CartRelatedGrid', () => {
  it('shows a spinner while its product is being added', () => {
    addCartItem.mockReturnValueOnce(new Promise<void>(() => {}));
    render(React.createElement(CartRelatedGrid, { items }));

    fireEvent.click(screen.getByRole('button', { name: 'Добавить Hoodie' }));

    const button = screen.getByRole('button', { name: 'Добавить Hoodie' });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.querySelector('svg.animate-spin')).not.toBeNull();
  });
});
