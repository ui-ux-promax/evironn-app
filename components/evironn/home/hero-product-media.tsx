import { useEffect, useRef, useState } from 'react';
import { getHeroProduct, type HeroPhase } from './hero-product-state';
import { HERO_PRODUCTS } from './hero-products';

type Direction = 'forward' | 'reverse';

type HeroProductTransition = {
  direction: Direction;
  productId: NonNullable<ReturnType<typeof getHeroProduct>>;
  src: string;
};

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
    return productId ? { direction: 'forward', productId, src: HERO_PRODUCTS[productId].forwardSrc } : null;
  }

  if (phase.startsWith('returning-')) {
    const productId = getHeroProduct(phase);
    return productId ? { direction: 'reverse', productId, src: HERO_PRODUCTS[productId].reverseSrc } : null;
  }

  return null;
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
      };
    }

    if (!activeTransition || !video) {
      operation.current += 1;
      setVisibleVideoKey(null);
      if (video) releaseVideo(video);
      return;
    }

    operation.current += 1;
    const currentOperation = operation.current;
    const product = HERO_PRODUCTS[activeTransition.productId];
    const isCurrentOperation = () => operation.current === currentOperation;
    let playbackStarted = false;

    video.pause();
    video.currentTime = 0;

    const fail = () => {
      if (!isCurrentOperation()) return;
      operation.current += 1;
      setVisibleVideoKey(null);
      releaseVideo(video);
      onFailure(phase);
    };

    const revealAndPlay = () => {
      if (!isCurrentOperation() || playbackStarted) return;
      playbackStarted = true;
      setVisibleVideoKey(`${activeTransition.productId}-${activeTransition.direction}`);
      video.playbackRate = product.playbackRate;
      void video.play().catch(fail);
    };

    const handleLoadedData = () => revealAndPlay();
    const handleTimeUpdate = () => {
      if (activeTransition.direction === 'forward' && isCurrentOperation()) {
        onProgress(video.currentTime, video.duration);
      }
    };
    const handleEnded = () => {
      if (!isCurrentOperation()) return;
      operation.current += 1;
      setVisibleVideoKey(null);
      releaseVideo(video);
      if (activeTransition.direction === 'forward') onForwardComplete();
      else onReverseComplete();
    };
    const handleError = () => fail();

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) revealAndPlay();
    else video.load();

    return () => {
      if (isCurrentOperation()) operation.current += 1;
      setVisibleVideoKey(null);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
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
          src={transition.src}
          muted
          playsInline
          preload="auto"
        />
      ) : null}
    </div>
  );
}
