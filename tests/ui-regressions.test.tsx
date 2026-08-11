/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AddressSuggest } from '@/components/shared/checkout/address-suggest';
import { SizeFilter } from '@/components/shared/catalog/size-filter';
import { WishlistBadge } from '@/components/shared/wishlist/wishlist-badge';
import { CatalogProductCard } from '@/components/shared/catalog/catalog-product-card';
import type { ProductCardData } from '@/lib/product-summary';

const pathname = vi.hoisted(() => ({ value: '/profile' }));
const wishlistCount = vi.hoisted(() => ({ value: 2 }));
const selectedSizes = vi.hoisted(() => ({ value: ['S'] }));
const addCartItem = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  usePathname: () => pathname.value,
}));

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => React.createElement('img', { src, alt }),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) =>
    React.createElement('a', { href, ...props }, children),
}));

vi.mock('@/store', () => ({
  useWishlistStore: (selector: (state: { count: number; fetchCount: () => void }) => unknown) =>
    selector({ count: wishlistCount.value, fetchCount: vi.fn() }),
  useCartStore: (selector: (state: { addCartItem: typeof addCartItem }) => unknown) => selector({ addCartItem }),
}));

vi.mock('@/hooks/use-catalog-url', () => ({
  useCatalogUrl: () => ({
    getList: () => selectedSizes.value,
    toggleInList: vi.fn(),
  }),
}));

vi.mock('@/components/shared/wishlist/wishlist-heart', () => ({
  WishlistHeart: () => React.createElement('button', { type: 'button' }, 'wishlist'),
}));

afterEach(() => {
  cleanup();
  pathname.value = '/profile';
  wishlistCount.value = 2;
  selectedSizes.value = ['S'];
  window.history.replaceState(null, '', '/');
});

function AddressSuggestHost() {
  const methods = useForm({ defaultValues: { addressLine: 'nov', city: '' } });
  return (
    <FormProvider {...methods}>
      <div className="relative">
        <input aria-label="address" {...methods.register('addressLine')} />
        <AddressSuggest />
      </div>
    </FormProvider>
  );
}

const cardData: ProductCardData = {
  id: 'product-1',
  slug: 'long-title-card',
  name: 'RITM Longsleeve Japan Green',
  brand: 'RITM',
  categoryName: 'Longsleeves',
  imageUrl: '/images/product.jpg',
  imageAlt: 'Longsleeve',
  minPrice: 4990,
  minCompareAtPrice: null,
  badges: [],
  soldOut: false,
  colorways: [
    {
      id: 'cw',
      name: 'Green',
      swatchHex: '#6f7f68',
      imageUrl: '/images/product.jpg',
      variants: [{ size: 'S', sizeOrder: 2, inStock: true, variantId: 'variant-s' }],
    },
  ],
  sizes: [{ size: 'S', sizeOrder: 2, inStock: true, variantId: 'variant-s' }],
};

describe('storefront UI regressions', () => {
  it('positions address suggestions below the input field', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: () =>
          Promise.resolve({
            suggestions: [
              {
                value: 'г Новосибирск, ул Ульяновская',
                data: { city: 'Новосибирск', street_with_type: null, house: null },
              },
            ],
          }),
      }),
    );

    render(<AddressSuggestHost />);

    const item = await screen.findByRole('button', { name: 'г Новосибирск, ул Ульяновская' });
    const list = item.closest('ul');
    expect(list?.className).toContain('top-full');
    expect(list?.className).toContain('left-0');
  });

  it('renders the active wishlist counter as white with black text', () => {
    window.history.replaceState(null, '', '/profile#favorites');

    render(<WishlistBadge />);

    expect(screen.getByText('2').className).toContain('bg-white');
    expect(screen.getByText('2').className).toContain('text-ink');
  });

  it('renders the active catalog size filter as black with white text', () => {
    render(<SizeFilter />);

    const activeSize = screen.getByRole('button', { name: 'S' });
    expect(activeSize.className).toContain('bg-ink');
    expect(activeSize.className).toContain('text-white');
  });

  it('keeps catalog card title and price on separate rows at narrow widths', () => {
    render(<CatalogProductCard data={cardData} />);

    const title = screen.getByRole('heading', { name: 'RITM Longsleeve Japan Green' });
    expect(title.closest('article')?.className).toContain('[container-type:inline-size]');
    expect(title.className).toContain('text-[clamp(21px,8cqw,26px)]');
    expect(screen.getByText(/4[\s\u00a0]990/).closest('p')?.className).toContain('justify-self-end');
  });
});
