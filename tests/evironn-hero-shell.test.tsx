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

vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => undefined);

import { Hero } from '@/components/evironn/home/hero';

afterEach(() => cleanup());

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
    expect(within(hero).getByRole('button', { name: 'СМОТРЕТЬ КОЛЛЕКЦИЮ' })).toBeInTheDocument();
    expect(within(hero).getByRole('button', { name: 'ПОСМОТРЕТЬ ИСТОРИЮ' })).toBeInTheDocument();
    expect(within(hero).getByRole('button', { name: /Диван Linden/ })).toBeEnabled();
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
