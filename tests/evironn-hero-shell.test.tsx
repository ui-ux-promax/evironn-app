/** @vitest-environment jsdom */

import { StrictMode } from 'react';
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

let motionPreference = { matches: false, listener: null as (() => void) | null };

function createMatchMedia(matches: boolean) {
  motionPreference = { matches, listener: null };
  return (query: string) => ({
    get matches() {
      return query === '(prefers-reduced-motion: reduce)' ? motionPreference.matches : false;
    },
    media: query,
    addEventListener: vi.fn((_event: string, listener: () => void) => {
      if (query === '(prefers-reduced-motion: reduce)') motionPreference.listener = listener;
    }),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    onchange: null,
    dispatchEvent: vi.fn(() => {
      motionPreference.listener?.();
      return true;
    }),
  });
}

function setMotionPreference(matches: boolean) {
  motionPreference.matches = matches;
  motionPreference.listener?.();
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
import { HeroProductMedia } from '@/components/evironn/home/hero-product-media';
import { HeroRoomMedia } from '@/components/evironn/home/hero-room-media';
import { INITIAL_HERO_ROOM_STATE } from '@/components/evironn/home/hero-room-state';

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

function fireHeroAnimationEnd(image: HTMLImageElement, animationName = 'hero-room-enter') {
  const start = new Event('animationstart', { bubbles: true });
  Object.defineProperty(start, 'animationName', { value: animationName });
  fireEvent(image, start);
  const event = new Event('animationend', { bubbles: true });
  Object.defineProperty(event, 'animationName', { value: animationName });
  fireEvent(image, event);
}

function fireHeroAnimationStart(image: HTMLImageElement, animationName = 'hero-room-enter') {
  const event = new Event('animationstart', { bubbles: true });
  Object.defineProperty(event, 'animationName', { value: animationName });
  fireEvent(image, event);
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

  it('keeps living preparation usable across StrictMode effect remounts', async () => {
    render(
      <StrictMode>
        <Hero />
      </StrictMode>,
    );

    await waitForLivingBundle();
    expect(screen.getByRole('button', { name: 'КУХНЯ' })).toBeEnabled();
  });

  it('upgrades the active room after reduced motion is disabled at runtime', async () => {
    vi.stubGlobal('matchMedia', createMatchMedia(true));
    render(<Hero />);
    await waitForLivingBundle();
    expect(document.querySelectorAll('#evironn-hero video')).toHaveLength(0);

    setMotionPreference(false);
    await waitFor(() => expect(document.querySelectorAll('#evironn-hero video')).toHaveLength(4));
    expect(screen.getByRole('region')).toHaveAttribute('aria-busy', 'false');
  });

  it('finishes forward and reverse actions through static media when motion is enabled at runtime', async () => {
    render(<Hero />);
    await waitForLivingBundle();
    const videos = [...document.querySelectorAll<HTMLVideoElement>('#evironn-hero video')];
    const sofaForward = videos.find(
      (video) => video.dataset.heroDirection === 'forward' && video.className.includes('is-product-sofa'),
    )!;
    fireEvent.click(screen.getByRole('button', { name: /Диван Linden/ }));
    firePlaying(sofaForward);
    setMotionPreference(true);
    await waitFor(() => expect(screen.getByRole('button', { name: /Назад/ })).toBeInTheDocument());

    setMotionPreference(false);
    await waitFor(() => expect(document.querySelectorAll('#evironn-hero video')).toHaveLength(4));
    const sofaReverse = [...document.querySelectorAll<HTMLVideoElement>('#evironn-hero video')].find(
      (video) => video.dataset.heroDirection === 'reverse' && video.className.includes('is-product-sofa'),
    )!;
    fireEvent.click(screen.getByRole('button', { name: /Назад/ }));
    firePlaying(sofaReverse);
    setMotionPreference(true);
    await waitFor(() => expect(screen.queryByRole('button', { name: /Назад/ })).not.toBeInTheDocument());
    expect(screen.getByRole('region')).toHaveAttribute('aria-busy', 'false');
  });

  it('repairs a detached media binding from the retained Blob without refetching', async () => {
    render(<Hero />);
    await waitForLivingBundle();
    const sofaForward = [...document.querySelectorAll<HTMLVideoElement>('#evironn-hero video')].find(
      (video) => video.dataset.heroDirection === 'forward' && video.className.includes('is-product-sofa'),
    )!;
    const fetchCount = fetchMock.mock.calls.length;
    const urlCount = objectUrlMock.mock.calls.length;
    sofaForward.removeAttribute('src');
    sofaForward.remove();

    fireEvent.click(screen.getByRole('button', { name: /Диван Linden/ }));
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    await waitForLivingBundle();

    expect(fetchMock).toHaveBeenCalledTimes(fetchCount);
    expect(objectUrlMock).toHaveBeenCalledTimes(urlCount);
    expect(sofaForward.getAttribute('src')).toMatch(/^blob:/);
    expect(sofaForward.parentElement).toHaveClass('furni-hero-product-media');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('preserves a healthy poster when retrying a focus-image failure', async () => {
    const decodeMock = HTMLImageElement.prototype.decode as ReturnType<typeof vi.fn>;
    let focusFailure = true;
    decodeMock.mockImplementation(async function (this: HTMLImageElement) {
      if (focusFailure && this.src.includes('-focus.')) {
        focusFailure = false;
        throw new Error('focus unavailable');
      }
    });
    render(<Hero />);
    const poster = document.querySelector('[data-hero-room="living-room"]');
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    await waitForLivingBundle();
    expect(document.querySelector('[data-hero-room="living-room"]')).toBe(poster);
  });

  it('releases retained media on actual unmount', async () => {
    const { unmount } = render(<Hero />);
    await waitForLivingBundle();
    unmount();
    expect(revokeObjectUrlMock).toHaveBeenCalledTimes(4);
  });

  it('does not steal focus from a page control during room transition completion', async () => {
    const { getByRole } = render(
      <>
        <button type="button">Шапка</button>
        <Hero />
      </>,
    );
    await waitForLivingBundle();
    const header = getByRole('button', { name: 'Шапка' });
    const kitchen = screen.getByRole('button', { name: 'КУХНЯ' });
    kitchen.focus();
    fireEvent.click(kitchen);
    header.focus();
    await waitFor(() => expect(screen.getByRole('region')).toHaveAttribute('aria-busy', 'false'));
    const kitchenImage = document.querySelector<HTMLImageElement>('[data-hero-room="kitchen"]')!;
    await waitFor(() => expect(document.querySelector('.furni-hero-stack--kitchen')).toBeInTheDocument());
    fireHeroAnimationEnd(kitchenImage, 'hero-stack-content-in');
    expect(kitchen).toBeDisabled();
    fireHeroAnimationEnd(kitchenImage);
    await waitFor(() => expect(kitchen).toBeEnabled());
    expect(header).toHaveFocus();
  });

  it('ignores a same-name animation end from the previous room operation', async () => {
    const onTransitionComplete = vi.fn();
    const state = {
      ...INITIAL_HERO_ROOM_STATE,
      targetRoom: 'kitchen' as const,
      phase: 'changing' as const,
      operationId: 1,
    };
    const { rerender } = render(
      <HeroRoomMedia
        state={state}
        reducedMotion={false}
        requestedRooms={['living-room', 'kitchen']}
        posterVersions={{}}
        onPosterElement={vi.fn()}
        onTransitionComplete={onTransitionComplete}
        onTransitionFailure={vi.fn()}
      />,
    );
    const kitchenImage = document.querySelector<HTMLImageElement>('[data-hero-room="kitchen"]')!;
    fireHeroAnimationStart(kitchenImage);
    rerender(
      <HeroRoomMedia
        state={{ ...state, operationId: 2 }}
        reducedMotion={false}
        requestedRooms={['living-room', 'kitchen']}
        posterVersions={{}}
        onPosterElement={vi.fn()}
        onTransitionComplete={onTransitionComplete}
        onTransitionFailure={vi.fn()}
      />,
    );
    const staleEnd = new Event('animationend', { bubbles: true });
    Object.defineProperty(staleEnd, 'animationName', { value: 'hero-room-enter' });
    fireEvent(kitchenImage, staleEnd);
    expect(onTransitionComplete).not.toHaveBeenCalled();
    fireHeroAnimationEnd(kitchenImage);
    expect(onTransitionComplete).toHaveBeenCalledWith(2);
  });

  it('recovers when an entering playback entry is unavailable before play', async () => {
    const onPlaybackUnavailable = vi.fn();
    const cache = {
      get: vi.fn().mockReturnValue(null),
      getUnreadyVideo: vi.fn().mockReturnValue(null),
      setHost: vi.fn(),
    } as unknown as Parameters<typeof HeroProductMedia>[0]['cache'];

    render(
      <HeroProductMedia
        cache={cache}
        room="living-room"
        roomOperationId={0}
        playbackGeneration={1}
        phase="entering-sofa"
        reducedMotion={false}
        onProgress={vi.fn()}
        onForwardComplete={vi.fn()}
        onReverseComplete={vi.fn()}
        onPlaybackUnavailable={onPlaybackUnavailable}
      />,
    );

    await waitFor(() => expect(onPlaybackUnavailable).toHaveBeenCalledTimes(1));
    expect(onPlaybackUnavailable).toHaveBeenCalledWith(
      expect.objectContaining({
        failedPhase: 'entering-sofa',
        stage: 'playback-entry',
      }),
    );
  });

  it('reports the selected entry when playback rejects', async () => {
    const onPlaybackUnavailable = vi.fn();
    const video = document.createElement('video');
    const prepared = {
      entry: { productId: 'sofa' as const, direction: 'forward' as const },
      format: 'mp4' as const,
      blob: new Blob(['hero-video']),
      objectUrl: 'blob:selected-sofa-forward',
      element: video,
      mediaReady: true,
    };
    const bundle = {
      room: 'living-room' as const,
      mode: 'animated' as const,
      poster: document.createElement('img'),
      focus: new Map(),
      videos: new Map([['sofa:forward', prepared]]),
    };
    Object.defineProperties(video, {
      readyState: { configurable: true, value: 2 },
      duration: { configurable: true, value: 6 },
    });
    video.setAttribute('src', prepared.objectUrl);
    const cache = {
      get: vi.fn().mockReturnValue(bundle),
      getUnreadyVideo: vi.fn().mockReturnValue(null),
      setHost: vi.fn(),
    } as unknown as Parameters<typeof HeroProductMedia>[0]['cache'];
    playMock.mockRejectedValueOnce(new Error('play rejected'));

    render(
      <HeroProductMedia
        cache={cache}
        room="living-room"
        roomOperationId={4}
        playbackGeneration={7}
        phase="entering-sofa"
        reducedMotion={false}
        onProgress={vi.fn()}
        onForwardComplete={vi.fn()}
        onReverseComplete={vi.fn()}
        onPlaybackUnavailable={onPlaybackUnavailable}
      />,
    );

    await waitFor(() => expect(onPlaybackUnavailable).toHaveBeenCalledTimes(1));
    expect(onPlaybackUnavailable).toHaveBeenCalledWith(
      expect.objectContaining({
        entry: { productId: 'sofa', direction: 'forward' },
        stage: 'playback-entry',
      }),
    );
  });

  it('retries a failed kitchen request while preserving the active living room', async () => {
    let failKitchen = true;
    fetchMock.mockImplementation(async (input) => {
      if (failKitchen && String(input).includes('/assets/hero/kitchen-dining-forward')) {
        failKitchen = false;
        throw new Error('kitchen unavailable');
      }
      return new Response(new Blob(['hero-video']));
    });

    render(<Hero />);
    await waitForLivingBundle();
    const sofaForward = [...document.querySelectorAll<HTMLVideoElement>('#evironn-hero video')].find(
      (video) => video.dataset.heroDirection === 'forward' && video.className.includes('is-product-sofa'),
    )!;
    fireEvent.click(screen.getByRole('button', { name: /Диван Linden/ }));
    firePlaying(sofaForward);
    fireEnded(sofaForward);
    await waitFor(() => expect(screen.getByRole('button', { name: /Назад/ })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'КУХНЯ' }));
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    await waitFor(() => expect(screen.getByRole('region')).toHaveAttribute('aria-busy', 'false'));
    const kitchenImage = document.querySelector<HTMLImageElement>('[data-hero-room="kitchen"]')!;
    await waitFor(() => expect(document.querySelector('.furni-hero-stack--kitchen')).toBeInTheDocument());
    fireHeroAnimationEnd(kitchenImage);
    await waitFor(() => expect(screen.getByRole('button', { name: 'КУХНЯ' })).toBeEnabled());
    expect(screen.queryByRole('button', { name: /Назад/ })).not.toBeInTheDocument();
    expect(document.querySelector('.furni-hero-hotspot-kitchen-dining')).not.toHaveClass('is-hidden');
  });

  it('dismisses a failed kitchen request without disturbing the focused living product', async () => {
    let failKitchen = true;
    fetchMock.mockImplementation(async (input) => {
      if (failKitchen && String(input).includes('/assets/hero/kitchen-dining-forward')) {
        failKitchen = false;
        throw new Error('kitchen unavailable');
      }
      return new Response(new Blob(['hero-video']));
    });
    render(<Hero />);
    await waitForLivingBundle();
    const sofaForward = [...document.querySelectorAll<HTMLVideoElement>('#evironn-hero video')].find(
      (video) => video.dataset.heroDirection === 'forward' && video.className.includes('is-product-sofa'),
    )!;
    fireEvent.click(screen.getByRole('button', { name: /Диван Linden/ }));
    firePlaying(sofaForward);
    fireEnded(sofaForward);
    await waitFor(() => expect(screen.getByRole('button', { name: /Назад/ })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'КУХНЯ' }));
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /Назад/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'ГОСТИНАЯ' }));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: /Назад/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'СМОТРЕТЬ КОЛЛЕКЦИЮ' })).toHaveAttribute('href', '/catalog?room=living');
    expect(document.querySelector('.furni-hero-stack--kitchen')).toBeNull();
  });

  it('clears the preserved living product when an uncached kitchen becomes ready', async () => {
    render(<Hero />);
    await waitForLivingBundle();
    const sofaForward = [...document.querySelectorAll<HTMLVideoElement>('#evironn-hero video')].find(
      (video) => video.dataset.heroDirection === 'forward' && video.className.includes('is-product-sofa'),
    )!;
    fireEvent.click(screen.getByRole('button', { name: /Диван Linden/ }));
    firePlaying(sofaForward);
    fireEnded(sofaForward);
    await waitFor(() => expect(screen.getByRole('button', { name: /Назад/ })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'КУХНЯ' }));
    await waitFor(() => expect(screen.getByRole('region')).toHaveAttribute('aria-busy', 'false'));
    const kitchenImage = document.querySelector<HTMLImageElement>('[data-hero-room="kitchen"]')!;
    fireHeroAnimationEnd(kitchenImage);
    await waitFor(() => expect(document.querySelector('.furni-hero-stack--kitchen')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /Назад/ })).not.toBeInTheDocument();
  });

  it('restores the retained focus image after reverse playback failure', async () => {
    render(<Hero />);
    await waitForLivingBundle();
    const videos = [...document.querySelectorAll<HTMLVideoElement>('#evironn-hero video')];
    const sofaForward = videos.find(
      (video) => video.dataset.heroDirection === 'forward' && video.className.includes('is-product-sofa'),
    )!;
    const sofaReverse = videos.find(
      (video) => video.dataset.heroDirection === 'reverse' && video.className.includes('is-product-sofa'),
    )!;
    const sofaFocus = document.querySelector<HTMLImageElement>('img.furni-hero-product-media__asset.is-product-sofa')!;

    fireEvent.click(screen.getByRole('button', { name: /Диван Linden/ }));
    firePlaying(sofaForward);
    fireEnded(sofaForward);
    await waitFor(() => expect(screen.getByRole('button', { name: /Назад/ })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Назад/ }));
    firePlaying(sofaReverse);
    expect(sofaFocus).not.toHaveClass('is-visible');
    fireEvent.error(sofaReverse);

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(sofaFocus).toHaveClass('is-visible');
  });

  it('repairs only the failed direction during activation preflight', async () => {
    render(<Hero />);
    await waitForLivingBundle();
    const videos = [...document.querySelectorAll<HTMLVideoElement>('#evironn-hero video')];
    const chairReverse = videos.find(
      (video) => video.dataset.heroDirection === 'reverse' && video.className.includes('is-product-chair'),
    )!;
    const sofaForward = videos.find(
      (video) => video.dataset.heroDirection === 'forward' && video.className.includes('is-product-sofa'),
    )!;
    const sofaSource = sofaForward.getAttribute('src');
    chairReverse.removeAttribute('src');

    fireEvent.click(screen.getByRole('button', { name: /Диван Linden/ }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(sofaForward).toHaveAttribute('src', sofaSource);
  });

  it('restores focus to the initiating room control after preparation', async () => {
    let releaseFirstKitchenFetch!: () => void;
    let held = true;
    fetchMock.mockImplementation(async (input) => {
      if (held && String(input).includes('/assets/hero/kitchen-dining-forward')) {
        await new Promise<void>((resolve) => {
          releaseFirstKitchenFetch = resolve;
        });
        held = false;
      }
      return new Response(new Blob(['hero-video']));
    });

    render(<Hero />);
    await waitForLivingBundle();
    const kitchen = screen.getByRole('button', { name: 'КУХНЯ' });
    kitchen.focus();
    fireEvent.click(kitchen);
    await waitFor(() => expect(screen.getByRole('status')).toHaveFocus());
    await waitFor(() => expect(releaseFirstKitchenFetch).toEqual(expect.any(Function)));
    releaseFirstKitchenFetch();
    await waitFor(() => expect(screen.getByRole('region')).toHaveAttribute('aria-busy', 'false'));
    const kitchenImage = document.querySelector<HTMLImageElement>('[data-hero-room="kitchen"]')!;
    await waitFor(() => expect(document.querySelector('.furni-hero-stack--kitchen')).toBeInTheDocument());
    fireHeroAnimationEnd(kitchenImage);
    await waitFor(() => expect(screen.getByRole('button', { name: 'КУХНЯ' })).toBeEnabled());
    expect(kitchen).toHaveFocus();
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
    fireHeroAnimationEnd(kitchenImage);
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

  describe('retained-Blob component regressions', () => {
    it('replays after empty buffered ranges without refetch', async () => {
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
      expect(fetchMock).toHaveBeenCalledTimes(fetchCount);
      expect(objectUrlMock).toHaveBeenCalledTimes(urlCount);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('repairs a lost media element from the retained Blob', async () => {
      render(<Hero />);
      await waitForLivingBundle();
      const sofaForward = [...document.querySelectorAll<HTMLVideoElement>('#evironn-hero video')].find(
        (video) => video.dataset.heroDirection === 'forward' && video.className.includes('is-product-sofa'),
      )!;
      const fetchCount = fetchMock.mock.calls.length;
      const urlCount = objectUrlMock.mock.calls.length;
      sofaForward.removeAttribute('src');
      sofaForward.remove();
      fireEvent.click(screen.getByRole('button', { name: /Диван Linden/ }));
      await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Повторить' }));
      await waitForLivingBundle();
      expect(fetchMock).toHaveBeenCalledTimes(fetchCount);
      expect(objectUrlMock).toHaveBeenCalledTimes(urlCount);
      expect(sofaForward.parentElement).toHaveClass('furni-hero-product-media');
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('recovers missing retained media before forward activation', async () => {
      render(<Hero />);
      await waitForLivingBundle();
      const sofaForward = [...document.querySelectorAll<HTMLVideoElement>('#evironn-hero video')].find(
        (video) => video.dataset.heroDirection === 'forward' && video.className.includes('is-product-sofa'),
      )!;
      const fetchCount = fetchMock.mock.calls.length;
      const urlCount = objectUrlMock.mock.calls.length;
      sofaForward.removeAttribute('src');
      fireEvent.click(screen.getByRole('button', { name: /Диван Linden/ }));
      await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
      expect(screen.queryByRole('button', { name: /Назад/ })).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Повторить' }));
      await waitForLivingBundle();
      expect(fetchMock).toHaveBeenCalledTimes(fetchCount);
      expect(objectUrlMock).toHaveBeenCalledTimes(urlCount);
      fireEvent.click(screen.getByRole('button', { name: /Диван Linden/ }));
      expect(playMock).toHaveBeenCalled();
    });

    it('recovers missing retained media before back activation', async () => {
      render(<Hero />);
      await waitForLivingBundle();
      const videos = [...document.querySelectorAll<HTMLVideoElement>('#evironn-hero video')];
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
      const fetchCount = fetchMock.mock.calls.length;
      const urlCount = objectUrlMock.mock.calls.length;
      sofaReverse.removeAttribute('src');
      fireEvent.click(screen.getByRole('button', { name: /Назад/ }));
      await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Повторить' }));
      await waitForLivingBundle();
      expect(fetchMock).toHaveBeenCalledTimes(fetchCount);
      expect(objectUrlMock).toHaveBeenCalledTimes(urlCount);
      fireEvent.click(screen.getByRole('button', { name: /Назад/ }));
      expect(playMock).toHaveBeenCalled();
    });
  });
});
