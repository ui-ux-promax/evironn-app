/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ProductPage from '@/components/evironn/product/ProductPage';
import type {
  ShowcaseCombinationDto,
  ShowcaseProductPageDto,
  ShowcaseUpholsteryId,
  ShowcaseWoodId,
} from '@/lib/showcase-product';

vi.mock('@/components/evironn/home/interactive-furniture-cards', () => ({
  InteractiveFurnitureCards: ({ heading }: { heading: string }) => React.createElement('section', null, heading),
}));

const turntable = {
  videoUrl: '/assets/products/05-graphite-walnut-lounge-chair-turntable-alpha.webm',
  posterUrl: '/assets/products/05-graphite-walnut-lounge-chair-turntable-poster.png',
  fallbackUrl: '/assets/products/05-graphite-walnut-lounge-chair-turntable-poster.png',
  alt: 'Noma 360',
};

const combinations: ShowcaseCombinationDto[] = [
  ['ivory', 'pine'],
  ['ivory', 'walnut'],
  ['charcoal', 'pine'],
  ['charcoal', 'walnut'],
  ['terracotta', 'pine'],
  ['terracotta', 'walnut'],
].map(([upholstery, wood], index) => ({
  upholstery: upholstery as ShowcaseUpholsteryId,
  wood: wood as ShowcaseWoodId,
  canonicalOption: `finish=${wood === 'pine' ? 'oak' : 'walnut'}&upholstery=${upholstery}`,
  canonicalPath: `/product/noma-woven-lounge?option=finish%3A${wood === 'pine' ? 'oak' : 'walnut'}%2Cupholstery%3A${upholstery}`,
  chairUrl: `/assets/products/chair-${upholstery}-${wood}.png`,
  sku: {
    id: `sku-${index}`,
    articleNumber: `EV-NWL-${index}`,
    price: 89990 + index * 1000,
    oldPrice: 109990 + index * 1000,
    stock: 3,
    priceLabel: `${89990 + index * 1000}`,
    oldPriceLabel: `${109990 + index * 1000}`,
  },
}));

const model: ShowcaseProductPageDto = {
  product: {
    name: 'Кресло Graphite',
    description: 'Мягкое кресло для спокойных жилых пространств.',
    categoryName: 'Кресла',
    categorySlug: 'armchairs',
  },
  sceneBackgroundUrl: '/assets/products/05-graphite-walnut-room-background-fixed.png',
  selected: combinations[1],
  combinations,
  turntable,
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
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('showcase ProductPage visual selection', () => {
  it('projects every upholstery/wood selection immediately without router navigation or scroll movement', () => {
    const replaceState = vi.spyOn(window.history, 'replaceState').mockImplementation(() => undefined);
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 640 });

    render(React.createElement(ProductPage, { model }));

    for (const combination of combinations) {
      fireEvent.click(
        screen.getByRole('button', {
          name: `Обивка: ${combination.upholstery === 'ivory' ? 'Айвори' : combination.upholstery === 'charcoal' ? 'Графит' : 'Терракота'}`,
        }),
      );
      fireEvent.click(
        screen.getByRole('button', { name: `Дерево: ${combination.wood === 'pine' ? 'Сосна' : 'Орех'}` }),
      );

      expect(document.querySelector<HTMLImageElement>('.product-page__scene-chair')).toHaveAttribute(
        'src',
        combination.chairUrl,
      );
      expect(replaceState).toHaveBeenLastCalledWith(null, '', combination.canonicalPath);
      expect(window.scrollY).toBe(640);
    }

    expect(replaceState).toHaveBeenCalled();
    expect(scrollTo).not.toHaveBeenCalled();
  });
});
