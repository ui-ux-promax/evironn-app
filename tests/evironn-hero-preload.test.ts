// @vitest-environment jsdom

import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import type { HeroVideoSources } from '@/components/evironn/home/hero-products';
import {
  createHeroRoomMediaCache,
  isHeroVideoMediaReady,
  type HeroPreparedRoom,
} from '@/components/evironn/home/hero-room-preload';

const blobBytes = new TextEncoder().encode('complete-video-payload');

function makeResponse() {
  return {
    ok: true,
    blob: vi.fn(async () => new Blob([blobBytes], { type: 'video/mp4' })),
  } as unknown as Response;
}

function createSelector() {
  return (sources: HeroVideoSources, canPlayType: (mime: string) => string) =>
    sources.webm && canPlayType('video/webm; codecs="vp9"') !== ''
      ? { format: 'webm' as const, src: sources.webm }
      : { format: 'mp4' as const, src: sources.mp4 };
}

function makePoster() {
  const image = document.createElement('img');
  Object.defineProperty(image, 'complete', { configurable: true, value: true });
  Object.defineProperty(image, 'naturalWidth', { configurable: true, value: 1440 });
  return image;
}

function makeReadyMedia() {
  Object.defineProperty(HTMLImageElement.prototype, 'decode', {
    configurable: true,
    writable: true,
    value: vi.fn().mockResolvedValue(undefined),
  });
  vi.spyOn(HTMLVideoElement.prototype, 'load').mockImplementation(function load(this: HTMLVideoElement) {
    Object.defineProperties(this, {
      duration: { configurable: true, value: 6 },
      readyState: { configurable: true, value: HTMLMediaElement.HAVE_CURRENT_DATA },
    });
    queueMicrotask(() => {
      this.dispatchEvent(new Event('loadedmetadata'));
      this.dispatchEvent(new Event('loadeddata'));
    });
  });
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
}

describe('hero room media preload cache', () => {
  let createObjectUrl: ReturnType<typeof vi.fn>;
  let revokeObjectUrl: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.restoreAllMocks();
    createObjectUrl = vi.fn((blob: Blob) => `blob:test-${blob.size}-${createObjectUrl.mock.calls.length}`);
    revokeObjectUrl = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectUrl });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectUrl });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(makeResponse());
    makeReadyMedia();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not treat an empty buffered range as loss of a retained Blob', () => {
    const video = document.createElement('video');
    Object.defineProperties(video, {
      duration: { value: 6 },
      readyState: { value: 2 },
    });
    expect(isHeroVideoMediaReady(video, true)).toBe(true);
  });

  it('rejects nonfinite duration, missing metadata, and missing first-frame proof', () => {
    const video = document.createElement('video');
    Object.defineProperties(video, {
      duration: { configurable: true, value: Number.POSITIVE_INFINITY },
      readyState: { configurable: true, value: HTMLMediaElement.HAVE_CURRENT_DATA },
    });
    expect(isHeroVideoMediaReady(video, true)).toBe(false);
    Object.defineProperty(video, 'duration', { configurable: true, value: 6 });
    expect(isHeroVideoMediaReady(video, false)).toBe(false);
    Object.defineProperty(video, 'readyState', { configurable: true, value: HTMLMediaElement.HAVE_METADATA });
    expect(isHeroVideoMediaReady(video, true)).toBe(false);
  });

  it('waits for decoded poster before fetching four videos', async () => {
    const cache = createHeroRoomMediaCache(createSelector());
    const host = document.createElement('div');
    const poster = makePoster();
    cache.setHost(host);
    cache.setPoster('living-room', poster);

    const promise = cache.prepare('living-room', 'animated', 1, new AbortController().signal);
    expect(fetch).not.toHaveBeenCalled();
    await promise;

    expect(fetch).toHaveBeenCalledTimes(4);
    expect(cache.get('living-room', 'animated')).not.toBeNull();
    expect(host.querySelectorAll('video')).toHaveLength(4);
  });

  it('stores one full Blob and one object URL per video', async () => {
    const cache = createHeroRoomMediaCache(createSelector());
    cache.setHost(document.createElement('div'));
    cache.setPoster('living-room', makePoster());

    const room = await cache.prepare('living-room', 'animated', 1, new AbortController().signal);

    expect(room.videos.size).toBe(4);
    expect([...room.videos.values()].every((video) => video.blob.size === blobBytes.length)).toBe(true);
    expect(createObjectUrl).toHaveBeenCalledTimes(4);
    expect(new Set([...room.videos.values()].map((video) => video.objectUrl)).size).toBe(4);
    expect([...room.videos.values()].every((video) => video.mediaReady)).toBe(true);
  });

  it('serializes video fetches and separates queue from active deadlines', async () => {
    vi.useFakeTimers();
    let active = 0;
    let maxActive = 0;
    const pending: Array<() => void> = [];
    vi.mocked(fetch).mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          active += 1;
          maxActive = Math.max(maxActive, active);
          pending.push(() => {
            active -= 1;
            resolve(makeResponse());
          });
        }),
    );
    const cache = createHeroRoomMediaCache(createSelector());
    cache.setHost(document.createElement('div'));
    cache.setPoster('living-room', makePoster());
    const promise = cache.prepare('living-room', 'animated', 1, new AbortController().signal);
    const outcome = promise.then(
      () => null,
      (error) => error,
    );

    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(14_999);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(maxActive).toBe(1);
    pending.shift()?.();
    await vi.advanceTimersByTimeAsync(0);
    expect(fetch).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(15_000);
    expect(await outcome).toMatchObject({ resource: 'video' });
    expect(maxActive).toBe(1);
  });

  it('bounds registration queue by the 45-second room deadline', async () => {
    vi.useFakeTimers();
    const cache = createHeroRoomMediaCache(createSelector());
    const preparation = cache.prepare('living-room', 'animated', 1, new AbortController().signal);
    const outcome = preparation.then(
      () => null,
      (error) => error,
    );

    await vi.advanceTimersByTimeAsync(45_000);

    expect(await outcome).toMatchObject({ room: 'living-room', resource: 'registration' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('reuses all four retained elements without fetch or object-URL assignment', async () => {
    const cache = createHeroRoomMediaCache(createSelector());
    cache.setHost(document.createElement('div'));
    cache.setPoster('living-room', makePoster());
    const first = await cache.prepare('living-room', 'animated', 1, new AbortController().signal);
    const fetchCount = vi.mocked(fetch).mock.calls.length;
    const urlCount = createObjectUrl.mock.calls.length;

    const second = await cache.prepare('living-room', 'animated', 2, new AbortController().signal);

    expect(second).toBe(first);
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(fetchCount);
    expect(createObjectUrl).toHaveBeenCalledTimes(urlCount);
    expect([...second.videos.values()].map((video) => video.element)).toEqual(
      [...first.videos.values()].map((video) => video.element),
    );
  });

  it('falls back once with fresh Blob/media proof', async () => {
    const calls: string[] = [];
    vi.mocked(fetch).mockImplementation(async (input) => {
      calls.push(String(input));
      return makeResponse();
    });
    vi.spyOn(HTMLVideoElement.prototype, 'canPlayType').mockReturnValue('probably');
    const cache = createHeroRoomMediaCache(createSelector());
    cache.setHost(document.createElement('div'));
    cache.setPoster('living-room', makePoster());
    let loadCount = 0;
    vi.spyOn(HTMLVideoElement.prototype, 'load').mockImplementation(function load(this: HTMLVideoElement) {
      if (loadCount++ === 0) {
        Object.defineProperties(this, {
          duration: { configurable: true, value: 6 },
          readyState: { configurable: true, value: HTMLMediaElement.HAVE_METADATA },
        });
        queueMicrotask(() => this.dispatchEvent(new Event('loadedmetadata')));
        queueMicrotask(() => this.dispatchEvent(new Event('error')));
        return;
      }
      Object.defineProperties(this, {
        duration: { configurable: true, value: 6 },
        readyState: { configurable: true, value: HTMLMediaElement.HAVE_METADATA },
      });
      queueMicrotask(() => {
        Object.defineProperty(this, 'readyState', {
          configurable: true,
          value: HTMLMediaElement.HAVE_CURRENT_DATA,
        });
        this.dispatchEvent(new Event('loadedmetadata'));
        this.dispatchEvent(new Event('loadeddata'));
      });
    });
    const room = await cache.prepare('living-room', 'animated', 1, new AbortController().signal);
    expect(room.videos.size).toBe(4);
    expect(calls.filter((src) => src.endsWith('.webm'))).toHaveLength(4);
    expect(calls.filter((src) => src.endsWith('.mp4'))).toHaveLength(1);
    expect(createObjectUrl).toHaveBeenCalledTimes(5);
    expect(revokeObjectUrl).toHaveBeenCalledTimes(1);
  });

  it('times out and retries without stale completion', async () => {
    vi.useFakeTimers();
    let resolveFetch!: (response: Response) => void;
    vi.mocked(fetch).mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );
    const cache = createHeroRoomMediaCache(createSelector());
    cache.setHost(document.createElement('div'));
    cache.setPoster('living-room', makePoster());
    const first = cache.prepare('living-room', 'animated', 1, new AbortController().signal);
    const firstOutcome = first.then(
      () => null,
      (error) => error,
    );
    await vi.advanceTimersByTimeAsync(15_000);
    expect(await firstOutcome).toMatchObject({ resource: 'video' });
    resolveFetch(makeResponse());
    expect(createObjectUrl).not.toHaveBeenCalled();

    vi.mocked(fetch).mockResolvedValue(makeResponse());
    const second = cache.prepare('living-room', 'animated', 2, new AbortController().signal);
    await second;
    expect(fetch).toHaveBeenCalledTimes(5);
  });

  it('keeps static mode independent and attaches no videos', async () => {
    const cache = createHeroRoomMediaCache(createSelector());
    const host = document.createElement('div');
    cache.setHost(host);
    cache.setPoster('living-room', makePoster());
    const room: HeroPreparedRoom = await cache.prepare('living-room', 'static', 1, new AbortController().signal);

    expect(room.videos.size).toBe(0);
    expect(host.querySelectorAll('video')).toHaveLength(0);
    expect(fetch).not.toHaveBeenCalled();
    expect(room.focus.size).toBe(2);
  });

  it('disposes only selected video resource and retains healthy resources', async () => {
    const cache = createHeroRoomMediaCache(createSelector());
    cache.setHost(document.createElement('div'));
    cache.setPoster('living-room', makePoster());
    const room = await cache.prepare('living-room', 'animated', 1, new AbortController().signal);
    const healthy = room.videos.get('chair:forward');
    expect(healthy).toBeDefined();

    cache.invalidateVideoMedia('living-room', 'sofa', 'reverse');
    expect(cache.getUnreadyVideo('living-room')).toEqual({ productId: 'sofa', direction: 'reverse' });
    expect(room.videos.get('chair:forward')).toBe(healthy);
    expect(room.videos.get('sofa:reverse')?.blob).toBeInstanceOf(Blob);
    cache.disposeVideoResource('living-room', 'sofa', 'reverse');
    expect(revokeObjectUrl).toHaveBeenCalledTimes(1);
    expect(cache.getUnreadyVideo('living-room')).toEqual({ productId: 'sofa', direction: 'reverse' });
  });

  it('aborts, unmounts, and remounts without losing retained resources', async () => {
    const cache = createHeroRoomMediaCache(createSelector());
    const firstHost = document.createElement('div');
    cache.setHost(firstHost);
    cache.setPoster('living-room', makePoster());
    const first = await cache.prepare('living-room', 'animated', 1, new AbortController().signal);
    cache.setHost(null);
    cache.setPoster('living-room', null);
    cache.setHost(document.createElement('div'));
    cache.setPoster('living-room', makePoster());
    const second = await cache.prepare('living-room', 'animated', 2, new AbortController().signal);
    expect(second.videos.get('chair:forward')?.element).toBe(first.videos.get('chair:forward')?.element);
    expect(fetch).toHaveBeenCalledTimes(4);
    cache.dispose();
    cache.dispose();
    expect(revokeObjectUrl).toHaveBeenCalledTimes(4);
  });

  it('cancels abort during image decode and fetch without surfacing a preparation failure', async () => {
    let releaseDecode!: () => void;
    vi.mocked(HTMLImageElement.prototype.decode).mockImplementation(
      () => new Promise<void>((resolve) => (releaseDecode = resolve)),
    );
    const cache = createHeroRoomMediaCache(createSelector());
    cache.setHost(document.createElement('div'));
    const poster = makePoster();
    cache.setPoster('living-room', poster);
    const controller = new AbortController();
    const preparation = cache.prepare('living-room', 'animated', 1, controller.signal);
    await new Promise<void>((resolve) => queueMicrotask(() => resolve()));
    await new Promise<void>((resolve) => queueMicrotask(() => resolve()));
    controller.abort();
    releaseDecode?.();
    await expect(preparation).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetch).not.toHaveBeenCalled();
  });
});
