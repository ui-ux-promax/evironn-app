import { useEffect, useRef, useState } from 'react';
import { getHeroProduct, HERO_PRODUCT_IDS, type HeroPhase } from './hero-product-state';
import { HERO_PRODUCTS } from './hero-products';

type Direction = 'forward' | 'reverse';
type VideoKey = string;
type VisibleLayer = string | null;

type HeroProductMediaProps = {
  phase: HeroPhase;
  reducedMotion: boolean;
  onProgress: (currentTime: number, duration: number) => void;
  onForwardComplete: () => void;
  onReverseComplete: () => void;
  onFailure: (failedPhase: HeroPhase) => void;
};

export function HeroProductMedia({
  phase,
  reducedMotion,
  onProgress,
  onForwardComplete,
  onReverseComplete,
  onFailure,
}: HeroProductMediaProps) {
  const [visibleLayer, setVisibleLayer] = useState<VisibleLayer>(null);
  const videoRefs = useRef<Partial<Record<VideoKey, HTMLVideoElement>>>({});
  const operation = useRef(0);

  useEffect(() => {
    const productId = getHeroProduct(phase);
    if (!productId) {
      operation.current += 1;
      Object.values(videoRefs.current).forEach((video) => video?.pause());
      setVisibleLayer(null);
      return;
    }
    const product = HERO_PRODUCTS[productId];

    const entering = phase === `entering-${productId}`;
    const returning = phase === `returning-${productId}`;
    if (!entering && !returning) return;

    if (reducedMotion) {
      setVisibleLayer(entering ? `${productId}-focus` : null);
      queueMicrotask(entering ? onForwardComplete : onReverseComplete);
      return;
    }

    const direction: Direction = entering ? 'forward' : 'reverse';
    const key: VideoKey = `${productId}-${direction}`;
    const video = videoRefs.current[key];
    if (!video) {
      onFailure(phase);
      return;
    }

    operation.current += 1;
    const currentOperation = operation.current;
    video.pause();
    video.currentTime = 0;

    const fail = () => {
      if (operation.current !== currentOperation) return;
      setVisibleLayer(entering ? null : `${productId}-focus`);
      onFailure(phase);
    };

    const revealAndPlay = () => {
      if (operation.current !== currentOperation) return;
      setVisibleLayer(key);
      video.playbackRate = product.playbackRate;
      void video.play().catch(fail);
    };

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      revealAndPlay();
    } else {
      video.addEventListener('loadeddata', revealAndPlay, { once: true });
      video.load();
    }

    return () => video.removeEventListener('loadeddata', revealAndPlay);
  }, [phase, reducedMotion, onFailure, onForwardComplete, onReverseComplete]);

  const activeProduct = getHeroProduct(phase);

  return (
    <div className="furni-hero-product-media" aria-hidden="true">
      {HERO_PRODUCT_IDS.map((id) => {
        const product = HERO_PRODUCTS[id];
        return (
          <img
            key={`${id}-focus`}
            className={[
              'furni-hero-product-media__asset',
              product.mediaClassName,
              `is-product-${id}`,
              visibleLayer === `${id}-focus` ? 'is-visible' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            src={product.focusSrc}
            alt=""
          />
        );
      })}
      {HERO_PRODUCT_IDS.flatMap((id) =>
        (['forward', 'reverse'] as const).map((direction) => {
          const product = HERO_PRODUCTS[id];
          const key: VideoKey = `${id}-${direction}`;
          const activePhase = `${direction === 'forward' ? 'entering' : 'returning'}-${id}`;
          const isActive = phase === activePhase;

          return (
            <video
              key={key}
              ref={(node) => {
                if (node) videoRefs.current[key] = node;
                else delete videoRefs.current[key];
              }}
              className={[
                'furni-hero-product-media__asset',
                product.mediaClassName,
                `is-product-${id}`,
                visibleLayer === key ? 'is-visible' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              src={direction === 'forward' ? product.forwardSrc : product.reverseSrc}
              muted
              playsInline
              preload="auto"
              onTimeUpdate={(event) => {
                if (direction === 'forward' && activeProduct === id) {
                  onProgress(event.currentTarget.currentTime, event.currentTarget.duration);
                }
              }}
              onEnded={() => {
                if (!isActive) return;
                if (direction === 'forward') onForwardComplete();
                else onReverseComplete();
              }}
              onError={() => {
                if (!isActive) return;
                setVisibleLayer(direction === 'forward' ? null : `${id}-focus`);
                onFailure(phase);
              }}
            />
          );
        }),
      )}
    </div>
  );
}
