import { useEffect, useRef } from 'react';
import { getHeroProduct, type HeroPhase } from './hero-product-state';
import { HERO_PRODUCTS, type HeroVideoSources } from './hero-products';
import {
  isHeroVideoMediaReady,
  type HeroPreparedRoom,
  type HeroRoomMediaCache,
  type HeroVideoEntryId,
  type HeroVideoDirection,
} from './hero-room-preload';
import type { PilotHeroRoomId } from './hero-room-state';

type HeroProductTransition = {
  direction: HeroVideoDirection;
  productId: NonNullable<ReturnType<typeof getHeroProduct>>;
  sources: HeroVideoSources;
};

export type HeroVideoFormat = 'webm' | 'mp4';
export type SelectedHeroVideoSource = Readonly<{ format: HeroVideoFormat; src: string }>;

export type HeroPlaybackUnavailable = Readonly<{
  room: PilotHeroRoomId;
  entry: HeroVideoEntryId;
  failedPhase: HeroPhase;
  stage: 'before-activation' | 'playback-entry';
  roomOperationId: number;
  playbackGeneration: number;
}>;

type HeroProductMediaProps = {
  cache: HeroRoomMediaCache;
  room: PilotHeroRoomId;
  roomOperationId: number;
  playbackGeneration: number;
  phase: HeroPhase;
  reducedMotion: boolean;
  preparationPending?: boolean;
  onProgress: (currentTime: number, duration: number) => void;
  onForwardComplete: () => void;
  onReverseComplete: () => void;
  onPlaybackUnavailable: (failure: HeroPlaybackUnavailable) => void;
};

export function selectHeroVideoSource(
  sources: HeroVideoSources,
  canPlayType: (mime: string) => string,
): SelectedHeroVideoSource {
  return sources.webm && canPlayType('video/webm; codecs="vp9"') !== ''
    ? { format: 'webm', src: sources.webm }
    : { format: 'mp4', src: sources.mp4 };
}

function getActiveTransition(phase: HeroPhase): HeroProductTransition | null {
  if (phase.startsWith('entering-')) {
    const productId = getHeroProduct(phase);
    return productId ? { direction: 'forward', productId, sources: HERO_PRODUCTS[productId].forward } : null;
  }
  if (phase.startsWith('returning-')) {
    const productId = getHeroProduct(phase);
    return productId ? { direction: 'reverse', productId, sources: HERO_PRODUCTS[productId].reverse } : null;
  }
  return null;
}

function entryKey(entry: HeroVideoEntryId) {
  return `${entry.productId}:${entry.direction}`;
}

function isPreparedEntry(bundle: HeroPreparedRoom | null, entry: HeroVideoEntryId) {
  const prepared = bundle?.videos.get(entryKey(entry));
  return Boolean(
    prepared?.blob &&
    prepared.objectUrl &&
    prepared.element &&
    prepared.element.getAttribute('src') === prepared.objectUrl &&
    prepared.mediaReady &&
    isHeroVideoMediaReady(prepared.element, prepared.mediaReady),
  );
}

function resetVideo(video: HTMLVideoElement) {
  video.pause();
  try {
    video.currentTime = 0;
  } catch {
    // jsdom and an evicted native media binding may reject currentTime writes.
  }
}

function applyMediaClass(element: HTMLElement, productId: string, mediaClassName: string, visible: boolean) {
  element.className = [
    'furni-hero-product-media__asset',
    mediaClassName,
    `is-product-${productId}`,
    visible ? 'is-visible' : '',
  ]
    .filter(Boolean)
    .join(' ');
}

export function HeroProductMedia({
  cache,
  room,
  roomOperationId,
  playbackGeneration,
  phase,
  reducedMotion,
  preparationPending = false,
  onProgress,
  onForwardComplete,
  onReverseComplete,
  onPlaybackUnavailable,
}: HeroProductMediaProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const operationRef = useRef(0);
  const activePlaybackRef = useRef<{ video: HTMLVideoElement; generation: number } | null>(null);
  const activeProductId = getHeroProduct(phase);
  const staticBundle = cache.get(room, 'static');
  const animatedBundle = reducedMotion ? null : cache.get(room, 'animated');

  useEffect(() => {
    cache.setHost(hostRef.current);
    return () => cache.setHost(null);
  }, [cache]);

  useEffect(() => {
    if (!staticBundle && !animatedBundle) return;

    for (const [productId, image] of staticBundle?.focus ?? []) {
      applyMediaClass(image, productId, HERO_PRODUCTS[productId].mediaClassName, false);
    }
    for (const prepared of animatedBundle?.videos.values() ?? []) {
      applyMediaClass(
        prepared.element,
        prepared.entry.productId,
        HERO_PRODUCTS[prepared.entry.productId].mediaClassName,
        false,
      );
      prepared.element.setAttribute('aria-hidden', 'true');
      prepared.element.dataset.heroDirection = prepared.entry.direction;
    }

    if (activeProductId) {
      const focus = staticBundle?.focus.get(activeProductId);
      const focusVisible = phase === activeProductId || phase.startsWith('returning-') || reducedMotion;
      if (focus) applyMediaClass(focus, activeProductId, HERO_PRODUCTS[activeProductId].mediaClassName, focusVisible);
    }

    return () => {
      for (const prepared of animatedBundle?.videos.values() ?? []) resetVideo(prepared.element);
    };
  }, [activeProductId, animatedBundle, phase, reducedMotion, staticBundle]);

  useEffect(() => {
    operationRef.current += 1;
    const operationId = operationRef.current;
    const activeTransition = reducedMotion ? null : getActiveTransition(phase);
    if (!activeTransition) {
      activePlaybackRef.current = null;
      return;
    }

    const entry: HeroVideoEntryId = {
      productId: activeTransition.productId,
      direction: activeTransition.direction,
    };
    const bundle = cache.get(room, 'animated');
    const prepared = bundle?.videos.get(entryKey(entry));
    const isCurrent = () => operationRef.current === operationId;
    let cleanupPlayback: () => void = () => undefined;
    const fail = (failedEntry: HeroVideoEntryId = entry) => {
      if (!isCurrent()) return;
      cleanupPlayback();
      onPlaybackUnavailable({
        room,
        entry: failedEntry,
        failedPhase: phase,
        stage: 'playback-entry',
        roomOperationId,
        playbackGeneration,
      });
    };

    if (!bundle || !prepared || !isPreparedEntry(bundle, entry)) {
      if (preparationPending) return;
      queueMicrotask(() => {
        if (isCurrent()) fail(cache.getUnreadyVideo(room) ?? entry);
      });
      return () => {
        if (isCurrent()) operationRef.current += 1;
      };
    }

    const video = prepared.element;
    const product = HERO_PRODUCTS[activeTransition.productId];
    let startupTimer: number | undefined;
    let completionTimer: number | undefined;
    let listenersBound = false;
    let settled = false;

    const clearTimers = () => {
      if (startupTimer !== undefined) window.clearTimeout(startupTimer);
      if (completionTimer !== undefined) window.clearTimeout(completionTimer);
      startupTimer = undefined;
      completionTimer = undefined;
    };
    const removeListeners = () => {
      if (!listenersBound) return;
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('error', onError);
      listenersBound = false;
    };
    function cleanup() {
      clearTimers();
      removeListeners();
      resetVideo(video);
      video.classList.remove('is-visible');
      activePlaybackRef.current = null;
    }
    cleanupPlayback = cleanup;
    const complete = () => {
      if (!isCurrent() || settled) return;
      settled = true;
      cleanup();
      if (activeTransition.direction === 'forward') onForwardComplete();
      else onReverseComplete();
    };
    const onPlaying = () => {
      if (!isCurrent() || settled || video.getAttribute('src') !== prepared.objectUrl) return;
      clearTimers();
      video.classList.add('is-visible');
      const focus = bundle.focus.get(activeTransition.productId);
      if (focus) focus.classList.remove('is-visible');
      const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
      const durationBound = 5_000 + Math.ceil((duration / product.playbackRate) * 1_000) + 2_000;
      completionTimer = window.setTimeout(fail, durationBound);
    };
    const onTimeUpdate = () => {
      if (isCurrent() && activeTransition.direction === 'forward') onProgress(video.currentTime, video.duration);
    };
    const onEnded = () => complete();
    const onError = () => fail();

    const currentBundle = cache.get(room, 'animated');
    if (!currentBundle || !isPreparedEntry(currentBundle, entry)) {
      if (preparationPending) return;
      queueMicrotask(() => fail(cache.getUnreadyVideo(room) ?? entry));
      return () => {
        cleanup();
        if (isCurrent()) operationRef.current += 1;
      };
    }

    activePlaybackRef.current = { video, generation: playbackGeneration };
    video.classList.remove('is-visible');
    resetVideo(video);
    video.playbackRate = product.playbackRate;
    video.addEventListener('playing', onPlaying);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('ended', onEnded);
    video.addEventListener('error', onError);
    listenersBound = true;
    startupTimer = window.setTimeout(fail, 5_000);
    void video.play().catch(fail);

    return () => {
      cleanup();
      if (isCurrent()) operationRef.current += 1;
    };
  }, [
    cache,
    onForwardComplete,
    onPlaybackUnavailable,
    onProgress,
    onReverseComplete,
    phase,
    preparationPending,
    playbackGeneration,
    reducedMotion,
    room,
    roomOperationId,
  ]);

  useEffect(() => {
    if (!reducedMotion || !activeProductId || (!phase.startsWith('entering-') && !phase.startsWith('returning-')))
      return;
    const bundle = cache.get(room, 'static');
    if (!bundle?.focus.has(activeProductId)) return;
    const token = playbackGeneration;
    const operationId = operationRef.current;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled || token !== playbackGeneration || operationRef.current !== operationId) return;
      if (phase.startsWith('entering-')) onForwardComplete();
      else onReverseComplete();
    });
    return () => {
      cancelled = true;
    };
  }, [activeProductId, cache, onForwardComplete, onReverseComplete, phase, playbackGeneration, reducedMotion, room]);

  return <div ref={hostRef} className="furni-hero-product-media" aria-hidden="true" />;
}
