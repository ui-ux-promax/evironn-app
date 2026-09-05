import { HERO_PRODUCTS, type HeroVideoSources } from './hero-products';
import { HERO_ROOMS } from './hero-rooms';
import type { HeroProductId } from './hero-product-state';
import type { PilotHeroRoomId } from './hero-room-state';

const ACTIVE_RESOURCE_TIMEOUT_MS = 15_000;
const ROOM_PREPARATION_TIMEOUT_MS = 45_000;

export type HeroPreparationMode = 'animated' | 'static';
export type HeroVideoDirection = 'forward' | 'reverse';
export type HeroVideoEntryId = Readonly<{
  productId: HeroProductId;
  direction: HeroVideoDirection;
}>;
export type HeroPreparationFailure = Error & {
  room: PilotHeroRoomId;
  resource: 'poster' | 'focus' | 'video' | 'registration';
};
export type HeroPreparedVideo = Readonly<{
  entry: HeroVideoEntryId;
  format: 'webm' | 'mp4';
  blob: Blob;
  objectUrl: string;
  element: HTMLVideoElement;
  mediaReady: boolean;
}>;
export type HeroPreparedRoom = Readonly<{
  room: PilotHeroRoomId;
  mode: HeroPreparationMode;
  poster: HTMLImageElement;
  focus: ReadonlyMap<HeroProductId, HTMLImageElement>;
  videos: ReadonlyMap<string, HeroPreparedVideo>;
}>;
export type HeroRoomMediaCache = {
  setHost(host: HTMLDivElement | null): void;
  setPoster(room: PilotHeroRoomId, image: HTMLImageElement | null): void;
  get(room: PilotHeroRoomId, mode: HeroPreparationMode): HeroPreparedRoom | null;
  getUnreadyVideo(room: PilotHeroRoomId): HeroVideoEntryId | null;
  prepare(
    room: PilotHeroRoomId,
    mode: HeroPreparationMode,
    operationId: number,
    signal: AbortSignal,
  ): Promise<HeroPreparedRoom>;
  invalidateVideoMedia(room: PilotHeroRoomId, product: HeroProductId, direction: HeroVideoDirection): void;
  disposeVideoResource(room: PilotHeroRoomId, product: HeroProductId, direction: HeroVideoDirection): void;
  dispose(): void;
};

type VideoRecord = HeroPreparedVideo & {
  sourceGeneration: number;
  assignedSource: string;
  metadataGeneration: number;
  firstFrameGeneration: number;
};

type RoomRecord = {
  poster: HTMLImageElement | null;
  posterReady: boolean;
  focus: Map<HeroProductId, HTMLImageElement>;
  focusReady: Set<HeroProductId>;
  videos: Map<string, VideoRecord>;
  bundles: Partial<Record<HeroPreparationMode, HeroPreparedRoom>>;
  attempt: Attempt | null;
  latestOperationId: number;
};

type Attempt = {
  room: PilotHeroRoomId;
  mode: HeroPreparationMode;
  operationId: number;
  controller: AbortController;
  signal: AbortSignal;
  activeResource: HeroPreparationFailure['resource'];
  deadlineFailure: HeroPreparationFailure | null;
  createdFocus: Map<HeroProductId, HTMLImageElement>;
  createdVideos: Map<string, VideoRecord>;
  promise: Promise<HeroPreparedRoom>;
};

type SelectedSource = Readonly<{ format: 'webm' | 'mp4'; src: string }>;

const directions: readonly HeroVideoDirection[] = ['forward', 'reverse'];

function keyOf(productId: HeroProductId, direction: HeroVideoDirection) {
  return `${productId}:${direction}`;
}

function createAbortError() {
  return new DOMException('The operation was aborted', 'AbortError');
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === 'AbortError';
}

function createPreparationFailure(
  room: PilotHeroRoomId,
  resource: HeroPreparationFailure['resource'],
  message: string,
  cause?: unknown,
): HeroPreparationFailure {
  const error = new Error(message) as HeroPreparationFailure;
  error.name = 'HeroPreparationFailure';
  error.room = room;
  error.resource = resource;
  if (cause !== undefined) error.cause = cause;
  return error;
}

function isCompleteImage(image: HTMLImageElement | undefined) {
  return Boolean(image?.complete && image.naturalWidth > 0 && image.naturalHeight > 0);
}

function hasRetainedVideoSource(video: VideoRecord | undefined) {
  return Boolean(
    video?.blob &&
    video.objectUrl &&
    video.element &&
    !video.element.error &&
    video.element.getAttribute('src') === video.objectUrl &&
    video.assignedSource === video.objectUrl,
  );
}

function isRetainedVideo(video: VideoRecord | undefined) {
  return Boolean(
    hasRetainedVideoSource(video) &&
    video?.mediaReady &&
    video.metadataGeneration === video.sourceGeneration &&
    video.firstFrameGeneration === video.sourceGeneration,
  );
}

function isVideoComplete(video: VideoRecord | undefined) {
  if (!isRetainedVideo(video) || !video) return false;
  return isHeroVideoMediaReady(video.element, video.metadataGeneration === video.sourceGeneration);
}

function appendToHost(host: HTMLDivElement, element: HTMLElement) {
  // Preparation attaches native nodes before React receives the ready bundle.
  // Apply the hidden base style before insertion, not in a later render effect.
  element.classList.add('furni-hero-product-media__asset');
  if (element.parentElement !== host) host.appendChild(element);
}

function detachVideo(video: HTMLVideoElement, reload = true) {
  video.pause();
  video.removeAttribute('src');
  if (reload) video.load();
}

function removeVideoElement(video: HTMLVideoElement, reload = true) {
  detachVideo(video, reload);
  video.remove();
}

function getRoomRecord(rooms: Map<PilotHeroRoomId, RoomRecord>, room: PilotHeroRoomId) {
  let record = rooms.get(room);
  if (!record) {
    record = {
      poster: null,
      posterReady: false,
      focus: new Map(),
      focusReady: new Set(),
      videos: new Map(),
      bundles: {},
      attempt: null,
      latestOperationId: 0,
    };
    rooms.set(room, record);
  }
  return record;
}

function allEntries(room: PilotHeroRoomId): HeroVideoEntryId[] {
  return HERO_ROOMS[room].productIds.flatMap((productId) => directions.map((direction) => ({ productId, direction })));
}

export function isHeroVideoMediaReady(video: HTMLVideoElement, metadataSeen: boolean): boolean {
  return (
    metadataSeen &&
    video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
    Number.isFinite(video.duration) &&
    video.duration > 0
  );
}

export function createHeroRoomMediaCache(
  selectSource: (
    sources: HeroVideoSources,
    canPlayType: (mime: string) => string,
  ) => Readonly<{ format: 'webm' | 'mp4'; src: string }>,
): HeroRoomMediaCache {
  const rooms = new Map<PilotHeroRoomId, RoomRecord>();
  const waiters = new Set<() => void>();
  let host: HTMLDivElement | null = null;
  let disposed = false;

  const notify = () => {
    for (const waiter of [...waiters]) waiter();
  };

  const awaitCondition = (attempt: Attempt, condition: () => boolean) => {
    if (condition()) return Promise.resolve();
    if (attempt.signal.aborted) return Promise.reject(createAbortError());
    return new Promise<void>((resolve, reject) => {
      const check = () => {
        if (condition()) {
          cleanup();
          resolve();
        }
      };
      const abort = () => {
        cleanup();
        reject(createAbortError());
      };
      const cleanup = () => {
        waiters.delete(check);
        attempt.signal.removeEventListener('abort', abort);
      };
      waiters.add(check);
      attempt.signal.addEventListener('abort', abort, { once: true });
      check();
    });
  };

  const assertAttemptActive = (attempt: Attempt) => {
    if (attempt.signal.aborted) throw createAbortError();
  };

  const assertAttemptCurrent = (attempt: Attempt, record: RoomRecord) => {
    if (
      disposed ||
      attempt.signal.aborted ||
      record.attempt !== attempt ||
      record.latestOperationId !== attempt.operationId
    ) {
      throw createAbortError();
    }
  };

  const runActive = async <T>(
    attempt: Attempt,
    resource: HeroPreparationFailure['resource'],
    task: (signal: AbortSignal) => Promise<T>,
  ) => {
    attempt.activeResource = resource;
    const controller = new AbortController();
    let timedOut = false;
    const forwardAbort = () => controller.abort();
    attempt.signal.addEventListener('abort', forwardAbort, { once: true });
    let rejectAborted!: (error: unknown) => void;
    const aborted = new Promise<never>((_, reject) => {
      rejectAborted = reject;
    });
    const onAttemptAbort = () => rejectAborted(createAbortError());
    attempt.signal.addEventListener('abort', onAttemptAbort, { once: true });
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        timedOut = true;
        controller.abort();
        reject(createPreparationFailure(attempt.room, resource, `${resource} resource deadline exceeded`));
      }, ACTIVE_RESOURCE_TIMEOUT_MS);
    });
    try {
      return await Promise.race([task(controller.signal), timeout, aborted]);
    } catch (error) {
      if (attempt.deadlineFailure) throw attempt.deadlineFailure;
      assertAttemptActive(attempt);
      if (timedOut) throw error;
      if (error instanceof Error && error.name === 'HeroPreparationFailure') throw error;
      throw createPreparationFailure(attempt.room, resource, `${resource} preparation failed`, error);
    } finally {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
      attempt.signal.removeEventListener('abort', forwardAbort);
      attempt.signal.removeEventListener('abort', onAttemptAbort);
    }
  };

  const decodeImage = async (attempt: Attempt, image: HTMLImageElement, resource: 'poster' | 'focus') => {
    await runActive(attempt, resource, async (signal) => {
      if (typeof image.decode === 'function') {
        await image.decode();
      } else if (!isCompleteImage(image)) {
        await new Promise<void>((resolve, reject) => {
          const cleanup = () => {
            image.removeEventListener('load', onLoad);
            image.removeEventListener('error', onError);
            signal.removeEventListener('abort', onAbort);
          };
          const onLoad = () => {
            cleanup();
            resolve();
          };
          const onError = () => {
            cleanup();
            reject(new Error('Hero image load failed'));
          };
          const onAbort = () => {
            cleanup();
            reject(createAbortError());
          };
          image.addEventListener('load', onLoad);
          image.addEventListener('error', onError);
          signal.addEventListener('abort', onAbort, { once: true });
          if (isCompleteImage(image)) onLoad();
        });
      }
      if (signal.aborted) throw createAbortError();
      if (!isCompleteImage(image)) {
        throw createPreparationFailure(attempt.room, resource, 'Hero image is not decoded');
      }
    });
  };

  const waitForPostPosterFrame = (attempt: Attempt) =>
    new Promise<void>((resolve, reject) => {
      let settled = false;
      let frameId: number | undefined;
      let fallbackId: ReturnType<typeof setTimeout> | undefined;
      const cleanup = () => {
        if (frameId !== undefined && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(frameId);
        if (fallbackId !== undefined) clearTimeout(fallbackId);
        attempt.signal.removeEventListener('abort', onAbort);
      };
      const finish = () => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve();
      };
      const onAbort = () => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(createAbortError());
      };
      attempt.signal.addEventListener('abort', onAbort, { once: true });
      if (typeof requestAnimationFrame === 'function') frameId = requestAnimationFrame(finish);
      if (!settled) fallbackId = setTimeout(finish, 100);
    });

  const fetchBlob = async (attempt: Attempt, src: string) =>
    runActive(attempt, 'video', async (signal) => {
      const response = await fetch(src, { signal });
      if (signal.aborted) throw createAbortError();
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      if (signal.aborted) throw createAbortError();
      if (blob.size === 0) throw new Error('Empty video Blob');
      return blob;
    });

  const bindVideo = async (
    attempt: Attempt,
    entry: HeroVideoEntryId,
    selected: SelectedSource,
    retained: VideoRecord | null,
  ): Promise<VideoRecord> => {
    let video = retained?.element ?? null;
    let objectUrl = retained?.objectUrl ?? '';
    let blob = retained?.blob;
    const generation = (retained?.sourceGeneration ?? 0) + 1;
    const isRetained = Boolean(retained);

    if (!blob) {
      blob = await fetchBlob(attempt, selected.src);
      assertAttemptActive(attempt);
      objectUrl = URL.createObjectURL(blob);
    }

    video ??= document.createElement('video');

    if (!host) {
      if (!isRetained && objectUrl) URL.revokeObjectURL(objectUrl);
      throw createPreparationFailure(attempt.room, 'registration', 'Hero media host is not registered');
    }

    appendToHost(host, video);
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.setAttribute('aria-hidden', 'true');

    let mediaReady: boolean;
    let metadataGeneration = 0;
    let firstFrameGeneration = 0;
    try {
      mediaReady = await runActive(attempt, 'video', async (signal) => {
        let metadataSeen = false;
        let firstFrameSeen = false;
        let settled = false;
        let resolveReady!: (value: boolean) => void;
        let rejectReady!: (error: unknown) => void;
        const ready = new Promise<boolean>((resolve, reject) => {
          resolveReady = resolve;
          rejectReady = reject;
        });
        const cleanup = () => {
          video.removeEventListener('loadedmetadata', onMetadata);
          video.removeEventListener('loadeddata', onData);
          video.removeEventListener('error', onError);
          signal.removeEventListener('abort', onAbort);
        };
        const settle = (callback: () => void) => {
          if (settled) return;
          settled = true;
          cleanup();
          callback();
        };
        const isCurrentSource = () => video.getAttribute('src') === objectUrl;
        const checkReady = () => {
          if (isCurrentSource() && firstFrameSeen && isHeroVideoMediaReady(video, metadataSeen)) {
            settle(() => resolveReady(true));
          }
        };
        const onMetadata = () => {
          if (!isCurrentSource()) return;
          metadataSeen = true;
          checkReady();
        };
        const onData = () => {
          if (!isCurrentSource()) return;
          firstFrameSeen = true;
          checkReady();
        };
        const onError = () => settle(() => rejectReady(new Error('Hero video media error')));
        const onAbort = () => settle(() => rejectReady(createAbortError()));

        video.addEventListener('loadedmetadata', onMetadata);
        video.addEventListener('loadeddata', onData);
        video.addEventListener('error', onError);
        signal.addEventListener('abort', onAbort, { once: true });
        if (attempt.signal.aborted) throw createAbortError();
        video.setAttribute('src', objectUrl);
        video.load();
        const result = await ready;
        metadataGeneration = generation;
        firstFrameGeneration = generation;
        return result;
      });
      assertAttemptActive(attempt);
      if (!mediaReady) throw new Error('Hero video media is not ready');
    } catch (error) {
      if (retained) {
        detachVideo(retained.element);
      } else {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        removeVideoElement(video, false);
      }
      throw error;
    }

    return {
      entry,
      format: selected.format,
      blob,
      objectUrl,
      element: video,
      mediaReady: true,
      sourceGeneration: generation,
      assignedSource: objectUrl,
      metadataGeneration,
      firstFrameGeneration,
    };
  };

  const disposeVideoRecord = (video: VideoRecord) => {
    if (video.objectUrl) URL.revokeObjectURL(video.objectUrl);
    removeVideoElement(video.element);
  };

  const disposeUncommittedVideo = (record: RoomRecord, key: string, expected?: VideoRecord) => {
    const video = record.videos.get(key);
    if (!video || (expected && video !== expected)) return;
    disposeVideoRecord(video);
    record.videos.delete(key);
  };

  const prepareVideo = async (attempt: Attempt, record: RoomRecord, entry: HeroVideoEntryId) => {
    const key = keyOf(entry.productId, entry.direction);
    const product = HERO_PRODUCTS[entry.productId];
    const sources = product[entry.direction];
    let retained = record.videos.get(key) ?? null;
    if (retained && isVideoComplete(retained)) return retained;
    if (retained && (!retained.blob || !retained.objectUrl || !retained.element)) {
      disposeUncommittedVideo(record, key);
      retained = null;
    }

    const committedMediaRepair = Boolean(retained?.blob && retained?.objectUrl && retained?.element);
    let selected = retained
      ? { format: retained.format, src: retained.objectUrl }
      : selectSource(sources, (mime) => {
          try {
            return (retained?.element ?? document.createElement('video')).canPlayType(mime);
          } catch {
            return '';
          }
        });
    let fallbackAttempted = false;
    while (true) {
      try {
        const prepared = await bindVideo(attempt, entry, selected, retained);
        if (!committedMediaRepair) attempt.createdVideos.set(key, prepared);
        try {
          assertAttemptCurrent(attempt, record);
          record.videos.set(key, prepared);
        } catch (error) {
          if (!committedMediaRepair) {
            disposeVideoRecord(prepared);
            attempt.createdVideos.delete(key);
          }
          throw error;
        }
        return prepared;
      } catch (error) {
        if (isAbortError(error) || attempt.signal.aborted) throw error;
        if (committedMediaRepair && retained) {
          if (record.videos.get(key) === retained) {
            record.videos.set(key, {
              ...retained,
              mediaReady: false,
              sourceGeneration: retained.sourceGeneration + 1,
              metadataGeneration: 0,
              firstFrameGeneration: 0,
            });
            delete record.bundles.animated;
          }
          throw createPreparationFailure(attempt.room, 'video', 'Hero video media repair failed', error);
        }
        if (record.videos.has(key)) {
          disposeUncommittedVideo(record, key);
        }
        if (selected.format === 'webm' && !fallbackAttempted && sources.mp4 && sources.mp4 !== selected.src) {
          fallbackAttempted = true;
          if (retained) disposeUncommittedVideo(record, key);
          retained = null;
          selected = { format: 'mp4', src: sources.mp4 };
          continue;
        }
        throw createPreparationFailure(attempt.room, 'video', 'Hero video could not become media-ready', error);
      }
    }
  };

  const makeBundle = (room: PilotHeroRoomId, mode: HeroPreparationMode, record: RoomRecord) => {
    const focus = new Map(record.focus);
    const videos = mode === 'animated' ? new Map<string, HeroPreparedVideo>(record.videos) : new Map();
    const bundle: HeroPreparedRoom = { room, mode, poster: record.poster!, focus, videos };
    record.bundles[mode] = bundle;
    return bundle;
  };

  const isReady = (room: PilotHeroRoomId, mode: HeroPreparationMode, record: RoomRecord) => {
    if (!record.poster || !record.posterReady || !isCompleteImage(record.poster)) return false;
    if (
      HERO_ROOMS[room].productIds.some(
        (productId) => !record.focusReady.has(productId) || !isCompleteImage(record.focus.get(productId)),
      )
    )
      return false;
    if (
      mode === 'animated' &&
      allEntries(room).some((entry) => !isRetainedVideo(record.videos.get(keyOf(entry.productId, entry.direction))))
    ) {
      return false;
    }
    return true;
  };

  const prepare = async (
    room: PilotHeroRoomId,
    mode: HeroPreparationMode,
    operationId: number,
    signal: AbortSignal,
  ): Promise<HeroPreparedRoom> => {
    const record = getRoomRecord(rooms, room);
    if (disposed || operationId < record.latestOperationId) throw createAbortError();
    const existing = get(room, mode);
    if (existing) return existing;
    if (signal.aborted) throw createAbortError();
    if (record.attempt) {
      if (record.attempt.operationId === operationId && record.attempt.mode === mode) return record.attempt.promise;
      if (operationId > record.latestOperationId) record.latestOperationId = operationId;
      const previous = record.attempt;
      previous.controller.abort();
      try {
        await previous.promise;
      } catch {
        // Stale attempts are intentionally discarded before replacement starts.
      }
      if (disposed || signal.aborted || operationId < record.latestOperationId) throw createAbortError();
    }

    record.latestOperationId = Math.max(record.latestOperationId, operationId);

    const controller = new AbortController();
    const attempt: Attempt = {
      room,
      mode,
      operationId,
      controller,
      signal: controller.signal,
      activeResource: 'registration' as HeroPreparationFailure['resource'],
      deadlineFailure: null,
      createdFocus: new Map<HeroProductId, HTMLImageElement>(),
      createdVideos: new Map<string, VideoRecord>(),
      promise: Promise.resolve(null as unknown as HeroPreparedRoom),
    } satisfies Attempt;
    const abortExternal = () => controller.abort();
    signal.addEventListener('abort', abortExternal, { once: true });
    const roomDeadline = setTimeout(() => {
      attempt.deadlineFailure = createPreparationFailure(
        room,
        attempt.activeResource,
        'Hero room preparation deadline exceeded',
      );
      controller.abort();
    }, ROOM_PREPARATION_TIMEOUT_MS);

    const run = async () => {
      try {
        await awaitCondition(attempt, () => Boolean(host));
        await awaitCondition(attempt, () => Boolean(record.poster));
        assertAttemptCurrent(attempt, record);
        const poster = record.poster!;
        attempt.activeResource = 'poster';
        await decodeImage(attempt, poster, 'poster');
        assertAttemptCurrent(attempt, record);
        record.posterReady = true;
        await waitForPostPosterFrame(attempt);
        assertAttemptCurrent(attempt, record);

        for (const productId of HERO_ROOMS[room].productIds) {
          if (!record.focus.has(productId)) {
            if (!host) throw createPreparationFailure(room, 'registration', 'Hero media host is not registered');
            const image = document.createElement('img');
            image.alt = '';
            image.setAttribute('aria-hidden', 'true');
            image.src = HERO_PRODUCTS[productId].focusSrc;
            appendToHost(host, image);
            record.focus.set(productId, image);
            attempt.createdFocus.set(productId, image);
          }
          attempt.activeResource = 'focus';
          await decodeImage(attempt, record.focus.get(productId)!, 'focus');
          assertAttemptCurrent(attempt, record);
          record.focusReady.add(productId);
        }

        if (mode === 'animated') {
          for (const entry of allEntries(room)) await prepareVideo(attempt, record, entry);
        }
        assertAttemptCurrent(attempt, record);
        if (!isReady(room, mode, record))
          throw createPreparationFailure(room, 'registration', 'Hero room resources are incomplete');
        return makeBundle(room, mode, record);
      } catch (error) {
        const preserveStatic = attempt.activeResource === 'video' && isReady(room, 'static', record);
        if (!preserveStatic) {
          for (const [productId, image] of attempt.createdFocus) {
            if (record.focus.get(productId) !== image) continue;
            image.remove();
            record.focus.delete(productId);
            record.focusReady.delete(productId);
          }
        } else {
          makeBundle(room, 'static', record);
        }
        for (const [key, video] of attempt.createdVideos) disposeUncommittedVideo(record, key, video);
        if (attempt.deadlineFailure) throw attempt.deadlineFailure;
        if (attempt.signal.aborted || isAbortError(error)) throw createAbortError();
        if (error instanceof Error && error.name === 'HeroPreparationFailure') throw error;
        throw createPreparationFailure(room, attempt.activeResource, 'Hero room preparation failed', error);
      } finally {
        clearTimeout(roomDeadline);
        signal.removeEventListener('abort', abortExternal);
        if (record.attempt === attempt) record.attempt = null;
      }
    };

    attempt.promise = run();
    record.attempt = attempt;
    return attempt.promise;
  };

  const get = (room: PilotHeroRoomId, mode: HeroPreparationMode) => {
    const record = rooms.get(room);
    if (!record || !isReady(room, mode, record)) return null;
    return record.bundles[mode] ?? makeBundle(room, mode, record);
  };

  const invalidateVideoMedia = (room: PilotHeroRoomId, productId: HeroProductId, direction: HeroVideoDirection) => {
    const record = rooms.get(room);
    const key = keyOf(productId, direction);
    const video = record?.videos.get(key);
    if (!record || !video) return;
    detachVideo(video.element);
    record.videos.set(key, { ...video, mediaReady: false, sourceGeneration: video.sourceGeneration + 1 });
    delete record.bundles.animated;
  };

  const disposeVideoResource = (room: PilotHeroRoomId, productId: HeroProductId, direction: HeroVideoDirection) => {
    const record = rooms.get(room);
    const key = keyOf(productId, direction);
    const video = record?.videos.get(key);
    if (!record || !video) return;
    disposeVideoRecord(video);
    record.videos.delete(key);
    delete record.bundles.animated;
  };

  const setHost = (nextHost: HTMLDivElement | null) => {
    if (disposed) return;
    host = nextHost;
    if (host) {
      for (const record of rooms.values()) {
        for (const image of record.focus.values()) appendToHost(host, image);
        for (const video of record.videos.values()) appendToHost(host, video.element);
      }
    }
    notify();
  };

  const setPoster = (room: PilotHeroRoomId, image: HTMLImageElement | null) => {
    if (disposed) return;
    const record = getRoomRecord(rooms, room);
    record.poster = image;
    record.posterReady = false;
    delete record.bundles.static;
    delete record.bundles.animated;
    notify();
  };

  const getUnreadyVideo = (room: PilotHeroRoomId) => {
    const record = rooms.get(room);
    for (const entry of allEntries(room)) {
      if (!isRetainedVideo(record?.videos.get(keyOf(entry.productId, entry.direction)))) return entry;
    }
    return null;
  };

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    for (const record of rooms.values()) {
      record.attempt?.controller.abort();
      for (const video of record.videos.values()) {
        disposeVideoRecord(video);
      }
      for (const image of record.focus.values()) image.remove();
    }
    rooms.clear();
    waiters.clear();
    host = null;
  };

  return { setHost, setPoster, get, getUnreadyVideo, prepare, invalidateVideoMedia, disposeVideoResource, dispose };
}
