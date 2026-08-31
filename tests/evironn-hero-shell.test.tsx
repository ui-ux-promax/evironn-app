/** @vitest-environment jsdom */

import { readFileSync } from 'node:fs';
import path from 'node:path';

import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('framer-motion', () => {
  const stripMotionProps = ({ animate, exit, initial, variants, ...props }: Record<string, unknown>) => props;
  const createMotionElement = (tag: keyof HTMLElementTagNameMap) => (props: Record<string, unknown>) => {
    const Component = tag as keyof React.JSX.IntrinsicElements;
    return <Component {...stripMotionProps(props)} />;
  };

  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
      aside: createMotionElement('aside'),
      button: createMotionElement('button'),
      create: (Component: React.ElementType) => (props: Record<string, unknown>) => {
        const { children, ...rest } = stripMotionProps(props);
        return <Component {...rest}>{children}</Component>;
      },
      div: createMotionElement('div'),
      span: createMotionElement('span'),
    },
    useReducedMotion: () => false,
  };
});

vi.mock('next/link', () => ({
  default: ({ children, ...props }: React.ComponentProps<'a'>) => <a {...props}>{children}</a>,
}));

function createMatchMedia(matches: boolean) {
  return (query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    onchange: null,
    dispatchEvent: vi.fn(),
  });
}

vi.stubGlobal('matchMedia', createMatchMedia(false));

const playMock = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => undefined);

import { Hero } from '@/components/evironn/home/hero';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.stubGlobal('matchMedia', createMatchMedia(false));
});

const heroCss = readFileSync(path.join(process.cwd(), 'styles/evironn/home/hero.css'), 'utf8');

describe('Evironn interactive hero shell', () => {
  it('keeps initial hero poster-first with no product transition sources or focus replacements', () => {
    render(<Hero />);

    const hero = screen.getByRole('region', { name: 'Мебель с душой, созданная поколениями' });
    const productVideos = [...hero.querySelectorAll<HTMLVideoElement>('video')];
    const productFocusImages = [...hero.querySelectorAll<HTMLImageElement>('img')].filter((image) =>
      image.className.includes('furni-hero-product-media__asset'),
    );
    const heroMarkup = hero.innerHTML;

    expect(productVideos).toHaveLength(0);
    expect(productVideos.some((video) => video.getAttribute('src'))).toBe(false);
    expect(productFocusImages).toHaveLength(0);
    expect(heroMarkup).not.toContain('/assets/hero/sofa-forward.mp4');
    expect(heroMarkup).not.toContain('/assets/hero/sofa-reverse.mp4');
    const livingRoomImage = hero.querySelector<HTMLImageElement>('.furni-hero-room-media__image.is-living-room');
    expect(livingRoomImage).toHaveClass('is-stable');
    expect(livingRoomImage).toHaveAttribute('loading', 'eager');
    expect(livingRoomImage).toHaveAttribute('fetchpriority', 'high');
    expect(livingRoomImage).toHaveAttribute('width', '1536');
    expect(livingRoomImage).toHaveAttribute('height', '1024');
    expect(livingRoomImage).toHaveAttribute('sizes', '100vw');
    expect(livingRoomImage).toHaveAttribute('data-nimg', '1');
    expect(livingRoomImage?.getAttribute('src')).toContain('%2Fassets%2Fhero%2Fliving-room-idle-5f0f1836.webp');
    expect(livingRoomImage?.getAttribute('src')).toContain('q=90');
    expect(livingRoomImage?.getAttribute('srcset')).toContain('_next/image');
    expect(livingRoomImage?.getAttribute('srcset')).toContain('%2Fassets%2Fhero%2Fliving-room-idle-5f0f1836.webp');
    expect(livingRoomImage?.getAttribute('srcset')).toContain('q=90');
    expect(hero.querySelector('img[src="/assets/hero/kitchen-idle.jpg"]')).toHaveAttribute('loading', 'lazy');
    expect(hero.querySelector('img[src="/assets/hero/kitchen-idle.jpg"]')).toHaveAttribute('fetchpriority', 'auto');
  });

  it('connects only selected forward video and releases it when transition ends', () => {
    render(<Hero />);

    fireEvent.click(screen.getByRole('button', { name: /Диван Linden/ }));

    const videos = [...document.querySelectorAll<HTMLVideoElement>('#evironn-hero video')];
    expect(videos).toHaveLength(1);
    expect(videos[0]).toHaveAttribute('src', '/assets/hero/sofa-forward.mp4');
    expect(videos[0]).not.toHaveClass('is-visible');
    const focusImage = document.querySelector<HTMLImageElement>('img[src="/assets/hero/sofa-focus.webp"]');
    expect(focusImage).toBeInTheDocument();
    expect(focusImage).not.toHaveClass('is-visible');
    expect(
      videos.filter((video) => video.getAttribute('src')?.includes('/assets/hero/')).map((video) => video.src),
    ).toEqual(['http://localhost:3000/assets/hero/sofa-forward.mp4']);

    fireEvent.loadedData(videos[0]);
    expect(videos[0]).toHaveClass('is-visible');
    fireEvent.ended(videos[0]);

    expect(document.querySelectorAll<HTMLVideoElement>('#evironn-hero video')).toHaveLength(0);
    expect(document.querySelector('img[src="/assets/hero/sofa-focus.webp"]')).toHaveClass('is-visible');
  });

  it('loads reverse video only on return and keeps unrelated product sources absent', () => {
    render(<Hero />);

    fireEvent.click(screen.getByRole('button', { name: /Диван Linden/ }));
    const forward = document.querySelector<HTMLVideoElement>('#evironn-hero video');
    expect(forward).not.toBeNull();
    fireEvent.loadedData(forward!);
    fireEvent.ended(forward!);

    fireEvent.click(screen.getByRole('button', { name: /Назад/ }));

    const reverseVideos = [...document.querySelectorAll<HTMLVideoElement>('#evironn-hero video')];
    expect(reverseVideos).toHaveLength(1);
    expect(reverseVideos[0]).toHaveAttribute('src', '/assets/hero/sofa-reverse.mp4');
    expect(reverseVideos[0]).not.toHaveAttribute('src', '/assets/hero/chair-reverse.mp4');
    expect(reverseVideos[0]).not.toHaveClass('is-visible');
    expect(document.querySelector('img[src="/assets/hero/sofa-focus.webp"]')).toHaveClass('is-visible');

    fireEvent.loadedData(reverseVideos[0]);
    expect(reverseVideos[0]).toHaveClass('is-visible');
    expect(document.querySelector('img[src="/assets/hero/sofa-focus.webp"]')).not.toHaveClass('is-visible');
    fireEvent.ended(reverseVideos[0]);
    expect(document.querySelectorAll<HTMLVideoElement>('#evironn-hero video')).toHaveLength(0);
  });

  it('does not connect transition video when reduced motion is preferred', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    }));

    render(<Hero />);
    fireEvent.click(screen.getByRole('button', { name: /Диван Linden/ }));

    expect(document.querySelectorAll<HTMLVideoElement>('#evironn-hero video')).toHaveLength(0);
    const backButton = await screen.findByRole('button', { name: /Назад/ });
    expect(backButton).toBeInTheDocument();
    fireEvent.click(backButton);
    await waitFor(() => expect(screen.queryByRole('button', { name: /Назад/ })).not.toBeInTheDocument());
    const sofaHotspot = screen.getByRole('button', { name: /Диван Linden/ });
    expect(sofaHotspot).toBeEnabled();
    expect(sofaHotspot).not.toHaveClass('is-hidden');
  });

  it('ignores stale progress events after an active transition is released', () => {
    render(<Hero />);
    fireEvent.click(screen.getByRole('button', { name: /Диван Linden/ }));
    const video = document.querySelector<HTMLVideoElement>('#evironn-hero video');
    expect(video).not.toBeNull();
    fireEvent.error(video!);
    Object.defineProperty(video, 'currentTime', { configurable: true, value: 5 });
    Object.defineProperty(video, 'duration', { configurable: true, value: 6 });
    fireEvent.timeUpdate(video!);

    expect(screen.queryByRole('button', { name: /Назад/ })).not.toBeInTheDocument();
    expect(document.querySelector('#evironn-hero video')).toBeNull();
  });

  it('releases an active source when a room change cancels product transition', () => {
    render(<Hero />);
    fireEvent.click(screen.getByRole('button', { name: /Диван Linden/ }));
    expect(document.querySelector('#evironn-hero video')).toHaveAttribute('src', '/assets/hero/sofa-forward.mp4');

    const kitchen = screen.getByRole('button', { name: 'КУХНЯ' });
    fireEvent.load(document.querySelector('img[src="/assets/hero/kitchen-idle.jpg"]')!);
    fireEvent.click(kitchen);

    expect(document.querySelector('#evironn-hero video')).toBeNull();
  });

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
    expect(livingImages.some((image) => image.classList.contains('is-living-room'))).toBe(true);
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
    expect(document.querySelector('.furni-hero-room-media__image.is-living-room')).toHaveClass('is-stable');

    fireEvent.click(screen.getByRole('button', { name: /Диван Linden/ }));
    const video = document.querySelector<HTMLVideoElement>('video[src="/assets/hero/sofa-forward.mp4"]');
    fireEvent.error(video!);
    expect(screen.queryByRole('button', { name: /Назад/ })).not.toBeInTheDocument();
    expect(document.querySelector('.furni-hero-room-media__image.is-living-room')).toHaveClass('is-stable');
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
