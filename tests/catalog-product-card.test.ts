/** @vitest-environment jsdom */
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CatalogProductCard } from '@/components/shared/catalog/catalog-product-card';
import type { FurnitureProductCardData } from '@/lib/furniture-product-summary';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => React.createElement('img', { src, alt }),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) =>
    React.createElement('a', { href, ...props }, children),
}));

vi.mock('@/store', () => ({
  useCartStore: (selector: (state: { addCartItem: () => Promise<void> }) => unknown) =>
    selector({ addCartItem: async () => undefined }),
}));

vi.mock('@/components/shared/wishlist/wishlist-heart', () => ({
  WishlistHeart: () => React.createElement('button', { type: 'button' }, 'wishlist'),
}));

vi.mock('@/components/shared/product/size-guide-dialog', () => ({
  SizeGuideDialog: () => React.createElement('button', { type: 'button' }, 'size guide'),
}));

afterEach(() => cleanup());

const data: FurnitureProductCardData = {
  id: 'product-noma',
  slug: 'noma-woven-lounge',
  name: 'Noma Woven Lounge',
  brand: 'Evironn',
  categoryName: 'Lounge chairs',
  imageUrl: '/assets/products/noma-woven-lounge.webp',
  imageAlt: 'Noma Woven Lounge',
  primarySkuId: 'sku-noma-oak',
  minPrice: 89000,
  minOldPrice: 109000,
  badges: [],
  soldOut: false,
  optionSwatches: [
    { groupSlug: 'finish', valueSlug: 'oak', label: 'Oak', swatchHex: '#c89b6d' },
    { groupSlug: 'finish', valueSlug: 'walnut', label: 'Walnut', swatchHex: '#6b4226' },
  ],
};

describe('CatalogProductCard', () => {
  it('renders canonical furniture navigation, pricing, category, availability, and swatches', () => {
    render(React.createElement(CatalogProductCard, { data }));

    const article = screen.getByTestId('catalog-product-card');
    expect(article.textContent).toContain('Noma Woven Lounge');
    expect(article.textContent).toContain('Lounge chairs');
    expect(article.textContent).toContain('89');
    expect(article.textContent).toContain('109');
    expect(article.textContent).toContain('В наличии');
    expect(screen.getAllByRole('link', { name: 'Noma Woven Lounge' })[0].getAttribute('href')).toBe(
      '/product/noma-woven-lounge',
    );
    expect(screen.getByLabelText('Oak')).toBeTruthy();
    expect(screen.getByLabelText('Walnut')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /корзин/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /wishlist|избран/i })).toBeNull();
    expect(screen.queryByText(/размер|size guide/i)).toBeNull();
  });

  it('renders sold-out furniture without a commerce action', () => {
    render(React.createElement(CatalogProductCard, { data: { ...data, soldOut: true } }));

    expect(screen.getByTestId('catalog-product-card').textContent).toContain('Нет в наличии');
    expect(screen.queryByRole('button', { name: /корзин/i })).toBeNull();
  });
});
