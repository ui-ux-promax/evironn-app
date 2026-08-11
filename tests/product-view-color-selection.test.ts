/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProductView } from '@/components/shared/product/product-view';

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const routerPush = vi.hoisted(() => vi.fn());

vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    fill: _fill,
    priority,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & {
    src: string;
    fill?: boolean;
    priority?: boolean;
  }) => React.createElement('img', { src, alt, ...props, 'data-test-priority': priority ? 'true' : 'false' }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: routerPush }),
}));

vi.mock('@/components/shared/product/purchase-panel', () => ({
  PurchasePanel: ({
    onColorChange,
    onSelectedVariantChange,
  }: {
    onColorChange: (slug: string) => void;
    onSelectedVariantChange?: (variantId: string | null) => void;
  }) =>
    React.createElement(
      React.Fragment,
      null,
      React.createElement('button', { type: 'button', onClick: () => onColorChange('terracotta') }, 'Terracotta'),
      React.createElement(
        'button',
        { type: 'button', onClick: () => onSelectedVariantChange?.('variant-graphite') },
        'Select size',
      ),
    ),
}));

vi.mock('@/components/shared/wishlist/wishlist-heart', () => ({
  WishlistHeart: () => null,
}));

vi.mock('@/components/shared/product/reviews-section', () => ({
  ReviewsSection: () => null,
}));

vi.mock('@/components/shared/product/breadcrumbs', () => ({
  Breadcrumbs: () => null,
}));

beforeEach(() => {
  routerPush.mockClear();
});

afterEach(() => cleanup());

describe('ProductView colour selection', () => {
  it('changes the gallery without navigation and retains the selected colour in the URL', () => {
    window.history.replaceState(null, '', '/product/cables');
    const replaceState = vi.spyOn(window.history, 'replaceState');

    render(
      React.createElement(ProductView, {
        product: {
          id: 'p1',
          name: 'CABLES',
          slug: 'cables',
          fitNote: null,
          description: null,
          specs: null,
          category: { name: 'Knitwear', slug: 'knitwear' },
        },
        galleryImages: [{ url: '/graphite.jpg', alt: 'Graphite cardigan' }],
        isNew: false,
        panelColorways: [
          { slug: 'graphite', name: 'Graphite', swatchHex: '#4b5563', thumbUrl: '/graphite.jpg' },
          { slug: 'terracotta', name: 'Terracotta', swatchHex: '#b9654b', thumbUrl: '/terracotta.jpg' },
        ],
        activeColorwaySlug: 'graphite',
        activeColorwayName: 'Graphite',
        panelVariants: [
          { id: 'variant-graphite', size: 'S', stock: 1, active: true, price: 5500, compareAtPrice: 6000 },
        ],
        ratingAvg: null,
        ratingCount: 0,
        reviews: [],
        reviewState: 'guest',
        related: [],
        wishlistedIds: new Set<string>(),
        wishlisted: false,
        productId: 'p1',
        colorways: [
          {
            slug: 'graphite',
            name: 'Graphite',
            swatchHex: '#4b5563',
            thumbUrl: '/graphite.jpg',
            galleryImages: [{ url: '/graphite.jpg', alt: 'Graphite cardigan' }],
            variants: [
              { id: 'variant-graphite', size: 'S', stock: 1, active: true, price: 5500, compareAtPrice: 6000 },
            ],
          },
          {
            slug: 'terracotta',
            name: 'Terracotta',
            swatchHex: '#b9654b',
            thumbUrl: '/terracotta.jpg',
            galleryImages: [{ url: '/terracotta.jpg', alt: 'Terracotta cardigan' }],
            variants: [
              { id: 'variant-terracotta', size: 'S', stock: 1, active: true, price: 5500, compareAtPrice: null },
            ],
          },
          {
            slug: 'clay',
            name: 'Clay',
            swatchHex: '#a05a42',
            thumbUrl: '/terracotta.jpg',
            galleryImages: [{ url: '/terracotta.jpg', alt: 'Clay cardigan' }],
            variants: [{ id: 'variant-clay', size: 'S', stock: 1, active: true, price: 5500, compareAtPrice: null }],
          },
        ],
      } as never),
    );

    const preloadedImage = document.querySelector('img[data-preload-image="/terracotta.jpg"]');

    expect(preloadedImage?.getAttribute('sizes')).toBe('(min-width: 1024px) 600px, 100vw');
    expect(preloadedImage?.getAttribute('loading')).toBe('eager');
    expect(preloadedImage?.getAttribute('data-test-priority')).toBe('false');
    expect(document.querySelectorAll('img[data-preload-image="/terracotta.jpg"]')).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'Terracotta' }));

    expect(screen.getAllByAltText('Terracotta cardigan')[0].getAttribute('src')).toBe('/terracotta.jpg');
    expect(replaceState).toHaveBeenCalledWith(null, '', '/product/cables?color=terracotta');
  });

  it('shows the previous price when the active colourway is discounted', () => {
    window.history.replaceState(null, '', '/product/cables');

    render(
      React.createElement(ProductView, {
        product: {
          id: 'p1',
          name: 'CABLES',
          slug: 'cables',
          fitNote: null,
          description: null,
          specs: null,
          category: { name: 'Knitwear', slug: 'knitwear' },
        },
        isNew: false,
        initialColorwaySlug: 'graphite',
        ratingAvg: null,
        ratingCount: 0,
        reviews: [],
        reviewState: 'guest',
        related: [],
        wishlistedIds: new Set<string>(),
        wishlisted: false,
        productId: 'p1',
        colorways: [
          {
            slug: 'graphite',
            name: 'Graphite',
            swatchHex: '#4b5563',
            thumbUrl: '/graphite.jpg',
            galleryImages: [{ url: '/graphite.jpg', alt: 'Graphite cardigan' }],
            variants: [
              { id: 'variant-graphite', size: 'S', stock: 1, active: true, price: 5500, compareAtPrice: 6000 },
            ],
          },
        ],
      }),
    );

    expect(screen.getByText(/6[\s\u00a0]000 ₽/)).toBeTruthy();
  });

  it('routes buy now to checkout for the selected variant only', () => {
    const { container } = render(
      React.createElement(ProductView, {
        product: {
          id: 'p1',
          name: 'CABLES',
          slug: 'cables',
          fitNote: null,
          description: null,
          specs: null,
          category: { name: 'Knitwear', slug: 'knitwear' },
        },
        isNew: false,
        initialColorwaySlug: 'graphite',
        ratingAvg: null,
        ratingCount: 0,
        reviews: [],
        reviewState: 'guest',
        related: [],
        wishlistedIds: new Set<string>(),
        wishlisted: false,
        productId: 'p1',
        colorways: [
          {
            slug: 'graphite',
            name: 'Graphite',
            swatchHex: '#4b5563',
            thumbUrl: '/graphite.jpg',
            galleryImages: [{ url: '/graphite.jpg', alt: 'Graphite cardigan' }],
            variants: [
              { id: 'variant-graphite', size: 'S', stock: 1, active: true, price: 5500, compareAtPrice: null },
            ],
          },
        ],
      }),
    );

    const buyNow = container.querySelector('button[aria-busy]') as HTMLButtonElement;
    expect(buyNow.disabled).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Select size' }));
    expect(buyNow.disabled).toBe(false);

    fireEvent.click(buyNow);
    expect(routerPush).toHaveBeenCalledWith('/checkout?buyNow=variant-graphite');
  });
});
