/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
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
  InteractiveFurnitureCards: () => <section data-testid="recommendations" />,
}));

const turntable = {
  videoUrl: '/assets/products/05-graphite-walnut-lounge-chair-turntable-alpha.webm',
  posterUrl: '/assets/products/05-graphite-walnut-lounge-chair-turntable-poster.webp',
  fallbackUrl: '/assets/products/05-graphite-walnut-lounge-chair-turntable-poster.webp',
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
  canonicalPath: `/product/noma-woven-lounge?option=${index}`,
  chairUrl: `/assets/products/chair-${upholstery}-${wood}.png`,
  sku: {
    id: `sku-${index}`,
    articleNumber: `EV-NWL-${index}`,
    price: 89990,
    oldPrice: 109990,
    stock: 3,
    priceLabel: '89 990 ₽',
    oldPriceLabel: '109 990 ₽',
  },
}));

const model: ShowcaseProductPageDto = {
  product: {
    name: 'Кресло Graphite',
    description: 'Мягкое кресло для спокойных жилых пространств.',
    categoryName: 'Кресла',
    categorySlug: 'armchairs',
  },
  sceneBackgroundUrl: '/assets/products/05-graphite-walnut-room-background-fixed.webp',
  selected: combinations[1],
  combinations,
  turntable,
};

let reducedMotion = false;

beforeEach(() => {
  reducedMotion = false;
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)' ? reducedMotion : false,
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

describe('showcase ProductPage 360 stage', () => {
  it('keeps media static before open, plays normal mode on open, and closes cleanly', async () => {
    render(<ProductPage model={model} />);

    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Смотреть кресло в 360°' }));

    const video = screen.getByRole('dialog').querySelector('video') as HTMLVideoElement;
    expect(video).toHaveAttribute('src', turntable.videoUrl);
    expect(video).toHaveAttribute('poster', turntable.posterUrl);
    expect(video).toHaveAttribute('autoplay');
    expect(video).toHaveAttribute('loop');
    expect(video).toHaveAttribute('playsinline');
    expect(video).toHaveAttribute('preload', 'auto');
    expect((video as HTMLVideoElement).muted).toBe(true);
    expect(screen.queryByTestId('product-page-360-poster')).toBeNull();
    expect(screen.queryByTestId('product-page-360-fallback')).toBeNull();
    expect(screen.getByRole('dialog').querySelectorAll('.product-page__product-media')).toHaveLength(1);
    await waitFor(() => expect(HTMLMediaElement.prototype.play).toHaveBeenCalledOnce());

    fireEvent.loadedMetadata(video);
    fireEvent.play(video);
    Object.defineProperty(video, 'paused', { configurable: true, value: false });
    expect(screen.getByRole('button', { name: 'Пауза' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Пауза' }));
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole('button', { name: 'Закрыть режим 360' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('pauses pointer drag and coalesces scrub seeks through existing video helpers', async () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    render(<ProductPage model={model} />);
    fireEvent.click(screen.getByRole('button', { name: 'Смотреть кресло в 360°' }));
    const video = screen.getByRole('dialog').querySelector('video') as HTMLVideoElement;
    Object.defineProperty(video, 'duration', { configurable: true, value: 10 });
    Object.defineProperty(video, 'currentTime', { configurable: true, writable: true, value: 2 });
    Object.defineProperty(video, 'seeking', { configurable: true, writable: true, value: true });
    Object.assign(video, {
      setPointerCapture: vi.fn(),
      hasPointerCapture: vi.fn(() => true),
      releasePointerCapture: vi.fn(),
      getBoundingClientRect: () => ({ width: 100, height: 100, top: 0, left: 0, right: 100, bottom: 100 }),
    });

    fireEvent.pointerDown(video, { pointerId: 1, clientX: 20 });
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalledOnce();
    fireEvent.pointerMove(video, { pointerId: 1, clientX: 40 });
    expect(video.currentTime).toBe(2);
    (video as HTMLVideoElement & { seeking: boolean }).seeking = false;
    fireEvent.seeked(video);
    fireEvent.pointerUp(video, { pointerId: 1, clientX: 40 });
    await waitFor(() => expect(video.currentTime).not.toBe(2));
  });

  it('keeps reduced-motion mode non-autoplaying and non-looping until explicit click', async () => {
    reducedMotion = true;
    render(<ProductPage model={model} />);
    fireEvent.click(screen.getByRole('button', { name: 'Смотреть кресло в 360°' }));

    const video = screen.getByRole('dialog').querySelector('video') as HTMLVideoElement;
    await waitFor(() => expect(video).not.toHaveAttribute('autoplay'));
    expect(video).not.toHaveAttribute('loop');
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();

    fireEvent.loadedMetadata(video);
    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledOnce();
  });

  it('shows exact static fallback after video failure', () => {
    render(<ProductPage model={model} />);
    fireEvent.click(screen.getByRole('button', { name: 'Смотреть кресло в 360°' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.error(dialog.querySelector('video') as HTMLVideoElement);

    expect(screen.queryByRole('dialog')?.querySelector('video')).toBeNull();
    expect(screen.getByTestId('product-page-360-fallback')).toBeVisible();
    expect(screen.getByTestId('product-page-360-fallback')).toHaveClass('product-page__product-media');
    expect(screen.getByRole('dialog').querySelectorAll('.product-page__product-media')).toHaveLength(1);
    expect(screen.queryByRole('button', { name: 'Пауза' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Продолжить' })).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent('360° недоступен, показано статичное изображение');
  });
});
