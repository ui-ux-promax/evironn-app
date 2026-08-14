/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { readFileSync } from 'node:fs';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ProductPage from '@/components/evironn/product/ProductPage';
import type { ShowcaseProductPageDto } from '@/lib/showcase-product';

vi.mock('@/components/evironn/home/interactive-furniture-cards', () => ({
  InteractiveFurnitureCards: ({ heading }: { heading: string }) => <section>{heading}</section>,
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
    description: 'Мягкое кресло с графитовой обивкой и каркасом из тёмного ореха для спокойных жилых пространств.',
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
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('exact showcase ProductPage shell', () => {
  it('keeps clone root, scene, panel, copy, benefits, features, accordions, and recommendations', async () => {
    render(<ProductPage model={model} />);

    expect(screen.getByRole('main')).toHaveClass('product-page');
    expect(document.querySelector('.product-page__scene')).toBeInTheDocument();
    expect(document.querySelector('.product-page__panel')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Кресло Graphite' })).toBeVisible());
    expect(screen.getByText('Легко чистится')).toBeVisible();
    expect(screen.getByText('Водоотталкивающая ткань')).toBeVisible();
    expect(screen.getByText('Износостойкая ткань')).toBeVisible();
    expect(screen.getByText('Мягкая фактурная ткань для комфорта')).toBeVisible();
    expect(screen.getByText('Цельный каркас из тёмного ореха')).toBeVisible();
    expect(screen.getByText('Надёжное основание из массива дерева')).toBeVisible();
    expect(screen.getByText('Упругая пена для поддержки')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Описание' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Идеально для' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Уход' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Стиль' })).toBeVisible();
    expect(screen.getByText('Также смотрят')).toBeVisible();
  });

  it('closes through backdrop and Escape, restores scroll lock, and traps dialog focus', async () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 512 });
    render(<ProductPage model={model} />);
    const launchButton = screen.getByRole('button', { name: 'Смотреть кресло в 360°' });
    launchButton.focus();
    fireEvent.click(launchButton);

    const dialog = screen.getByRole('dialog') as HTMLElement;
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Закрыть режим 360' })));
    expect(document.documentElement.style.overflow).toBe('hidden');
    expect(document.body.style.position).toBe('fixed');

    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'Tab' });
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'Tab', shiftKey: true });
    expect(dialog).toContainElement(document.activeElement as HTMLElement);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.documentElement.style.overflow).toBe('');
    expect(document.body.style.position).toBe('');
    expect(document.activeElement).toBe(launchButton);
    expect(scrollTo).toHaveBeenCalledWith(0, 512);

    fireEvent.click(launchButton);
    fireEvent.click(screen.getByRole('dialog').parentElement as HTMLElement);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(launchButton).toBeInTheDocument();
  });

  it('keeps clone 25 percent mobile positioning rule', () => {
    const source = readFileSync('styles/evironn/ProductPage.css', 'utf8');
    expect(source).toMatch(
      /@media \(min-width: 401px\) and \(max-width: 640px\)[\s\S]*background-position: 25% center/,
    );
    expect(source).toMatch(/@media \(min-width: 401px\) and \(max-width: 640px\)[\s\S]*object-position: 25% center/);
  });
});
