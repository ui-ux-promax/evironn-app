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

afterEach(async () => {
  cleanup();
  await new Promise<void>((resolve) => queueMicrotask(resolve));
  vi.useRealTimers();
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

function fireHeroAnimationEnd(image: HTMLImageElement, animationName = 'hero-room-enter', timeStamp = Date.now()) {
  fireHeroAnimationStart(image, animationName, timeStamp - 1);
  const event = new Event('animationend', { bubbles: true });
  Object.defineProperty(event, 'animationName', { value: animationName });
  Object.defineProperty(event, 'timeStamp', { value: timeStamp });
  fireEvent(image, event);
}

function fireHeroAnimationStart(image: HTMLImageElement, animationName = 'hero-room-enter', timeStamp = Date.now()) {
  const event = new Event('animationstart', { bubbles: true });
  Object.defineProperty(event, 'animationName', { value: animationName });
  Object.defineProperty(event, 'timeStamp', { value: timeStamp });
  fireEvent(image, event);
}

function createPreparedAnimatedCache(
  productId: 'sofa' | 'chair' | 'kitchen-dining' | 'kitchen-island' = 'sofa',
  direction: 'forward' | 'reverse' = 'forward',
) {
  const video = document.createElement('video');
  const prepared = {
    entry: { productId, direction },
    format: 'mp4' as const,
    blob: new Blob(['hero-video']),
    objectUrl: 'blob:timer-sofa-forward',
    element: video,
    mediaReady: true,
  };
  const bundle = {
    room: 'living-room' as const,
    mode: 'animated' as const,
    poster: document.createElement('img'),
    focus: new Map([[productId, document.createElement('img')]]),
    videos: new Map([[`${productId}:${direction}`, prepared]]),
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
  return { cache, video, bundle };
}

describe('Evironn interactive hero shell', () => {
  for (const productId of ['sofa', 'chair', 'kitchen-dining', 'kitchen-island'] as const) {
    for (const direction of ['forward', 'reverse'] as const) {
      it(`hands off ${productId} ${direction} without rewinding the finished video`, () => {
        const { cache, video, bundle } = createPreparedAnimatedCache(productId, direction);
        const focus = bundle.focus.get(productId)!;
        const complete = vi.fn(() => ({
          focusVisible: focus.classList.contains('is-visible'),
          videoVisible: video.classList.contains('is-visible'),
          time: video.currentTime,
        }));
        const { unmount } = render(
          <HeroProductMedia
            cache={cache}
            room={productId.startsWith('kitchen') ? 'kitchen' : 'living-room'}
            roomOperationId={1}
            playbackGeneration={1}
            phase={direction === 'forward' ? `entering-${productId}` : `returning-${productId}`}
            reducedMotion={false}
            onProgress={vi.fn()}
            onForwardComplete={complete}
            onReverseComplete={complete}
            onPlaybackUnavailable={vi.fn()}
          />,
        );
        firePlaying(video);
        video.currentTime = 6;
        fireEnded(video);
        expect(complete).toHaveBeenCalledOnce();
        expect(complete.mock.results[0].value).toEqual({
          focusVisible: direction === 'forward',
          videoVisible: false,
          time: 6,
        });
        unmount();
        expect(video.currentTime).toBe(6);
      });
    }
  }

  it('shows only the Fade Arc while preparing, with an accessible nonvisual label', () => {
    render(<Hero />);
    const status = screen.getByRole('status', { name: 'Загрузка комнаты…' });
    expect(status.textContent).toBe('');
    expect(status.querySelector('svg')).not.toBeNull();
    expect(status.closest('.furni-hero-preparation-overlay__panel')).toBeNull();
  });

  it('does not mount unrequested room posters', () => {
    render(<Hero />);
    const hero = document.querySelector('#evironn-hero')!;
    expect(hero.querySelectorAll('.furni-hero-room-media__image')).toHaveLength(1);
    expect(hero.querySelector('img[src="/assets/hero/kitchen-idle.webp"]')).toBeNull();
    expect(screen.getByRole('button', { name: 'СПАЛЬНЯ' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'ТЕРРАСА' })).toBeDisabled();
  });

  it('prepares bedroom and terrace only after selection and retains their media for revisits', async () => {
    render(<Hero />);
    await waitForLivingBundle();
    const initialFetchCount = fetchMock.mock.calls.length;
    expect(fetchMock.mock.calls.flat().join(' ')).not.toMatch(/bedroom|terrace/);

    for (const room of ['bedroom', 'terrace'] as const) {
      fireEvent.click(screen.getByRole('button', { name: room === 'bedroom' ? 'СПАЛЬНЯ' : 'ТЕРРАСА' }));
      await waitFor(() => expect(screen.getByRole('region')).toHaveAttribute('aria-busy', 'true'));
      if (room === 'bedroom') expect(document.querySelector('.furni-hero-stack--living-room')).toBeInTheDocument();
      await waitFor(() => expect(screen.getByRole('region')).toHaveAttribute('aria-busy', 'false'));
      await waitFor(() => expect(document.querySelector(`.furni-hero-stack--${room}`)).toBeInTheDocument());
      const incoming = document.querySelector<HTMLImageElement>('.furni-hero-room-media__image.is-incoming');
      expect(incoming).not.toBeNull();
      fireHeroAnimationEnd(incoming!);
      await waitFor(() =>
        expect(screen.getByRole('button', { name: room === 'bedroom' ? 'СПАЛЬНЯ' : 'ТЕРРАСА' })).toHaveAttribute(
          'aria-pressed',
          'true',
        ),
      );
      expect(document.querySelectorAll('#evironn-hero video')).toHaveLength((room === 'bedroom' ? 2 : 3) * 4);
    }

    const preparedFetchCount = fetchMock.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'СПАЛЬНЯ' }));
    await waitFor(() => expect(document.querySelector('.furni-hero-stack--bedroom')).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledTimes(preparedFetchCount);
    expect(fetchMock.mock.calls.length).toBe(initialFetchCount + 8);
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

  it('keeps playback failure and retry safe across StrictMode and actual unmount', async () => {
    const { unmount } = render(
      <StrictMode>
        <Hero />
      </StrictMode>,
    );
    await waitForLivingBundle();
    const ownedObjectUrls = objectUrlMock.mock.results.map(({ value }) => value as string);
    const sofaForward = [...document.querySelectorAll<HTMLVideoElement>('#evironn-hero video')].find(
      (video) => video.dataset.heroDirection === 'forward' && video.className.includes('is-product-sofa'),
    )!;
    playMock.mockRejectedValueOnce(new Error('play rejected'));
    fireEvent.click(screen.getByRole('button', { name: /Диван Linden/ }));
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    await waitForLivingBundle();
    unmount();
    firePlaying(sofaForward);
    Object.defineProperty(sofaForward, 'currentTime', { configurable: true, value: 5.5 });
    fireEvent.timeUpdate(sofaForward);
    fireEnded(sofaForward);
    fireEvent.error(sofaForward);
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    await waitFor(() => {
      expect(revokeObjectUrlMock.mock.calls.map(([url]) => url).sort()).toEqual([...ownedObjectUrls].sort());
    });
  });

  it('disposes pending StrictMode room work and ignores late fetch delivery after unmount', async () => {
    let releaseKitchen!: () => void;
    fetchMock.mockImplementation(async (input) => {
      if (String(input).includes('/assets/hero/kitchen-dining-forward')) {
        await new Promise<void>((resolve) => {
          releaseKitchen = resolve;
        });
      }
      return new Response(new Blob(['hero-video']));
    });
    const { unmount } = render(
      <StrictMode>
        <Hero />
      </StrictMode>,
    );
    await waitForLivingBundle();
    fireEvent.click(screen.getByRole('button', { name: 'КУХНЯ' }));
    await waitFor(() => expect(releaseKitchen).toEqual(expect.any(Function)));
    const ownedObjectUrls = objectUrlMock.mock.results.map(({ value }) => value as string);
    unmount();
    releaseKitchen();
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    await waitFor(() => {
      expect(revokeObjectUrlMock.mock.calls.map(([url]) => url).sort()).toEqual([...ownedObjectUrls].sort());
    });
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

  it('cancels held animated room preparation when reduced motion is enabled', async () => {
    let releaseKitchen!: () => void;
    let holdKitchen = true;
    fetchMock.mockImplementation(async (input) => {
      if (holdKitchen && String(input).includes('/assets/hero/kitchen-dining-forward')) {
        await new Promise<void>((resolve) => {
          releaseKitchen = resolve;
        });
        holdKitchen = false;
      }
      return new Response(new Blob(['hero-video']));
    });
    render(<Hero />);
    await waitForLivingBundle();
    fireEvent.click(screen.getByRole('button', { name: 'КУХНЯ' }));
    await waitFor(() => expect(releaseKitchen).toEqual(expect.any(Function)));
    setMotionPreference(true);
    await waitFor(() => expect(screen.getByRole('region')).toHaveAttribute('aria-busy', 'false'));
    await waitFor(() => expect(screen.getByRole('button', { name: 'КУХНЯ' })).toHaveAttribute('aria-pressed', 'true'));
    releaseKitchen();
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(document.querySelector('.furni-hero-stack--kitchen')).toBeInTheDocument();
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

  it('remounts only the poster that reported a load failure', async () => {
    render(<Hero />);
    const poster = document.querySelector<HTMLImageElement>('[data-hero-room="living-room"]')!;
    fireEvent.error(poster);
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    await waitFor(() =>
      expect(document.querySelector('[data-hero-room="living-room"]')).toHaveAttribute('data-hero-poster-version', '1'),
    );
    await waitForLivingBundle();
    expect(document.querySelector('[data-hero-room="living-room"]')).not.toBe(poster);
  });

  it('releases retained media on actual unmount', async () => {
    const { unmount } = render(<Hero />);
    await waitForLivingBundle();
    const ownedObjectUrls = objectUrlMock.mock.results.map(({ value }) => value as string);
    unmount();
    await waitFor(() => {
      expect(revokeObjectUrlMock.mock.calls.map(([url]) => url).sort()).toEqual([...ownedObjectUrls].sort());
    });
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
    fireHeroAnimationStart(kitchenImage, 'hero-room-enter', 100);
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
    fireHeroAnimationStart(kitchenImage, 'hero-room-enter', 200);
    const staleEnd = new Event('animationend', { bubbles: true });
    Object.defineProperty(staleEnd, 'animationName', { value: 'hero-room-enter' });
    Object.defineProperty(staleEnd, 'timeStamp', { value: 150 });
    fireEvent(kitchenImage, staleEnd);
    expect(onTransitionComplete).not.toHaveBeenCalled();
    fireHeroAnimationEnd(kitchenImage);
    expect(onTransitionComplete).toHaveBeenCalledWith(2);
  });

  it('cancels stale room animation timeout after a newer operation takes over', async () => {
    vi.useFakeTimers();
    const onTransitionFailure = vi.fn();
    const onTransitionComplete = vi.fn();
    const changingState = {
      ...INITIAL_HERO_ROOM_STATE,
      targetRoom: 'kitchen' as const,
      phase: 'changing' as const,
      operationId: 1,
    };
    const { rerender } = render(
      <HeroRoomMedia
        state={changingState}
        reducedMotion={false}
        requestedRooms={['living-room', 'kitchen']}
        posterVersions={{}}
        onPosterElement={vi.fn()}
        onTransitionComplete={onTransitionComplete}
        onTransitionFailure={onTransitionFailure}
      />,
    );
    vi.advanceTimersByTime(1_399);
    expect(onTransitionFailure).not.toHaveBeenCalled();
    rerender(
      <HeroRoomMedia
        state={{ ...changingState, phase: 'idle', targetRoom: null, operationId: 2 }}
        reducedMotion={false}
        requestedRooms={['living-room', 'kitchen']}
        posterVersions={{}}
        onPosterElement={vi.fn()}
        onTransitionComplete={onTransitionComplete}
        onTransitionFailure={onTransitionFailure}
      />,
    );
    vi.advanceTimersByTime(1_400);
    expect(onTransitionFailure).not.toHaveBeenCalled();
    expect(onTransitionComplete).not.toHaveBeenCalled();
  });

  it('recovers a room transition when its animation reaches the bounded timeout', async () => {
    vi.useFakeTimers();
    const onTransitionFailure = vi.fn();
    const state = {
      ...INITIAL_HERO_ROOM_STATE,
      targetRoom: 'kitchen' as const,
      phase: 'changing' as const,
      operationId: 1,
    };
    render(
      <HeroRoomMedia
        state={state}
        reducedMotion={false}
        requestedRooms={['living-room', 'kitchen']}
        posterVersions={{}}
        onPosterElement={vi.fn()}
        onTransitionComplete={vi.fn()}
        onTransitionFailure={onTransitionFailure}
      />,
    );
    vi.advanceTimersByTime(1_399);
    expect(onTransitionFailure).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onTransitionFailure).toHaveBeenCalledWith(1);
  });

  it('cancels a reduced-motion completion queued for a superseded room operation', async () => {
    vi.useFakeTimers();
    const onTransitionFailure = vi.fn();
    const onTransitionComplete = vi.fn();
    const changingState = {
      ...INITIAL_HERO_ROOM_STATE,
      targetRoom: 'kitchen' as const,
      phase: 'changing' as const,
      operationId: 1,
    };
    const { rerender } = render(
      <HeroRoomMedia
        state={changingState}
        reducedMotion
        requestedRooms={['living-room', 'kitchen']}
        posterVersions={{}}
        onPosterElement={vi.fn()}
        onTransitionComplete={onTransitionComplete}
        onTransitionFailure={onTransitionFailure}
      />,
    );
    rerender(
      <HeroRoomMedia
        state={{ ...changingState, phase: 'idle', targetRoom: null, operationId: 2 }}
        reducedMotion
        requestedRooms={['living-room', 'kitchen']}
        posterVersions={{}}
        onPosterElement={vi.fn()}
        onTransitionComplete={onTransitionComplete}
        onTransitionFailure={onTransitionFailure}
      />,
    );
    await Promise.resolve();
    vi.runOnlyPendingTimers();
    expect(onTransitionComplete).not.toHaveBeenCalled();
    expect(onTransitionFailure).not.toHaveBeenCalled();
  });

  it('cancels a reduced-motion product completion queued for a superseded retry', async () => {
    const cache = {
      get: vi.fn().mockImplementation((_room: string, mode: string) =>
        mode === 'static'
          ? {
              room: 'living-room',
              mode: 'static',
              poster: document.createElement('img'),
              focus: new Map([['sofa', document.createElement('img')]]),
              videos: new Map(),
            }
          : null,
      ),
      setHost: vi.fn(),
    } as unknown as Parameters<typeof HeroProductMedia>[0]['cache'];
    const onForwardComplete = vi.fn();
    const onReverseComplete = vi.fn();
    const { rerender } = render(
      <HeroProductMedia
        cache={cache}
        room="living-room"
        roomOperationId={4}
        playbackGeneration={7}
        phase="entering-sofa"
        reducedMotion
        onProgress={vi.fn()}
        onForwardComplete={onForwardComplete}
        onReverseComplete={onReverseComplete}
        onPlaybackUnavailable={vi.fn()}
      />,
    );
    rerender(
      <HeroProductMedia
        cache={cache}
        room="living-room"
        roomOperationId={5}
        playbackGeneration={8}
        phase="idle"
        reducedMotion
        onProgress={vi.fn()}
        onForwardComplete={onForwardComplete}
        onReverseComplete={onReverseComplete}
        onPlaybackUnavailable={vi.fn()}
      />,
    );
    await Promise.resolve();
    expect(onForwardComplete).not.toHaveBeenCalled();
    expect(onReverseComplete).not.toHaveBeenCalled();
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

  it('ignores a late play rejection after playback unmount', async () => {
    const onPlaybackUnavailable = vi.fn();
    const video = document.createElement('video');
    const prepared = {
      entry: { productId: 'sofa' as const, direction: 'forward' as const },
      format: 'mp4' as const,
      blob: new Blob(['hero-video']),
      objectUrl: 'blob:late-sofa-forward',
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
    let rejectPlay!: (reason: Error) => void;
    playMock.mockImplementationOnce(() => new Promise<void>((_, reject) => (rejectPlay = reject)));

    const { unmount } = render(
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
    await waitFor(() => expect(rejectPlay).toEqual(expect.any(Function)));
    unmount();
    rejectPlay(new Error('late play rejected'));
    await Promise.resolve();
    expect(onPlaybackUnavailable).not.toHaveBeenCalled();
  });

  it('fails a stalled playback at the bounded startup deadline', async () => {
    vi.useFakeTimers();
    const { cache } = createPreparedAnimatedCache();
    const onPlaybackUnavailable = vi.fn();
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
    expect(playMock).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(4_999);
    expect(onPlaybackUnavailable).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onPlaybackUnavailable).toHaveBeenCalledWith(
      expect.objectContaining({ entry: { productId: 'sofa', direction: 'forward' } }),
    );
  });

  it('fails a playback that never ends at its duration-derived deadline and clears it on end', async () => {
    vi.useFakeTimers();
    const { cache, video } = createPreparedAnimatedCache();
    const onPlaybackUnavailable = vi.fn();
    const onForwardComplete = vi.fn();
    render(
      <HeroProductMedia
        cache={cache}
        room="living-room"
        roomOperationId={4}
        playbackGeneration={7}
        phase="entering-sofa"
        reducedMotion={false}
        onProgress={vi.fn()}
        onForwardComplete={onForwardComplete}
        onReverseComplete={vi.fn()}
        onPlaybackUnavailable={onPlaybackUnavailable}
      />,
    );
    firePlaying(video);
    vi.advanceTimersByTime(12_999);
    expect(onPlaybackUnavailable).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onPlaybackUnavailable).toHaveBeenCalledTimes(1);
    expect(onForwardComplete).not.toHaveBeenCalled();
  });

  it('clears the duration deadline when playback ends', async () => {
    vi.useFakeTimers();
    const { cache, video } = createPreparedAnimatedCache();
    const onPlaybackUnavailable = vi.fn();
    const onForwardComplete = vi.fn();
    render(
      <HeroProductMedia
        cache={cache}
        room="living-room"
        roomOperationId={4}
        playbackGeneration={7}
        phase="entering-sofa"
        reducedMotion={false}
        onProgress={vi.fn()}
        onForwardComplete={onForwardComplete}
        onReverseComplete={vi.fn()}
        onPlaybackUnavailable={onPlaybackUnavailable}
      />,
    );
    firePlaying(video);
    expect(vi.getTimerCount()).toBe(1);
    fireEnded(video);
    expect(onForwardComplete).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(13_000);
    expect(onPlaybackUnavailable).not.toHaveBeenCalled();
  });

  it('ignores stale playback delivery after recovery and explicit retry', async () => {
    render(<Hero />);
    await waitForLivingBundle();
    const sofaForward = [...document.querySelectorAll<HTMLVideoElement>('#evironn-hero video')].find(
      (video) => video.dataset.heroDirection === 'forward' && video.className.includes('is-product-sofa'),
    )!;
    playMock.mockRejectedValueOnce(new Error('play rejected'));
    fireEvent.click(screen.getByRole('button', { name: /Диван Linden/ }));
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    await waitForLivingBundle();
    firePlaying(sofaForward);
    fireEnded(sofaForward);
    fireEvent.error(sofaForward);
    await new Promise<void>((resolve) => queueMicrotask(resolve));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Назад/ })).not.toBeInTheDocument();
  });

  it('invalidates pending playback callbacks and deadlines across recovery and retry', async () => {
    vi.useFakeTimers();
    const { cache, video } = createPreparedAnimatedCache();
    const onPlaybackUnavailableOld = vi.fn();
    const onPlaybackUnavailableNew = vi.fn();
    const onProgressOld = vi.fn();
    const onProgressNew = vi.fn();
    const onForwardComplete = vi.fn();
    let rejectOldPlay!: (reason: Error) => void;
    playMock.mockImplementationOnce(() => new Promise<void>((_, reject) => (rejectOldPlay = reject)));
    const { rerender, unmount } = render(
      <HeroProductMedia
        cache={cache}
        room="living-room"
        roomOperationId={4}
        playbackGeneration={7}
        phase="entering-sofa"
        reducedMotion={false}
        onProgress={onProgressOld}
        onForwardComplete={onForwardComplete}
        onReverseComplete={vi.fn()}
        onPlaybackUnavailable={onPlaybackUnavailableOld}
      />,
    );
    await Promise.resolve();
    expect(rejectOldPlay).toEqual(expect.any(Function));
    firePlaying(video);
    expect(vi.getTimerCount()).toBe(1);
    rerender(
      <HeroProductMedia
        cache={cache}
        room="living-room"
        roomOperationId={5}
        playbackGeneration={8}
        phase="idle"
        reducedMotion={false}
        onProgress={onProgressOld}
        onForwardComplete={onForwardComplete}
        onReverseComplete={vi.fn()}
        onPlaybackUnavailable={onPlaybackUnavailableOld}
      />,
    );
    expect(vi.getTimerCount()).toBe(0);
    rerender(
      <HeroProductMedia
        cache={cache}
        room="living-room"
        roomOperationId={6}
        playbackGeneration={9}
        phase="entering-sofa"
        reducedMotion={false}
        onProgress={onProgressNew}
        onForwardComplete={onForwardComplete}
        onReverseComplete={vi.fn()}
        onPlaybackUnavailable={onPlaybackUnavailableNew}
      />,
    );
    await Promise.resolve();
    expect(playMock).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(1);
    firePlaying(video);
    Object.defineProperties(video, {
      currentTime: { configurable: true, value: 3 },
      duration: { configurable: true, value: 6 },
    });
    fireEvent.timeUpdate(video);
    fireEnded(video);
    rejectOldPlay(new Error('late play rejection'));
    await Promise.resolve();
    expect(onForwardComplete).toHaveBeenCalledTimes(1);
    expect(onProgressOld).not.toHaveBeenCalled();
    expect(onProgressNew).toHaveBeenCalledWith(3, 6);
    expect(onPlaybackUnavailableOld).not.toHaveBeenCalled();
    expect(onPlaybackUnavailableNew).not.toHaveBeenCalled();
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('starts a retained direction while native media rehydrates after cleanup', async () => {
    const video = document.createElement('video');
    const prepared = {
      entry: { productId: 'sofa' as const, direction: 'forward' as const },
      format: 'mp4' as const,
      blob: new Blob(['hero-video']),
      objectUrl: 'blob:between-activation-and-play',
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
      readyState: { configurable: true, value: 1 },
      duration: { configurable: true, value: 6 },
    });
    video.setAttribute('src', prepared.objectUrl);
    const cache = {
      get: vi.fn().mockReturnValue(bundle),
      setHost: vi.fn(),
    } as unknown as Parameters<typeof HeroProductMedia>[0]['cache'];

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
        onPlaybackUnavailable={vi.fn()}
      />,
    );

    await waitFor(() => expect(playMock).toHaveBeenCalledWith());
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

  it('dismisses a failed kitchen request, then completes a fresh failure-retry cycle', async () => {
    let kitchenFailures = 2;
    let holdSuccessfulRetry = false;
    let releaseSuccessfulRetry!: () => void;
    fetchMock.mockImplementation(async (input) => {
      if (kitchenFailures > 0 && String(input).includes('/assets/hero/kitchen-dining-forward')) {
        kitchenFailures -= 1;
        throw new Error('kitchen unavailable');
      }
      if (holdSuccessfulRetry && String(input).includes('/assets/hero/kitchen-dining-forward')) {
        await new Promise<void>((resolve) => {
          releaseSuccessfulRetry = resolve;
        });
        holdSuccessfulRetry = false;
      }
      return new Response(new Blob(['hero-video']));
    });
    render(<Hero />);
    await waitForLivingBundle();
    await waitFor(() =>
      expect(document.querySelector('[data-hero-direction="forward"].is-product-sofa')).toBeInTheDocument(),
    );
    const sofaForward = [...document.querySelectorAll<HTMLVideoElement>('#evironn-hero video')].find(
      (video) => video.dataset.heroDirection === 'forward' && video.className.includes('is-product-sofa'),
    )!;
    const sofaFocus = document.querySelector<HTMLImageElement>('img.furni-hero-product-media__asset.is-product-sofa')!;
    const livingPoster = document.querySelector<HTMLImageElement>('[data-hero-room="living-room"]')!;
    const livingStack = document.querySelector('.furni-hero-stack--living-room')!;
    const livingPosterSrc = livingPoster.getAttribute('src');
    const sofaForwardSrc = sofaForward.getAttribute('src');
    const livingStackClassName = livingStack.className;
    fireEvent.click(screen.getByRole('button', { name: /Диван Linden/ }));
    firePlaying(sofaForward);
    fireEnded(sofaForward);
    await waitFor(() => expect(screen.getByRole('button', { name: /Назад/ })).toBeInTheDocument());
    const livingCard = screen.getByRole('complementary', { name: /Диван Linden/ });

    fireEvent.click(screen.getByRole('button', { name: 'КУХНЯ' }));
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /Назад/ })).toBeInTheDocument();
    const failedKitchenPoster = document.querySelector<HTMLImageElement>('[data-hero-room="kitchen"]')!;

    fireEvent.click(screen.getByRole('button', { name: 'ГОСТИНАЯ' }));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: /Назад/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'СМОТРЕТЬ КОЛЛЕКЦИЮ' })).toHaveAttribute('href', '/catalog?room=living');
    expect(document.querySelector('.furni-hero-stack--kitchen')).toBeNull();
    expect(sofaForward).toBe(document.querySelector('[data-hero-direction="forward"].is-product-sofa'));
    expect(sofaFocus).toBe(document.querySelector('img.furni-hero-product-media__asset.is-product-sofa'));
    expect(livingPoster).toBe(document.querySelector('[data-hero-room="living-room"]'));
    expect(livingPoster).toHaveAttribute('src', livingPosterSrc);
    expect(livingCard).toBe(screen.getByRole('complementary', { name: /Диван Linden/ }));
    expect(livingStack).toBe(document.querySelector('.furni-hero-stack--living-room'));
    expect(livingStack).toHaveClass('furni-hero-stack--living-room');
    expect(livingStack.className).toBe(livingStackClassName);
    expect(sofaForward).toHaveAttribute('src', sofaForwardSrc);
    fireHeroAnimationEnd(failedKitchenPoster);
    firePlaying(sofaForward);
    fireEnded(sofaForward);
    fireEvent.error(sofaForward);

    holdSuccessfulRetry = true;
    fireEvent.click(screen.getByRole('button', { name: 'КУХНЯ' }));
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /Назад/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    await waitFor(() => expect(releaseSuccessfulRetry).toEqual(expect.any(Function)));
    expect(sofaForward).toBe(document.querySelector('[data-hero-direction="forward"].is-product-sofa'));
    expect(sofaFocus).toBe(document.querySelector('img.furni-hero-product-media__asset.is-product-sofa'));
    expect(livingPoster).toBe(document.querySelector('[data-hero-room="living-room"]'));
    expect(livingCard).toBe(screen.getByRole('complementary', { name: /Диван Linden/ }));
    expect(livingStack.className).toBe(livingStackClassName);
    expect(failedKitchenPoster).toBe(document.querySelector('[data-hero-room="kitchen"]'));
    expect(screen.getByRole('button', { name: /Назад/ })).toBeInTheDocument();
    expect(document.querySelector('.furni-hero-stack--kitchen')).toBeNull();
    firePlaying(sofaForward);
    fireEnded(sofaForward);
    fireEvent.error(sofaForward);
    releaseSuccessfulRetry();
    await waitFor(() => expect(screen.getByRole('region')).toHaveAttribute('aria-busy', 'false'));
    const kitchenImage = document.querySelector<HTMLImageElement>('[data-hero-room="kitchen"]')!;
    await waitFor(() => expect(document.querySelector('.furni-hero-stack--kitchen')).toBeInTheDocument());
    fireHeroAnimationEnd(kitchenImage);
    await waitFor(() => expect(screen.getByRole('button', { name: 'КУХНЯ' })).toBeEnabled());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Назад/ })).not.toBeInTheDocument();
    expect(document.querySelector('.furni-hero-hotspot-kitchen-dining')).not.toHaveClass('is-hidden');
  });

  it('keeps kitchen hidden when the terminal fourth resource fails', async () => {
    fetchMock.mockImplementation(async (input) => {
      if (String(input).includes('/assets/hero/kitchen-island-reverse')) throw new Error('fourth resource unavailable');
      return new Response(new Blob(['hero-video']));
    });
    render(<Hero />);
    await waitForLivingBundle();
    fireEvent.click(screen.getByRole('button', { name: 'КУХНЯ' }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('region')).toHaveAttribute('aria-busy', 'false');
    expect(document.querySelector('.furni-hero-stack--kitchen')).toBeNull();
    expect(screen.getByRole('button', { name: 'КУХНЯ' })).toBeEnabled();
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

  it('restores initiating focus after room preparation fails', async () => {
    fetchMock.mockImplementation(async (input) => {
      if (String(input).includes('/assets/hero/kitchen-dining-forward')) throw new Error('kitchen unavailable');
      return new Response(new Blob(['hero-video']));
    });
    render(<Hero />);
    await waitForLivingBundle();
    const kitchen = screen.getByRole('button', { name: 'КУХНЯ' });
    kitchen.focus();
    fireEvent.click(kitchen);
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(kitchen).toHaveFocus();
  });

  it('preserves outside focus after room readiness and before queued restoration', async () => {
    render(
      <>
        <button type="button">Шапка</button>
        <Hero />
      </>,
    );
    await waitForLivingBundle();
    const kitchen = screen.getByRole('button', { name: 'КУХНЯ' });
    const header = screen.getByRole('button', { name: 'Шапка' });
    kitchen.focus();
    fireEvent.click(kitchen);
    await waitFor(() => expect(screen.getByRole('region')).toHaveAttribute('aria-busy', 'false'));
    await waitFor(() => expect(document.querySelector('.furni-hero-stack--kitchen')).toBeInTheDocument());
    const kitchenImage = document.querySelector<HTMLImageElement>('[data-hero-room="kitchen"]')!;
    fireHeroAnimationEnd(kitchenImage);
    header.focus();
    await waitFor(() => expect(kitchen).toBeEnabled());
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    expect(header).toHaveFocus();
  });

  it('prepares living poster, focus images, and four retained directional videos before enabling controls', async () => {
    render(<Hero />);
    expect(document.querySelector('.furni-hero-controls')).toHaveAttribute('data-hero-controls-locked', 'true');
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
    expect(document.querySelector('.furni-hero-controls')).not.toHaveAttribute('inert');
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
    expect(sofaForward).toBe(document.querySelector('[data-hero-direction="forward"].is-product-sofa'));
    expect(sofaReverse).toBe(document.querySelector('[data-hero-direction="reverse"].is-product-sofa'));
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

  it('reveals the product card at the approved playback threshold', async () => {
    render(<Hero />);
    await waitForLivingBundle();
    const sofaForward = [...document.querySelectorAll<HTMLVideoElement>('#evironn-hero video')].find(
      (video) => video.dataset.heroDirection === 'forward' && video.className.includes('is-product-sofa'),
    )!;
    fireEvent.click(screen.getByRole('button', { name: /Диван Linden/ }));
    Object.defineProperties(sofaForward, {
      currentTime: { configurable: true, value: 4.31 },
      duration: { configurable: true, value: 6 },
    });
    fireEvent.timeUpdate(sofaForward);
    expect(screen.queryByRole('complementary', { name: /Диван Linden/ })).not.toBeInTheDocument();

    Object.defineProperty(sofaForward, 'currentTime', { configurable: true, value: 4.32 });
    fireEvent.timeUpdate(sofaForward);
    expect(screen.getByRole('complementary', { name: /Диван Linden/ })).toBeInTheDocument();
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

  it('does not expose or transition to kitchen with only three of four videos ready', async () => {
    let releaseFourth!: () => void;
    let held = true;
    fetchMock.mockImplementation(async (input) => {
      if (held && String(input).includes('/assets/hero/kitchen-island-reverse')) {
        await new Promise<void>((resolve) => {
          releaseFourth = resolve;
        });
        held = false;
      }
      return new Response(new Blob(['hero-video']));
    });
    render(<Hero />);
    await waitForLivingBundle();
    fireEvent.click(screen.getByRole('button', { name: 'КУХНЯ' }));
    await waitFor(() => expect(releaseFourth).toEqual(expect.any(Function)));
    expect(screen.getByRole('region')).toHaveAttribute('aria-busy', 'true');
    expect(document.querySelector('.furni-hero-stack--kitchen')).toBeNull();
    releaseFourth();
    await waitFor(() => expect(screen.getByRole('region')).toHaveAttribute('aria-busy', 'false'));
    const kitchenImage = document.querySelector<HTMLImageElement>('[data-hero-room="kitchen"]')!;
    await waitFor(() => expect(document.querySelector('.furni-hero-stack--kitchen')).toBeInTheDocument());
    fireHeroAnimationEnd(kitchenImage);
    await waitFor(() => expect(screen.getByRole('button', { name: 'КУХНЯ' })).toBeEnabled());
  });

  it('keeps canonical links, enables all manifested room controls, and scoped recovery CSS', async () => {
    render(<Hero />);
    const hero = screen.getByRole('region', { name: 'Мебель с душой, созданная поколениями' });
    expect(within(hero).getByRole('heading', { name: /Мебель с душой/ })).toBeInTheDocument();
    expect(within(hero).getByRole('link', { name: 'СМОТРЕТЬ КОЛЛЕКЦИЮ' })).toHaveAttribute(
      'href',
      '/catalog?room=living',
    );
    expect(document.querySelector('.furni-hero-preparation-overlay')).toBeInTheDocument();
    await waitForLivingBundle();
    expect(screen.getByRole('button', { name: 'СПАЛЬНЯ' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'ТЕРРАСА' })).toBeEnabled();
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
      fireEvent.click(screen.getByRole('button', { name: /Диван Linden/ }));
      firePlaying(sofaForward);
      fireEnded(sofaForward);
      await waitFor(() => expect(screen.getByRole('button', { name: /Назад/ })).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: /Назад/ }));
      const sofaReverse = [...document.querySelectorAll<HTMLVideoElement>('#evironn-hero video')].find(
        (video) => video.dataset.heroDirection === 'reverse' && video.className.includes('is-product-sofa'),
      )!;
      firePlaying(sofaReverse);
      fireEnded(sofaReverse);
      await waitFor(() => expect(screen.queryByRole('button', { name: /Назад/ })).not.toBeInTheDocument());
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
      firePlaying(sofaReverse);
      fireEnded(sofaReverse);
      await waitFor(() => expect(screen.queryByRole('button', { name: /Назад/ })).not.toBeInTheDocument());
    });
  });
});
