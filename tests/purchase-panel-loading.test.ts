/** @vitest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PurchasePanel } from '@/components/shared/product/purchase-panel';

const addCartItem = vi.hoisted(() => vi.fn());
(globalThis as typeof globalThis & { React: typeof React }).React = React;

vi.mock('axios', () => ({ default: { isAxiosError: () => false } }));
vi.mock('@/store', () => ({
  useCartStore: (selector: (state: { addCartItem: typeof addCartItem }) => unknown) => selector({ addCartItem }),
}));
vi.mock('@/hooks/use-countdown', () => ({ useCountdown: () => ({ seconds: 0, start: vi.fn() }) }));
vi.mock('@/components/shared/product/rating-stars', () => ({ RatingStars: () => null }));
vi.mock('@/components/shared/product/product-accordions', () => ({ ProductAccordions: () => null }));
vi.mock('@/components/shared/product/size-guide-dialog', () => ({ SizeGuideDialog: () => null }));

describe('PurchasePanel', () => {
  it('shows a spinner while adding the selected variant', () => {
    addCartItem.mockReturnValueOnce(new Promise<void>(() => {}));
    render(
      React.createElement(PurchasePanel, {
        productName: 'Hoodie',
        colorways: [],
        activeColorwaySlug: 'sage',
        activeColorwayName: 'Sage',
        variants: [{ id: 'variant-1', size: 'M', stock: 3, active: true, price: 5400, compareAtPrice: null }],
        fitNote: null,
        productSlug: 'hoodie',
        description: null,
        specs: null,
        ratingAvg: null,
        ratingCount: 0,
        onColorChange: vi.fn(),
      }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'M' }));
    fireEvent.click(screen.getByRole('button', { name: 'Добавить в корзину' }));

    const button = screen.getByRole('button', { name: 'Добавляем' }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.querySelector('svg.animate-spin')).not.toBeNull();
    expect(button.className).toContain('bg-ink/20');
  });
});
