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
  Object.defineProperty(image, 'naturalHeight', { configurable: true, value: 1000 });
  return image;
}

function makeReadyMedia() {
  Object.defineProperty(HTMLImageElement.prototype, 'complete', {
    configurable: true,
    value: true,
  });
  Object.defineProperty(HTMLImageElement.prototype, 'naturalWidth', {
    configurable: true,
    value: 1440,
  });
  Object.defineProperty(HTMLImageElement.prototype, 'naturalHeight', {
    configurable: true,
    value: 1000,
  });
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
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
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
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      return setTimeout(() => callback(performance.now()), 0);
    });
    vi.stubGlobal('cancelAnimationFrame', (handle: number) => clearTimeout(handle));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('keeps a fully prepared retained video ready when buffered is empty', async () => {
    const cache = createHeroRoomMediaCache(createSelector());
    cache.setHost(document.createElement('div'));
    cache.setPoster('living-room', makePoster());
    const room = await cache.prepare('living-room', 'animated', 1, new AbortController().signal);
    const retained = room.videos.get('chair:forward');
    expect(retained).toBeDefined();

    Object.defineProperty(retained!.element, 'buffered', {
      configurable: true,
      value: { length: 0 },
    });
    const source = retained!.element.getAttribute('src');
    const sourceAssignments = vi
      .spyOn(HTMLVideoElement.prototype, 'setAttribute')
      .mockImplementation(HTMLElement.prototype.setAttribute);
    const loadCount = vi.mocked(HTMLVideoElement.prototype.load).mock.calls.length;
    const fetchCount = vi.mocked(fetch).mock.calls.length;
    const createCount = createObjectUrl.mock.calls.length;
    const revokeCount = revokeObjectUrl.mock.calls.length;

    expect(cache.getUnreadyVideo('living-room')).toBeNull();
    await expect(cache.prepare('living-room', 'animated', 2, new AbortController().signal)).resolves.toBe(room);

    expect(cache.getUnreadyVideo('living-room')).toBeNull();
    expect(retained!.element.getAttribute('src')).toBe(source);
    expect(sourceAssignments.mock.calls.filter(([name]) => name === 'src')).toHaveLength(0);
    expect(vi.mocked(HTMLVideoElement.prototype.load).mock.calls.length).toBe(loadCount);
    expect(vi.mocked(fetch).mock.calls.length).toBe(fetchCount);
    expect(createObjectUrl.mock.calls.length).toBe(createCount);
    expect(revokeObjectUrl.mock.calls.length).toBe(revokeCount);
  });

  it('requires image.decode fulfillment and positive dimensions for cached images', async () => {
    const cache = createHeroRoomMediaCache(createSelector());
    cache.setHost(document.createElement('div'));
    const poster = makePoster();
    Object.defineProperty(poster, 'naturalWidth', { configurable: true, value: 0 });
    cache.setPoster('living-room', poster);

    await expect(cache.prepare('living-room', 'static', 1, new AbortController().signal)).rejects.toMatchObject({
      resource: 'poster',
    });
    expect(HTMLImageElement.prototype.decode).toHaveBeenCalled();
    expect(cache.get('living-room', 'static')).toBeNull();
  });

  it('waits for a guarded next animation frame after poster decode', async () => {
    vi.useFakeTimers();
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frames.push(callback);
      return frames.length;
    });
    const cache = createHeroRoomMediaCache(createSelector());
    cache.setHost(document.createElement('div'));
    cache.setPoster('living-room', makePoster());
    const preparation = cache.prepare('living-room', 'static', 1, new AbortController().signal);

    await vi.advanceTimersByTimeAsync(0);
    expect(frames).toHaveLength(1);
    expect(fetch).not.toHaveBeenCalled();
    frames[0](0);
    await preparation;

    expect(fetch).not.toHaveBeenCalled();
  });

  it('uses cancellable 100ms frame fallback without exceeding room deadline', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn(() => 1),
    );
    const cache = createHeroRoomMediaCache(createSelector());
    cache.setHost(document.createElement('div'));
    cache.setPoster('living-room', makePoster());
    const preparation = cache.prepare('living-room', 'static', 1, new AbortController().signal);

    await vi.advanceTimersByTimeAsync(99);
    expect(cache.get('living-room', 'static')).toBeNull();
    await vi.advanceTimersByTimeAsync(1);
    await expect(preparation).resolves.toMatchObject({ mode: 'static' });
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

  it('prepares the complete four-video bundle for bedroom and terrace on demand', async () => {
    const cache = createHeroRoomMediaCache(createSelector());
    const host = document.createElement('div');
    cache.setHost(host);

    for (const [operationId, room] of [
      [2, 'bedroom'],
      [3, 'terrace'],
    ] as const) {
      cache.setPoster(room, makePoster());
      const prepared = await cache.prepare(room, 'animated', operationId, new AbortController().signal);
      expect(prepared.focus).toHaveProperty('size', 2);
      expect(prepared.videos).toHaveProperty('size', 4);
      expect([...prepared.videos.keys()].sort()).toEqual(
        expect.arrayContaining([
          `${room === 'bedroom' ? 'bedroom-chair' : 'terrace-chair'}:forward`,
          `${room === 'bedroom' ? 'bedroom-chair' : 'terrace-chair'}:reverse`,
          `${room === 'bedroom' ? 'bedroom-bed' : 'terrace-sofa'}:forward`,
          `${room === 'bedroom' ? 'bedroom-bed' : 'terrace-sofa'}:reverse`,
        ]),
      );
    }

    expect(fetch).toHaveBeenCalledTimes(8);
  });

  it('attaches preparation media with the hidden asset class already present', async () => {
    const cache = createHeroRoomMediaCache(createSelector());
    const host = document.createElement('div');
    const inserted: boolean[] = [];
    const append = host.appendChild.bind(host);
    vi.spyOn(host, 'appendChild').mockImplementation((node) => {
      inserted.push((node as HTMLElement).classList.contains('furni-hero-product-media__asset'));
      return append(node);
    });
    cache.setHost(host);
    cache.setPoster('living-room', makePoster());
    cache.setPoster('kitchen', makePoster());
    try {
      await cache.prepare('living-room', 'animated', 1, new AbortController().signal);
      await cache.prepare('kitchen', 'animated', 2, new AbortController().signal);
      expect(inserted).toHaveLength(12);
      expect(inserted.every(Boolean)).toBe(true);
    } finally {
      cache.dispose();
    }
  });

  it('stores one full Blob and one object URL per video', async () => {
    const cache = createHeroRoomMediaCache(createSelector());
    cache.setHost(document.createElement('div'));
    cache.setPoster('living-room', makePoster());

    const room = await cache.prepare('living-room', 'animated', 1, new AbortController().signal);

    expect(room.videos.size).toBe(4);
    expect([...room.videos.values()].every((video) => video.blob.size === blobBytes.length)).toBe(true);
    expect(createObjectUrl).toHaveBeenCalledTimes(4);
    expect(vi.mocked(fetch).mock.results).toHaveLength(4);
    expect(new Set([...room.videos.values()].map((video) => video.objectUrl)).size).toBe(4);
    expect([...room.videos.values()].every((video) => video.mediaReady)).toBe(true);
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
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

  it('keeps a retained cache entry ready when buffered ranges are empty', async () => {
    const cache = createHeroRoomMediaCache(createSelector());
    cache.setHost(document.createElement('div'));
    cache.setPoster('living-room', makePoster());
    const room = await cache.prepare('living-room', 'animated', 1, new AbortController().signal);
    const video = room.videos.get('chair:forward')?.element;
    expect(video).toBeDefined();
    Object.defineProperty(video, 'buffered', {
      configurable: true,
      value: { length: 0 },
    });
    const source = video?.getAttribute('src');
    const loadCount = vi.mocked(HTMLVideoElement.prototype.load).mock.calls.length;
    const fetchCount = vi.mocked(fetch).mock.calls.length;
    const revokeCount = revokeObjectUrl.mock.calls.length;

    expect(cache.getUnreadyVideo('living-room')).toBeNull();
    expect(cache.get('living-room', 'animated')).not.toBeNull();
    expect(video?.getAttribute('src')).toBe(source);
    expect(vi.mocked(HTMLVideoElement.prototype.load)).toHaveBeenCalledTimes(loadCount);
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(fetchCount);
    expect(revokeObjectUrl).toHaveBeenCalledTimes(revokeCount);
  });

  it('rejects stale source or replaced element despite historical media readiness', async () => {
    const cache = createHeroRoomMediaCache(createSelector());
    cache.setHost(document.createElement('div'));
    cache.setPoster('living-room', makePoster());
    const room = await cache.prepare('living-room', 'animated', 1, new AbortController().signal);
    const video = room.videos.get('chair:forward')?.element;
    expect(video).toBeDefined();

    video!.setAttribute('src', 'blob:stale-source');
    expect(cache.get('living-room', 'animated')).toBeNull();
    expect(cache.getUnreadyVideo('living-room')).toEqual({ productId: 'chair', direction: 'forward' });
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

  it('repairs committed WebM media in place and preserves ownership across failure', async () => {
    vi.spyOn(HTMLVideoElement.prototype, 'canPlayType').mockReturnValue('probably');
    const cache = createHeroRoomMediaCache(createSelector());
    cache.setHost(document.createElement('div'));
    cache.setPoster('living-room', makePoster());
    const first = await cache.prepare('living-room', 'animated', 1, new AbortController().signal);
    const firstVideo = first.videos.get('chair:forward');
    expect(firstVideo).toBeDefined();
    const fetchCount = vi.mocked(fetch).mock.calls.length;
    const urlCount = createObjectUrl.mock.calls.length;
    const revokeCount = revokeObjectUrl.mock.calls.length;
    cache.invalidateVideoMedia('living-room', 'chair', 'forward');
    const addListener = vi.spyOn(HTMLVideoElement.prototype, 'addEventListener');
    const removeListener = vi.spyOn(HTMLVideoElement.prototype, 'removeEventListener');
    let loadCount = 0;
    vi.spyOn(HTMLVideoElement.prototype, 'load').mockImplementation(function load(this: HTMLVideoElement) {
      loadCount += 1;
      if (loadCount === 1) {
        queueMicrotask(() => this.dispatchEvent(new Event('error')));
        return;
      }
      Object.defineProperties(this, {
        duration: { configurable: true, value: 6 },
        readyState: { configurable: true, value: HTMLMediaElement.HAVE_CURRENT_DATA },
      });
      queueMicrotask(() => {
        this.dispatchEvent(new Event('loadedmetadata'));
        this.dispatchEvent(new Event('loadeddata'));
      });
    });
    await expect(cache.prepare('living-room', 'animated', 2, new AbortController().signal)).rejects.toMatchObject({
      resource: 'video',
    });
    expect(cache.getUnreadyVideo('living-room')).toEqual({ productId: 'chair', direction: 'forward' });
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(fetchCount);
    expect(createObjectUrl).toHaveBeenCalledTimes(urlCount);
    expect(revokeObjectUrl).toHaveBeenCalledTimes(revokeCount);
    expect(vi.mocked(fetch).mock.calls.some(([src]) => String(src).endsWith('.mp4'))).toBe(false);

    const repaired = await cache.prepare('living-room', 'animated', 3, new AbortController().signal);
    const repairedVideo = repaired.videos.get('chair:forward');
    expect(repairedVideo?.blob).toBe(firstVideo?.blob);
    expect(repairedVideo?.objectUrl).toBe(firstVideo?.objectUrl);
    expect(repairedVideo?.element).toBe(firstVideo?.element);
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(fetchCount);
    expect(createObjectUrl).toHaveBeenCalledTimes(urlCount);
    expect(revokeObjectUrl).toHaveBeenCalledTimes(revokeCount);
    for (const type of ['loadedmetadata', 'loadeddata', 'error']) {
      expect(removeListener.mock.calls.filter(([event]) => event === type)).toHaveLength(
        addListener.mock.calls.filter(([event]) => event === type).length,
      );
    }

    cache.disposeVideoResource('living-room', 'chair', 'forward');
    expect(revokeObjectUrl).toHaveBeenCalledTimes(revokeCount + 1);
  });

  it('allows one initial WebM fallback and stops after fallback failure', async () => {
    vi.spyOn(HTMLVideoElement.prototype, 'canPlayType').mockReturnValue('probably');
    let loadCount = 0;
    vi.spyOn(HTMLVideoElement.prototype, 'load').mockImplementation(function load(this: HTMLVideoElement) {
      loadCount += 1;
      queueMicrotask(() => this.dispatchEvent(new Event('error')));
    });
    const cache = createHeroRoomMediaCache(createSelector());
    cache.setHost(document.createElement('div'));
    cache.setPoster('living-room', makePoster());

    await expect(cache.prepare('living-room', 'animated', 1, new AbortController().signal)).rejects.toMatchObject({
      resource: 'video',
    });
    expect(loadCount).toBe(2);
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2);
    expect(vi.mocked(fetch).mock.calls.map(([src]) => String(src))).toEqual([
      '/assets/hero/chair-forward.webm',
      '/assets/hero/chair-forward.mp4',
    ]);
  });

  it('times out and retries without stale completion', async () => {
    vi.useFakeTimers();
    let resolveFetch!: (response: Response) => void;
    let activeSignal!: AbortSignal;
    vi.mocked(fetch).mockImplementation(
      (_input, init) =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
          activeSignal = init?.signal as AbortSignal;
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
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(100);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(activeSignal).toBeInstanceOf(AbortSignal);
    await vi.advanceTimersByTimeAsync(15_001);
    expect(activeSignal.aborted).toBe(true);
    expect(await firstOutcome).toMatchObject({ resource: 'video' });
    resolveFetch(makeResponse());
    expect(createObjectUrl).not.toHaveBeenCalled();

    vi.mocked(fetch).mockResolvedValue(makeResponse());
    const second = cache.prepare('living-room', 'animated', 2, new AbortController().signal);
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(100);
    await second;
    expect(fetch).toHaveBeenCalledTimes(5);
  });

  it('aborts superseded active fetch and ignores its late completion', async () => {
    type PendingRequest = { resolve: (response: Response) => void; signal: AbortSignal };
    const pending: PendingRequest[] = [];
    vi.mocked(fetch).mockImplementation(
      (_input, init) =>
        new Promise<Response>((resolve) => {
          pending.push({ resolve, signal: init?.signal as AbortSignal });
        }),
    );
    const host = document.createElement('div');
    const cache = createHeroRoomMediaCache(createSelector());
    cache.setHost(host);
    cache.setPoster('living-room', makePoster());
    const first = cache.prepare('living-room', 'animated', 1, new AbortController().signal);
    const firstOutcome = first.then(
      () => null,
      (error) => error,
    );

    await vi.waitFor(() => expect(pending).toHaveLength(1));
    const second = cache.prepare('living-room', 'animated', 2, new AbortController().signal);
    expect(pending[0].signal.aborted).toBe(true);
    pending[0].resolve(makeResponse());
    await vi.waitFor(() => expect(pending).toHaveLength(2));
    expect(await firstOutcome).toMatchObject({ name: 'AbortError' });

    for (let index = 1; index < 5; index += 1) {
      pending[index].resolve(makeResponse());
      if (index < 4) await vi.waitFor(() => expect(pending).toHaveLength(index + 2));
    }
    await expect(second).resolves.toMatchObject({ mode: 'animated' });

    expect(createObjectUrl).toHaveBeenCalledTimes(4);
    expect(revokeObjectUrl).not.toHaveBeenCalled();
    expect(host.querySelectorAll('video')).toHaveLength(4);
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

  it('preserves decoded focus and static readiness when video preparation fails', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('network failure'));
    const cache = createHeroRoomMediaCache(createSelector());
    cache.setHost(document.createElement('div'));
    cache.setPoster('living-room', makePoster());

    await expect(cache.prepare('living-room', 'animated', 1, new AbortController().signal)).rejects.toMatchObject({
      resource: 'video',
    });
    const staticRoom = cache.get('living-room', 'static');
    expect(staticRoom).not.toBeNull();
    expect(staticRoom?.focus.size).toBe(2);
    expect([...staticRoom!.focus.values()].every((image) => image.naturalWidth > 0)).toBe(true);
  });

  it('serializes replacement attempts and rejects stale work after dispose', async () => {
    let releaseDecode!: () => void;
    vi.mocked(HTMLImageElement.prototype.decode).mockImplementation(
      () => new Promise<void>((resolve) => (releaseDecode = resolve)),
    );
    const cache = createHeroRoomMediaCache(createSelector());
    cache.setHost(document.createElement('div'));
    cache.setPoster('living-room', makePoster());
    const first = cache.prepare('living-room', 'static', 1, new AbortController().signal);
    const second = cache.prepare('living-room', 'static', 2, new AbortController().signal);
    cache.dispose();
    releaseDecode?.();

    await expect(first).rejects.toMatchObject({ name: 'AbortError' });
    await expect(second).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetch).not.toHaveBeenCalled();

    const freshCache = createHeroRoomMediaCache(createSelector());
    freshCache.setHost(document.createElement('div'));
    freshCache.setPoster('living-room', makePoster());
    vi.mocked(HTMLImageElement.prototype.decode).mockResolvedValue(undefined);
    await expect(freshCache.prepare('living-room', 'static', 3, new AbortController().signal)).resolves.toMatchObject({
      mode: 'static',
    });
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

  it('cleans newly owned media when cancellation follows readiness before registration', async () => {
    vi.useFakeTimers();
    const cache = createHeroRoomMediaCache(createSelector());
    const host = document.createElement('div');
    cache.setHost(host);
    cache.setPoster('living-room', makePoster());
    const controller = new AbortController();
    const addListener = vi.spyOn(HTMLVideoElement.prototype, 'addEventListener');
    const removeListener = vi.spyOn(HTMLVideoElement.prototype, 'removeEventListener');
    let lateCompletion!: () => void;
    let cancelAtRegistration = true;
    const originalMapSet = Map.prototype.set;
    vi.spyOn(Map.prototype, 'set').mockImplementation(function set(
      this: Map<unknown, unknown>,
      key: unknown,
      value: unknown,
    ) {
      const result = originalMapSet.call(this, key, value);
      if (
        cancelAtRegistration &&
        key === 'chair:forward' &&
        typeof value === 'object' &&
        value !== null &&
        'element' in value &&
        value.element instanceof HTMLVideoElement
      ) {
        cancelAtRegistration = false;
        controller.abort();
      }
      return result;
    });
    vi.mocked(HTMLVideoElement.prototype.load).mockImplementation(function load(this: HTMLVideoElement) {
      Object.defineProperties(this, {
        duration: { configurable: true, value: 6 },
        readyState: { configurable: true, value: HTMLMediaElement.HAVE_CURRENT_DATA },
      });
      lateCompletion = () => {
        this.dispatchEvent(new Event('loadedmetadata'));
        this.dispatchEvent(new Event('loadeddata'));
      };
      queueMicrotask(() => {
        lateCompletion();
      });
    });
    const preparation = cache.prepare('living-room', 'animated', 1, controller.signal);
    const outcome = preparation.then(
      () => null,
      (error) => error,
    );
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(100);
    expect(await outcome).toMatchObject({ name: 'AbortError' });
    expect(createObjectUrl).toHaveBeenCalledTimes(1);
    expect(revokeObjectUrl).toHaveBeenCalledTimes(1);
    expect(host.querySelectorAll('video')).toHaveLength(0);
    expect(vi.getTimerCount()).toBe(0);
    const mediaEvents = new Set(['loadedmetadata', 'loadeddata', 'error']);
    const addedMediaListeners = addListener.mock.calls.filter(([event]) => mediaEvents.has(String(event)));
    const removedMediaListeners = removeListener.mock.calls.filter(([event]) => mediaEvents.has(String(event)));
    expect(removedMediaListeners).toHaveLength(addedMediaListeners.length);
    for (const [event, listener] of addedMediaListeners) {
      expect(removedMediaListeners).toContainEqual(expect.arrayContaining([event, listener]));
    }

    lateCompletion();
    expect(createObjectUrl).toHaveBeenCalledTimes(1);
    expect(revokeObjectUrl).toHaveBeenCalledTimes(1);
  });
});
