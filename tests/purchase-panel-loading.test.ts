/** @vitest-environment jsdom */
import React from 'react';
import { readFileSync } from 'node:fs';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ProductPage from '@/components/evironn/product/ProductPage';
import type { ShowcaseProductPageDto } from '@/lib/showcase-product';

const cartMock = vi.hoisted(() => ({ addCartItem: vi.fn(), error: false }));

vi.mock('@/store', () => ({
  useCartStore: (selector: (state: typeof cartMock) => unknown) => selector(cartMock),
}));

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
  cartMock.addCartItem.mockReset();
  cartMock.error = false;
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

describe('showcase ProductPage purchase controls', () => {
  it('uses canonical cart writes and disables both controls only for unavailable stock', () => {
    const source = readFileSync('components/evironn/product/ProductPage.tsx', 'utf8');
    expect(source).toContain('useCartStore');
    expect(source).toContain('addCartItem');
    expect(source).toContain('cartAddError');
    expect(source).toContain('currentCombination.sku.id');
    expect(source).not.toContain('productVariantId');

    render(React.createElement(ProductPage, { model }));
    fireEvent.click(screen.getByRole('button', { name: 'Смотреть кресло в 360°' }));

    const controls = screen.getAllByRole('button', { name: 'Добавить в корзину', hidden: true });
    expect(controls).toHaveLength(2);
    expect(controls.every((control) => !(control as HTMLButtonElement).disabled)).toBe(true);

    cleanup();
    const unavailableModel = {
      ...model,
      selected: { ...model.selected, sku: { ...model.selected.sku, stock: 0 } },
      combinations: model.combinations.map((combination) => ({
        ...combination,
        sku: { ...combination.sku, stock: 0 },
      })),
    };
    render(React.createElement(ProductPage, { model: unavailableModel }));
    fireEvent.click(screen.getByRole('button', { name: 'Смотреть кресло в 360°' }));
    expect(
      screen
        .getAllByRole('button', { name: 'Добавить в корзину', hidden: true })
        .every((control) => (control as HTMLButtonElement).disabled),
    ).toBe(true);
  });

  it('shows a visible alert when the canonical add-to-cart mutation rejects', async () => {
    cartMock.addCartItem.mockRejectedValueOnce(new Error('Недостаточно на складе'));
    render(React.createElement(ProductPage, { model }));

    fireEvent.click(screen.getByRole('button', { name: 'Смотреть кресло в 360°' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Добавить в корзину' }));

    await waitFor(() => expect(within(dialog).getByRole('alert')).toHaveTextContent('Не удалось добавить товар в корзину'));
  });
});
