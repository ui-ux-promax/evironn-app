/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, within } from '@testing-library/react';
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

vi.stubGlobal(
  'IntersectionObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => undefined);

import { Hero } from '@/components/evironn/home/hero';
import { InteractiveFurnitureCards } from '@/components/evironn/home/interactive-furniture-cards';
import HomePage from '@/app/(shop)/page';

afterEach(() => cleanup());

describe('homepage video A/B diagnostic', () => {
  it('keeps control video DOM and all initial video sources', () => {
    const { container } = render(
      <>
        <Hero videoMode="control" />
        <InteractiveFurnitureCards videoMode="control" />
      </>,
    );

    expect(container.querySelectorAll('video')).toHaveLength(21);
    expect(new Set([...container.querySelectorAll('video')].map((video) => video.getAttribute('src')))).toHaveLength(
      21,
    );
    expect(container.querySelectorAll('video[preload="auto"]')).toHaveLength(21);
  });

  it('renders poster-only fallback without video DOM while preserving home structure', () => {
    const { container } = render(
      <>
        <Hero videoMode="poster-only" />
        <InteractiveFurnitureCards videoMode="poster-only" />
      </>,
    );

    expect(container.querySelectorAll('video')).toHaveLength(0);
    expect(container.querySelectorAll('[data-video-fallback]')).toHaveLength(13);
    expect(container.querySelectorAll('img[data-video-fallback]')).toHaveLength(13);
    expect(container.querySelectorAll('.furni-hero-room-media__image')).toHaveLength(4);
    expect(container.querySelectorAll('.interactive-furniture__card')).toHaveLength(5);

    const hero = within(container).getByRole('region', { name: 'Мебель с душой, созданная поколениями' });
    expect(within(hero).getByRole('heading', { name: /Мебель с душой/ })).toBeInTheDocument();
    expect(within(hero).getByRole('link', { name: 'СМОТРЕТЬ КОЛЛЕКЦИЮ' })).toHaveAttribute(
      'href',
      '/catalog?room=living',
    );
    expect(within(container).getByRole('heading', { name: 'Уют, продуманный со всех сторон' })).toBeInTheDocument();
  });

  it('selects poster-only mode only for the explicit diagnostic query', async () => {
    const posterPage = await HomePage({ searchParams: Promise.resolve({ 'video-ab': 'poster' }) });
    const posterMain = posterPage.props.children[1];
    expect(posterMain.props.children[0].props.videoMode).toBe('poster-only');

    const controlPage = await HomePage({ searchParams: Promise.resolve({}) });
    const controlMain = controlPage.props.children[1];
    expect(controlMain.props.children[0].props.videoMode ?? 'control').toBe('control');
  });

  it('does not leave poster-only cards active after focus or mobile tap reversal', () => {
    const { container } = render(<InteractiveFurnitureCards videoMode="poster-only" />);
    const cards = [...container.querySelectorAll<HTMLElement>('.interactive-furniture__card')];
    const links = cards.map((card) => card.querySelector('a')!);
    links.forEach((link) => link.addEventListener('click', (event) => event.preventDefault()));

    fireEvent.focus(links[0]);
    expect(cards[0]).toHaveClass('is-active');
    fireEvent.blur(links[0]);
    expect(cards[0]).not.toHaveClass('is-active');

    fireEvent.click(links[0]);
    expect(cards[0]).toHaveClass('is-active');
    fireEvent.click(links[1]);
    expect(cards[0]).not.toHaveClass('is-active');
    expect(cards[1]).toHaveClass('is-active');
  });
});
