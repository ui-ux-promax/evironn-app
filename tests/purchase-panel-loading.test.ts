/** @vitest-environment jsdom */
import React from 'react';
import { readFileSync } from 'node:fs';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ProductPage from '@/components/evironn/product/ProductPage';
import type { ShowcaseProductPageDto } from '@/lib/showcase-product';

vi.mock('@/components/evironn/home/interactive-furniture-cards', () => ({
  InteractiveFurnitureCards: () => React.createElement('section'),
}));

const selectedCombination = {
  upholstery: 'ivory' as const,
  wood: 'walnut' as const,
  canonicalOption: 'finish=walnut&upholstery=ivory-boucle',
  canonicalPath: '/product/noma-woven-lounge?option=selected',
  chairUrl: '/chair.png',
  sku: {
    id: 'sku',
    articleNumber: 'EV-NWL',
    price: 89990,
    oldPrice: 109990,
    stock: 3,
    priceLabel: '89 990 ₽',
    oldPriceLabel: '109 990 ₽',
  },
};

const model: ShowcaseProductPageDto = {
  product: {
    name: 'Кресло Graphite',
    description: 'Мягкое кресло.',
    categoryName: 'Кресла',
    categorySlug: 'armchairs',
  },
  sceneBackgroundUrl: '/scene.png',
  selected: selectedCombination,
  combinations: [selectedCombination],
  turntable: {
    videoUrl: '/turntable.webm',
    posterUrl: '/poster.png',
    fallbackUrl: '/fallback.png',
    alt: 'Noma 360',
  },
};

beforeEach(() => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
  vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('showcase ProductPage decorative purchase controls', () => {
  it('keeps both add controls disabled and free of cart/store/action behavior', () => {
    const source = readFileSync('components/evironn/product/ProductPage.tsx', 'utf8');
    expect(source).not.toMatch(/cartCountStore|useCartCount|setCartCount|addProductToCart|useCartStore/);

    render(React.createElement(ProductPage, { model }));
    fireEvent.click(screen.getByRole('button', { name: 'Смотреть кресло в 360°' }));

    const controls = screen.getAllByRole('button', { name: 'Добавить в корзину', hidden: true });
    expect(controls).toHaveLength(2);
    expect(controls.every((control) => (control as HTMLButtonElement).disabled)).toBe(true);
    expect(new Set(controls.map((control) => control.getAttribute('aria-disabled')))).toEqual(new Set(['true']));
    expect(new Set(controls.map((control) => control.getAttribute('aria-describedby'))).size).toBe(1);

    const noticeId = controls[0].getAttribute('aria-describedby');
    expect(noticeId).toBeTruthy();
    expect(document.getElementById(noticeId as string)).toHaveTextContent(
      'Добавление в корзину будет доступно после завершения пилота',
    );
    expect(document.getElementById(noticeId as string)).toHaveClass('product-page__visually-hidden');
  });
});
