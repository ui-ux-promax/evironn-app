/** @vitest-environment jsdom */

import { readFileSync } from 'node:fs';
import path from 'node:path';

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({ children, ...props }: React.ComponentProps<'a'>) => <a {...props}>{children}</a>,
}));

vi.stubGlobal('matchMedia', (query: string) => ({
  matches: false,
  media: query,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  addListener: vi.fn(),
  removeListener: vi.fn(),
  onchange: null,
  dispatchEvent: vi.fn(),
}));

const playMock = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => undefined);

import { Hero } from '@/components/evironn/home/hero';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const heroCss = readFileSync(path.join(process.cwd(), 'styles/evironn/home/hero.css'), 'utf8');

describe('Evironn interactive hero shell', () => {
  it('renders clone roots, Russian copy, room controls, hotspots, and accessible product fallback', () => {
    render(<Hero />);

    const hero = screen.getByRole('region', { name: 'Мебель с душой, созданная поколениями' });
    expect(hero).toHaveAttribute('id', 'evironn-hero');
    expect(hero).toHaveAttribute('data-hero-font', 'golos-text');
    expect(within(hero).getByRole('heading', { name: /Мебель с душой/ })).toBeInTheDocument();
    expect(within(hero).getByRole('group', { name: 'Категория комнаты' })).toBeInTheDocument();
    expect(within(hero).getAllByRole('button', { name: /Смотреть/ })).toHaveLength(2);
    expect(within(hero).getByRole('link', { name: 'СМОТРЕТЬ КОЛЛЕКЦИЮ' })).toHaveAttribute(
      'href',
      '/catalog?room=living',
    );
    expect(within(hero).getByRole('button', { name: 'ПОСМОТРЕТЬ ИСТОРИЮ' })).toBeInTheDocument();
    expect(within(hero).getByRole('button', { name: /Диван Linden/ })).toBeEnabled();
  });

  it('uses a real canonical room collection link', () => {
    render(<Hero />);
    expect(screen.getByRole('link', { name: 'СМОТРЕТЬ КОЛЛЕКЦИЮ' })).toHaveAttribute('href', '/catalog?room=living');
  });

  it('hands off room and product interactions through media event callbacks', () => {
    render(<Hero />);
    const kitchen = screen.getByRole('button', { name: 'КУХНЯ' });
    expect(kitchen).toBeDisabled();

    const livingImages = [...document.querySelectorAll<HTMLImageElement>('#evironn-hero img')];
    expect(livingImages.some((image) => image.getAttribute('src') === '/assets/hero/living-room-idle.png')).toBe(true);
    fireEvent.load(livingImages.find((image) => image.getAttribute('src') === '/assets/hero/kitchen-idle.jpg')!);
    expect(kitchen).not.toBeDisabled();
    fireEvent.click(kitchen);
    expect(kitchen).toBeDisabled();
  });

  it('exposes loaded hero image dimensions and video metadata before transition playback', () => {
    render(<Hero />);

    const roomImages = [...document.querySelectorAll<HTMLImageElement>('.furni-hero-room-media__image')];
    for (const image of roomImages) {
      Object.defineProperty(image, 'naturalWidth', { configurable: true, value: 1920 });
      Object.defineProperty(image, 'naturalHeight', { configurable: true, value: 1080 });
      fireEvent.load(image);
      expect(image.naturalWidth).toBeGreaterThan(0);
      expect(image.naturalHeight).toBeGreaterThan(0);
    }

    fireEvent.click(screen.getByRole('button', { name: /Диван Linden/ }));
    const video = document.querySelector<HTMLVideoElement>('video[src="/assets/hero/sofa-forward.mp4"]');
    expect(video).not.toBeNull();
    Object.defineProperty(video, 'duration', { configurable: true, value: 6 });
    fireEvent.loadedMetadata(video!);
    expect(video!.duration).toBeGreaterThan(0);
    fireEvent.loadedData(video!);
    expect(playMock).toHaveBeenCalledTimes(1);
  });

  it('recovers stable media after room image and transition video errors', () => {
    render(<Hero />);

    const kitchen = screen.getByRole('button', { name: 'КУХНЯ' });
    const kitchenImage = document.querySelector<HTMLImageElement>('img[src="/assets/hero/kitchen-idle.jpg"]');
    fireEvent.load(kitchenImage!);
    fireEvent.click(kitchen);
    fireEvent.error(kitchenImage!);
    expect(kitchen).not.toBeDisabled();
    expect(document.querySelector('img[src="/assets/hero/living-room-idle.png"]')).toHaveClass('is-stable');

    fireEvent.click(screen.getByRole('button', { name: /Диван Linden/ }));
    const video = document.querySelector<HTMLVideoElement>('video[src="/assets/hero/sofa-forward.mp4"]');
    fireEvent.error(video!);
    expect(screen.queryByRole('button', { name: /Назад/ })).not.toBeInTheDocument();
    expect(document.querySelector('img[src="/assets/hero/living-room-idle.png"]')).toHaveClass('is-stable');
  });

  it('keeps the source-faithful media, keyboard, cleanup, and reduced-motion contracts', () => {
    expect(heroCss).toMatch(/#evironn-hero/);
    expect(heroCss).toMatch(/furni-hero-room-media__image/);
    expect(heroCss).toMatch(/furni-hero-product-media__asset/);
    expect(heroCss).toMatch(/furni-hero-hotspot/);
    expect(heroCss).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
    expect(heroCss).toMatch(/hero-room-enter-reduced/);
    expect(heroCss).toMatch(/hero-room-leave-reduced/);
    expect(heroCss).toMatch(/transition: none/);
    const heroSource = readFileSync(path.join(process.cwd(), 'components/evironn/home/hero.tsx'), 'utf8');
    const productMediaSource = readFileSync(
      path.join(process.cwd(), 'components/evironn/home/hero-product-media.tsx'),
      'utf8',
    );
    const roomMediaSource = readFileSync(
      path.join(process.cwd(), 'components/evironn/home/hero-room-media.tsx'),
      'utf8',
    );
    expect(heroSource).toMatch(/addEventListener\('resize'/);
    expect(heroSource).toMatch(/removeEventListener\('resize'/);
    expect(heroSource).toMatch(/addEventListener\('change'/);
    expect(heroSource).toMatch(/removeEventListener\('change'/);
    expect(productMediaSource).toMatch(/readyState >= HTMLMediaElement\.HAVE_CURRENT_DATA/);
    expect(productMediaSource).toMatch(/loadeddata/);
    expect(productMediaSource).toMatch(/video\.play\(\)/);
    expect(roomMediaSource).toMatch(/onAnimationEnd/);
    expect(roomMediaSource).toMatch(/onError/);
  });
});
