import { useEffect, useRef, useState } from 'react';
import { getHeroProduct, type HeroPhase } from './hero-product-state';
import { HERO_PRODUCTS, type HeroVideoSources } from './hero-products';

type Direction = 'forward' | 'reverse';

type HeroProductTransition = {
  direction: Direction;
  productId: NonNullable<ReturnType<typeof getHeroProduct>>;
  sources: HeroVideoSources;
};

type AttemptHandlers = Readonly<{
  loadeddata: () => void;
  timeupdate: () => void;
  ended: () => void;
  error: () => void;
}>;

export type HeroVideoFormat = 'webm' | 'mp4';
export type SelectedHeroVideoSource = Readonly<{ format: HeroVideoFormat; src: string }>;

export function selectHeroVideoSource(
  sources: HeroVideoSources,
  canPlayType: (mime: string) => string,
): SelectedHeroVideoSource {
  return sources.webm && canPlayType('video/webm; codecs="vp9"') !== ''
    ? { format: 'webm', src: sources.webm }
    : { format: 'mp4', src: sources.mp4 };
}

type HeroProductMediaProps = {
  phase: HeroPhase;
  reducedMotion: boolean;
  onProgress: (currentTime: number, duration: number) => void;
  onForwardComplete: () => void;
  onReverseComplete: () => void;
  onFailure: (failedPhase: HeroPhase) => void;
};

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

function browserCanPlayType(mime: string): string {
  if (typeof document === 'undefined') return '';
  try {
    return document.createElement('video').canPlayType(mime);
  } catch {
    return '';
  }
}

function releaseVideo(video: HTMLVideoElement) {
  video.pause();
  if (!video.getAttribute('src')) return;

  video.removeAttribute('src');
  video.load();
}

export function HeroProductMedia({
  phase,
  reducedMotion,
  onProgress,
  onForwardComplete,
  onReverseComplete,
  onFailure,
}: HeroProductMediaProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const operation = useRef(0);
  const attempt = useRef(0);
  const [visibleVideoKey, setVisibleVideoKey] = useState<string | null>(null);
  const activeProductId = getHeroProduct(phase);
  const transition = reducedMotion ? null : getActiveTransition(phase);
  const transitionKey = transition ? `${transition.productId}-${transition.direction}` : null;
  const showFocusImage =
    activeProductId !== null &&
    (phase === activeProductId ||
      phase === `entering-${activeProductId}` ||
      phase === `returning-${activeProductId}` ||
      (reducedMotion && phase === `entering-${activeProductId}`));
  const focusImageVisible =
    activeProductId !== null &&
    (phase === activeProductId ||
      (phase === `returning-${activeProductId}` && visibleVideoKey !== transitionKey) ||
      (reducedMotion && (phase === `entering-${activeProductId}` || phase === `returning-${activeProductId}`)));

  useEffect(() => {
    const video = videoRef.current;
    const activeTransition = reducedMotion ? null : getActiveTransition(phase);

    if (reducedMotion) {
      operation.current += 1;
      attempt.current += 1;
      const currentOperation = operation.current;
      setVisibleVideoKey(null);
      if (video) releaseVideo(video);
      const complete = phase.startsWith('entering-')
        ? onForwardComplete
        : phase.startsWith('returning-')
          ? onReverseComplete
          : null;
      if (complete)
        queueMicrotask(() => {
          if (operation.current === currentOperation) complete();
        });
      return () => {
        if (operation.current === currentOperation) operation.current += 1;
        attempt.current += 1;
      };
    }

    if (!activeTransition || !video) {
      operation.current += 1;
      attempt.current += 1;
      setVisibleVideoKey(null);
      if (video) releaseVideo(video);
      return;
    }

    operation.current += 1;
    const currentOperation = operation.current;
    const product = HERO_PRODUCTS[activeTransition.productId];
    const isCurrentOperation = () => operation.current === currentOperation;
    let activeHandlers: AttemptHandlers | null = null;
    let fallbackAttempted = false;

    video.pause();
    video.currentTime = 0;

    const removeAttemptHandlers = () => {
      if (!activeHandlers) return;
      video.removeEventListener('loadeddata', activeHandlers.loadeddata);
      video.removeEventListener('timeupdate', activeHandlers.timeupdate);
      video.removeEventListener('ended', activeHandlers.ended);
      video.removeEventListener('error', activeHandlers.error);
      activeHandlers = null;
    };

    const bindAttempt = (selected: SelectedHeroVideoSource) => {
      removeAttemptHandlers();
      attempt.current += 1;
      const currentAttempt = attempt.current;
      const assignedSource = selected.src;
      let playbackStarted = false;
      const isCurrentAttempt = () =>
        operation.current === currentOperation &&
        attempt.current === currentAttempt &&
        video.getAttribute('src') === assignedSource;

      const fail = () => {
        if (!isCurrentAttempt()) return;
        removeAttemptHandlers();
        operation.current += 1;
        attempt.current += 1;
        setVisibleVideoKey(null);
        releaseVideo(video);
        onFailure(phase);
      };

      const loadeddata = () => {
        if (!isCurrentAttempt() || playbackStarted) return;
        playbackStarted = true;
        setVisibleVideoKey(`${activeTransition.productId}-${activeTransition.direction}`);
        video.playbackRate = product.playbackRate;
        void video.play().catch(fail);
      };
      const timeupdate = () => {
        if (isCurrentAttempt() && activeTransition.direction === 'forward') {
          onProgress(video.currentTime, video.duration);
        }
      };
      const ended = () => {
        if (!isCurrentAttempt()) return;
        removeAttemptHandlers();
        operation.current += 1;
        attempt.current += 1;
        setVisibleVideoKey(null);
        releaseVideo(video);
        if (activeTransition.direction === 'forward') onForwardComplete();
        else onReverseComplete();
      };
      const error = () => {
        if (!isCurrentAttempt()) return;
        if (selected.format === 'webm' && !playbackStarted && !fallbackAttempted) {
          fallbackAttempted = true;
          setVisibleVideoKey(null);
          video.pause();
          video.currentTime = 0;
          bindAttempt({ format: 'mp4', src: activeTransition.sources.mp4 });
          return;
        }
        fail();
      };

      activeHandlers = { loadeddata, timeupdate, ended, error };
      video.addEventListener('loadeddata', loadeddata);
      video.addEventListener('timeupdate', timeupdate);
      video.addEventListener('ended', ended);
      video.addEventListener('error', error);
      video.setAttribute('src', assignedSource);
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) loadeddata();
      else video.load();
    };

    bindAttempt(selectHeroVideoSource(activeTransition.sources, browserCanPlayType));

    return () => {
      if (isCurrentOperation()) operation.current += 1;
      attempt.current += 1;
      setVisibleVideoKey(null);
      removeAttemptHandlers();
      releaseVideo(video);
    };
  }, [onFailure, onForwardComplete, onProgress, onReverseComplete, phase, reducedMotion]);

  return (
    <div className="furni-hero-product-media" aria-hidden="true">
      {showFocusImage && activeProductId ? (
        <img
          className={[
            'furni-hero-product-media__asset',
            HERO_PRODUCTS[activeProductId].mediaClassName,
            `is-product-${activeProductId}`,
            focusImageVisible ? 'is-visible' : '',
          ].join(' ')}
          src={HERO_PRODUCTS[activeProductId].focusSrc}
          alt=""
        />
      ) : null}
      {transition ? (
        <video
          ref={videoRef}
          className={[
            'furni-hero-product-media__asset',
            HERO_PRODUCTS[transition.productId].mediaClassName,
            `is-product-${transition.productId}`,
            visibleVideoKey === transitionKey ? 'is-visible' : '',
          ].join(' ')}
          muted
          playsInline
          preload="auto"
        />
      ) : null}
    </div>
  );
}
