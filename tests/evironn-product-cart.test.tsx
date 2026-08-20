/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ProductPage from '@/components/evironn/product/ProductPage';
import type { ShowcaseProductPageDto } from '@/lib/showcase-product';

const addCartItem = vi.fn().mockResolvedValue(undefined);
vi.mock('@/store', () => ({
  useCartStore: (selector: (state: { addCartItem: typeof addCartItem }) => unknown) => selector({ addCartItem }),
}));
vi.mock('@/components/evironn/home/interactive-furniture-cards', () => ({
  InteractiveFurnitureCards: ({ heading }: { heading: string }) => <section>{heading}</section>,
}));

const combinations = [
  ['ivory', 'pine', 'sku-ivory-pine', 2],
  ['ivory', 'walnut', 'sku-ivory-walnut', 3],
  ['charcoal', 'pine', 'sku-charcoal-pine', 3],
  ['charcoal', 'walnut', 'sku-charcoal-walnut', 3],
  ['terracotta', 'pine', 'sku-terracotta-pine', 3],
  ['terracotta', 'walnut', 'sku-terracotta-walnut', 3],
] as const;

const model: ShowcaseProductPageDto = {
  product: { name: 'Кресло Graphite', description: 'Описание', categoryName: 'Кресла', categorySlug: 'armchairs' },
  sceneBackgroundUrl: '/scene.png',
  selected: undefined as never,
  combinations: combinations.map(([upholstery, wood, skuId, stock]) => ({
    upholstery,
    wood,
    canonicalOption: `finish=${wood}&upholstery=${upholstery}`,
    canonicalPath: `/product/noma?option=${upholstery}-${wood}`,
    chairUrl: '/chair.png',
    sku: {
      id: skuId,
      articleNumber: skuId,
      price: 89990,
      oldPrice: 109990,
      stock,
      priceLabel: '89 990 ₽',
      oldPriceLabel: '109 990 ₽',
    },
  })),
  turntable: { videoUrl: '/360.webm', posterUrl: '/360.jpg', fallbackUrl: '/fallback.jpg', alt: 'Кресло' },
};
model.selected = model.combinations[1];

beforeEach(() => {
  addCartItem.mockClear();
  vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    })),
  );
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('ProductPage canonical cart controls', () => {
  it('submits the selected canonical SKU from both accepted add controls', async () => {
    render(<ProductPage model={model} />);
    fireEvent.click(screen.getByRole('button', { name: 'Добавить в корзину' }));
    await waitFor(() => expect(addCartItem).toHaveBeenCalledWith({ skuId: 'sku-ivory-walnut', quantity: 1 }));
    fireEvent.click(screen.getByRole('button', { name: 'Смотреть кресло в 360°' }));
    fireEvent.click(screen.getByRole('button', { name: 'Добавить в корзину' }));
    await waitFor(() => expect(addCartItem).toHaveBeenCalledTimes(2));
    expect(addCartItem).toHaveBeenLastCalledWith({ skuId: 'sku-ivory-walnut', quantity: 1 });
  });

  it('changes the submitted SKU with the selected combination and removes the decorative pilot notice', async () => {
    render(<ProductPage model={model} />);
    fireEvent.click(screen.getByRole('button', { name: 'Обивка: Терракота' }));
    fireEvent.click(screen.getByRole('button', { name: 'Дерево: Сосна' }));
    fireEvent.click(screen.getByRole('button', { name: 'Добавить в корзину' }));
    await waitFor(() => expect(addCartItem).toHaveBeenCalledWith({ skuId: 'sku-terracotta-pine', quantity: 1 }));
    expect(screen.queryByText(/доступно после завершения пилота/i)).toBeNull();
  });

  it('disables both controls only while submitting or when the selected SKU has no stock', async () => {
    let resolveAdd!: () => void;
    addCartItem.mockImplementationOnce(() => new Promise<void>((resolve) => (resolveAdd = resolve)));
    render(<ProductPage model={model} />);
    const mainButton = screen.getByRole('button', { name: 'Добавить в корзину' });
    fireEvent.click(mainButton);
    expect(mainButton).toBeDisabled();
    expect(addCartItem).toHaveBeenCalled();
    resolveAdd();
    await waitFor(() => expect(mainButton).not.toBeDisabled());
    fireEvent.click(screen.getByRole('button', { name: 'Обивка: Терракота' }));
    fireEvent.click(screen.getByRole('button', { name: 'Дерево: Сосна' }));
    expect(screen.getByRole('button', { name: 'Добавить в корзину' })).not.toBeDisabled();
  });
});
