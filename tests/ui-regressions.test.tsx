/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AddressSuggest } from '@/components/shared/checkout/address-suggest';
import { WishlistBadge } from '@/components/shared/wishlist/wishlist-badge';
import { CatalogProductCard } from '@/components/shared/catalog/catalog-product-card';
import type { FurnitureProductCardData } from '@/lib/furniture-product-summary';

const pathname = vi.hoisted(() => ({ value: '/profile' }));
const wishlistCount = vi.hoisted(() => ({ value: 2 }));

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
}));

vi.mock('@/components/shared/wishlist/wishlist-heart', () => ({
  WishlistHeart: () => React.createElement('button', { type: 'button' }, 'wishlist'),
}));

afterEach(() => {
  cleanup();
  pathname.value = '/profile';
  wishlistCount.value = 2;
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

const cardData: FurnitureProductCardData = {
  id: 'product-1',
  slug: 'long-title-card',
  name: 'Evironn Long Title Chair',
  brand: 'Evironn',
  categoryName: 'Armchairs',
  imageUrl: '/images/product.jpg',
  imageAlt: 'Chair',
  primarySkuId: 'sku-1',
  minPrice: 4990,
  minOldPrice: null,
  badges: [],
  soldOut: false,
  optionSwatches: [{ groupSlug: 'finish', valueSlug: 'oak', label: 'Oak', swatchHex: '#c8a97e' }],
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

  it('keeps catalog card title and price on separate rows at narrow widths', () => {
    render(<CatalogProductCard data={cardData} />);

    const title = screen.getByRole('heading', { name: 'Evironn Long Title Chair' });
    expect(title.closest('article')?.className).toContain('[container-type:inline-size]');
    expect(title.className).toContain('text-[clamp(21px,8cqw,26px)]');
    expect(screen.getByText(/4[\s\u00a0]990/).closest('p')?.className).toContain('justify-self-end');
  });
});
