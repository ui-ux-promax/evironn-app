/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('framer-motion', () => {
  const stripMotionProps = (props: Record<string, unknown>) => {
    const rest = { ...props };
    delete rest.animate;
    delete rest.exit;
    delete rest.initial;
    delete rest.variants;
    return rest;
  };
  const createMotionElement = (tag: keyof HTMLElementTagNameMap) => {
    const MotionElement = (props: Record<string, unknown>) => {
      const Component = tag as keyof React.JSX.IntrinsicElements;
      return <Component {...stripMotionProps(props)} />;
    };
    return MotionElement;
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
    matches: query === '(prefers-reduced-motion: reduce)' ? matches : false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    onchange: null,
    dispatchEvent: vi.fn(),
  });
}

const playMock = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
const pauseMock = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
const loadMock = vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(function (this: HTMLMediaElement) {
  this.dispatchEvent(new Event('loadedmetadata'));
  this.dispatchEvent(new Event('loadeddata'));
});
const canPlayTypeMock = vi.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockReturnValue('');
const fetchMock = vi.spyOn(globalThis, 'fetch');
const objectUrlMock = vi.fn((blob: Blob) => `blob:hero-${blob.size}-${Math.random()}`);
const revokeObjectUrlMock = vi.fn();

Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: objectUrlMock });
Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectUrlMock });
Object.defineProperty(HTMLImageElement.prototype, 'complete', { configurable: true, get: () => true });
Object.defineProperty(HTMLImageElement.prototype, 'naturalWidth', { configurable: true, get: () => 1920 });
Object.defineProperty(HTMLImageElement.prototype, 'naturalHeight', { configurable: true, get: () => 1080 });
Object.defineProperty(HTMLVideoElement.prototype, 'readyState', { configurable: true, get: () => 2 });
Object.defineProperty(HTMLVideoElement.prototype, 'duration', { configurable: true, get: () => 6 });
HTMLImageElement.prototype.decode = vi.fn().mockResolvedValue(undefined);

import { Hero } from '@/components/evironn/home/hero';

beforeEach(() => {
  vi.stubGlobal('matchMedia', createMatchMedia(false));
  fetchMock.mockImplementation(async () => new Response(new Blob(['hero-video'])));
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  canPlayTypeMock.mockReturnValue('');
  playMock.mockResolvedValue(undefined);
  fetchMock.mockImplementation(async () => new Response(new Blob(['hero-video'])));
  vi.stubGlobal('matchMedia', createMatchMedia(false));
});

async function waitForLivingBundle() {
  await waitFor(() => {
    expect(screen.getByRole('region', { name: 'Мебель с душой, созданная поколениями' })).toHaveAttribute(
      'aria-busy',
      'false',
    );
    expect(screen.getByRole('button', { name: /Диван Linden/ })).toBeEnabled();
  });
}

function firePlaying(video: HTMLVideoElement) {
  fireEvent(video, new Event('playing'));
}

function fireEnded(video: HTMLVideoElement) {
  fireEvent.ended(video);
}

describe('Evironn interactive hero shell', () => {
  it('does not mount unrequested room posters', () => {
    render(<Hero />);
    const hero = document.querySelector('#evironn-hero')!;
    expect(hero.querySelectorAll('.furni-hero-room-media__image')).toHaveLength(1);
    expect(hero.querySelector('img[src="/assets/hero/kitchen-idle.webp"]')).toBeNull();
    expect(screen.getByRole('button', { name: 'СПАЛЬНЯ' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'ТЕРРАСА' })).toBeDisabled();
  });

  it('prepares living poster, focus images, and four retained directional videos before enabling controls', async () => {
    render(<Hero />);
    expect(screen.getByRole('status', { name: 'Загрузка комнаты…' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'КУХНЯ' })).toBeDisabled();
    expect(fetchMock).not.toHaveBeenCalled();

    await waitForLivingBundle();

    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(objectUrlMock).toHaveBeenCalledTimes(4);
    expect(document.querySelectorAll<HTMLVideoElement>('#evironn-hero video')).toHaveLength(4);
    expect(screen.getByRole('button', { name: 'КУХНЯ' })).toBeEnabled();
  });

  it('keeps room controls inert while preparing and exposes exact retry UI on failure', async () => {
    fetchMock.mockRejectedValueOnce(new Error('video unavailable'));
    render(<Hero />);

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveTextContent('Не удалось загрузить комнату. Повторить загрузку?');
    expect(screen.getByRole('button', { name: 'Повторить' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Мебель с душой, созданная поколениями' })).toHaveAttribute(
      'aria-busy',
      'false',
    );
    expect(screen.getByRole('button', { name: /Диван Linden/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'КУХНЯ' })).toBeEnabled();
  });

  it('retains Blob-backed nodes across repeated forward and reverse playback', async () => {
    render(<Hero />);
    await waitForLivingBundle();
    const videos = [...document.querySelectorAll<HTMLVideoElement>('#evironn-hero video')];
    const fetchCount = fetchMock.mock.calls.length;
    const urlCount = objectUrlMock.mock.calls.length;
    const sofaForward = videos.find(
      (video) => video.dataset.heroDirection === 'forward' && video.className.includes('is-product-sofa'),
    )!;
    const sofaReverse = videos.find(
      (video) => video.dataset.heroDirection === 'reverse' && video.className.includes('is-product-sofa'),
    )!;

    fireEvent.click(screen.getByRole('button', { name: /Диван Linden/ }));
    firePlaying(sofaForward);
    fireEnded(sofaForward);
    await waitFor(() => expect(screen.getByRole('button', { name: /Назад/ })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Назад/ }));
    firePlaying(sofaReverse);
    fireEnded(sofaReverse);
    await waitFor(() => expect(screen.queryByRole('button', { name: /Назад/ })).not.toBeInTheDocument());

    expect(fetchMock).toHaveBeenCalledTimes(fetchCount);
    expect(objectUrlMock).toHaveBeenCalledTimes(urlCount);
    expect(loadMock).toHaveBeenCalledTimes(4);
    expect(pauseMock).toHaveBeenCalled();
  });

  it('does not treat empty buffered ranges as cache loss', async () => {
    render(<Hero />);
    await waitForLivingBundle();
    const sofaForward = [...document.querySelectorAll<HTMLVideoElement>('#evironn-hero video')].find(
      (video) => video.dataset.heroDirection === 'forward' && video.className.includes('is-product-sofa'),
    )!;
    Object.defineProperty(sofaForward, 'buffered', { configurable: true, value: { length: 0 } });
    const fetchCount = fetchMock.mock.calls.length;
    const urlCount = objectUrlMock.mock.calls.length;

    fireEvent.click(screen.getByRole('button', { name: /Диван Linden/ }));
    firePlaying(sofaForward);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(fetchCount);
    expect(objectUrlMock).toHaveBeenCalledTimes(urlCount);
  });

  it('recovers rejected playback through explicit retry without automatic replay', async () => {
    render(<Hero />);
    await waitForLivingBundle();
    const sofaForward = [...document.querySelectorAll<HTMLVideoElement>('#evironn-hero video')].find(
      (video) => video.dataset.heroDirection === 'forward' && video.className.includes('is-product-sofa'),
    )!;
    playMock.mockRejectedValueOnce(new Error('play rejected'));
    fireEvent.click(screen.getByRole('button', { name: /Диван Linden/ }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /Назад/ })).not.toBeInTheDocument();
    expect(sofaForward).not.toHaveClass('is-visible');
    const playCount = playMock.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    await waitForLivingBundle();
    expect(playMock.mock.calls.length).toBe(playCount);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('switches to explicitly requested kitchen only after its complete bundle is ready', async () => {
    render(<Hero />);
    await waitForLivingBundle();
    const kitchen = screen.getByRole('button', { name: 'КУХНЯ' });
    fireEvent.click(kitchen);
    expect(screen.getByRole('region', { name: 'Мебель с душой, созданная поколениями' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
    expect(document.querySelector('.furni-hero-stack--kitchen')).toBeNull();
    await waitFor(() =>
      expect(screen.getByRole('region', { name: 'Мебель с душой, созданная поколениями' })).toHaveAttribute(
        'aria-busy',
        'false',
      ),
    );
    const kitchenImage = document.querySelector<HTMLImageElement>('[data-hero-room="kitchen"]')!;
    fireEvent.animationEnd(kitchenImage, { animationName: 'hero-room-enter' });
    await waitFor(() => expect(document.querySelector('.furni-hero-stack--kitchen')).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledTimes(8);
  });

  it('keeps canonical links, disabled bedroom and terrace controls, and scoped recovery CSS', async () => {
    render(<Hero />);
    const hero = screen.getByRole('region', { name: 'Мебель с душой, созданная поколениями' });
    expect(within(hero).getByRole('heading', { name: /Мебель с душой/ })).toBeInTheDocument();
    expect(within(hero).getByRole('link', { name: 'СМОТРЕТЬ КОЛЛЕКЦИЮ' })).toHaveAttribute(
      'href',
      '/catalog?room=living',
    );
    expect(screen.getByRole('button', { name: 'СПАЛЬНЯ' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'ТЕРРАСА' })).toBeDisabled();
    expect(document.querySelector('.furni-hero-preparation-overlay')).toBeInTheDocument();
    await waitForLivingBundle();
  });

  it('selects WebM when VP9 is supported and keeps MP4 fallback contract exported', async () => {
    canPlayTypeMock.mockReturnValue('probably');
    render(<Hero />);
    await waitForLivingBundle();
    expect(fetchMock.mock.calls.map(([input]) => String(input))).toEqual(
      expect.arrayContaining([
        '/assets/hero/chair-forward.webm',
        '/assets/hero/chair-reverse.webm',
        '/assets/hero/sofa-forward.webm',
        '/assets/hero/sofa-reverse.webm',
      ]),
    );
    expect(fetchMock.mock.calls.map(([input]) => String(input)).some((src) => src.endsWith('.mp4'))).toBe(false);
  });
});
