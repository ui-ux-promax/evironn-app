import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { SHOWCASE_PRODUCT_PATH } from '@/components/evironn/public-routes';
import { FurnitureCaption } from './furniture-caption';
import {
  CARD_PLAYBACK_RATE,
  getMediaLayerState,
  getReverseStartTime,
  requestMobileActivation,
  type MediaFallbackMode,
  type MobilePlaybackState,
} from './furniture-playback';

type Product = {
  name: string;
  category: string;
  price: string;
  forwardSrc: string;
  reverseSrc: string;
  idleSrc: string;
};

type CardPhase = 'idle' | 'forward' | 'reverse';

const products: Product[] = [
  {
    name: 'Aster Bar Stool',
    category: 'Барные стулья',
    price: '$490',
    forwardSrc: '/assets/products/01-bar-stool-forward.mp4',
    reverseSrc: '/assets/products/01-bar-stool-reverse.mp4',
    idleSrc: '/assets/products/01-bar-stool-idle.webp',
  },
  {
    name: 'Terra Rocking Chair',
    category: 'Кресла для отдыха',
    price: '$890',
    forwardSrc: '/assets/products/02-rocking-chair-forward.mp4',
    reverseSrc: '/assets/products/02-rocking-chair-reverse.mp4',
    idleSrc: '/assets/products/02-rocking-chair-idle.webp',
  },
  {
    name: 'Noma Woven Lounge Chair',
    category: 'Кресла для отдыха',
    price: '$1,240',
    forwardSrc: '/assets/products/03-ivory-lounge-forward.mp4',
    reverseSrc: '/assets/products/03-ivory-lounge-reverse.mp4',
    idleSrc: '/assets/products/03-ivory-lounge-idle.webp',
  },
  {
    name: 'Sora Accent Chair',
    category: 'Акцентные кресла',
    price: '$780',
    forwardSrc: '/assets/products/04-dark-accent-forward.mp4',
    reverseSrc: '/assets/products/04-dark-accent-reverse.mp4',
    idleSrc: '/assets/products/04-dark-accent-idle.webp',
  },
  {
    name: 'Linden Two-Seat Sofa',
    category: 'Гостиная',
    price: '$1,680',
    forwardSrc: '/assets/products/05-two-seat-sofa-forward.mp4',
    reverseSrc: '/assets/products/05-two-seat-sofa-reverse.mp4',
    idleSrc: '/assets/products/05-two-seat-sofa-idle.webp',
  },
];

const finePointerQuery = '(hover: hover) and (pointer: fine)';
const defaultFurnitureHeading = 'Уют, продуманный со всех сторон';

export function InteractiveFurnitureCards({ heading = defaultFurnitureHeading }: { heading?: string }) {
  const headingWords = heading.split(' ');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [videoFrameReady, setVideoFrameReady] = useState(() => products.map(() => false));
  const [fallbackModes, setFallbackModes] = useState<MediaFallbackMode[]>(() => products.map(() => 'idle'));
  const [reducedMotion, setReducedMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const canvasRefs = useRef<Array<HTMLCanvasElement | null>>([]);
  const operationRefs = useRef<number[]>(products.map(() => 0));
  const cardPhases = useRef<CardPhase[]>(products.map(() => 'idle'));
  const mobileState = useRef<MobilePlaybackState>({ activeIndex: null, pendingIndex: null, phase: 'idle' });
  const activeRef = useRef<number | null>(null);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReducedMotion(query.matches);

    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const setActive = (index: number | null) => {
    activeRef.current = index;
    setActiveIndex(index);
  };

  const nextOperation = (index: number) => {
    operationRefs.current[index] += 1;
    return operationRefs.current[index];
  };

  const setFrameReady = (index: number, isReady: boolean) => {
    setVideoFrameReady((current) => current.map((value, currentIndex) => (currentIndex === index ? isReady : value)));
  };

  const freezeCurrentFrame = (index: number) => {
    const video = videoRefs.current[index];
    const canvas = canvasRefs.current[index];
    if (
      !video ||
      !canvas ||
      video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
      !video.videoWidth ||
      !video.videoHeight
    )
      return false;

    const context = canvas.getContext('2d');
    if (!context) return false;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    try {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      return true;
    } catch {
      return false;
    }
  };

  const setMediaLayerVisibility = (
    index: number,
    video: HTMLVideoElement,
    isVideoFrameReady: boolean,
    fallbackMode: MediaFallbackMode,
  ) => {
    const layerState = getMediaLayerState(isVideoFrameReady, fallbackMode);
    const media = video.parentElement;

    video.classList.toggle('is-frame-ready', layerState.showVideo);
    media?.querySelector('img')?.classList.toggle('is-hidden', !layerState.showIdleFrame);
    media?.querySelector('canvas')?.classList.toggle('is-visible', layerState.showFrozenFrame);
    setFallbackModes((current) =>
      current.map((value, currentIndex) => (currentIndex === index ? fallbackMode : value)),
    );
  };

  const loadAt = (
    index: number,
    source: string,
    time: number,
    shouldPlay: boolean,
    onReady?: () => void,
    onEnded?: () => void,
    fallbackMode: MediaFallbackMode = 'idle',
  ) => {
    const video = videoRefs.current[index];
    if (!video) return;

    const operation = nextOperation(index);
    const effectiveFallback = fallbackMode === 'frozen' && freezeCurrentFrame(index) ? 'frozen' : 'idle';
    video.pause();
    setMediaLayerVisibility(index, video, false, effectiveFallback);
    setFrameReady(index, false);

    const onMetadata = () => {
      if (operationRefs.current[index] !== operation) return;
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      let frameRevealed = false;
      const revealFrame = () => {
        if (frameRevealed || operationRefs.current[index] !== operation) return;
        frameRevealed = true;
        setMediaLayerVisibility(index, video, true, effectiveFallback);
        setFrameReady(index, true);
        onReady?.();
        if (shouldPlay) void video.play().catch(() => undefined);
      };

      if (time > 0) {
        video.addEventListener('seeked', revealFrame, { once: true });
      } else {
        video.addEventListener('loadeddata', revealFrame, { once: true });
      }
      video.currentTime = Math.max(0, Math.min(time, duration || 0));
      video.playbackRate = shouldPlay ? CARD_PLAYBACK_RATE : 1;
    };

    video.addEventListener('loadedmetadata', onMetadata, { once: true });
    if (onEnded) {
      video.addEventListener(
        'ended',
        () => {
          if (operationRefs.current[index] === operation) onEnded();
        },
        { once: true },
      );
    }
    video.src = source;
    video.load();
  };

  const restoreIdle = (index: number, onReady?: () => void, resetForwardFrame = false) => {
    cardPhases.current[index] = 'idle';
    if (resetForwardFrame) {
      loadAt(index, products[index].forwardSrc, 0, false, onReady);
      return;
    }
    onReady?.();
  };

  const reverseCard = (index: number) => {
    const video = videoRefs.current[index];
    if (!video || cardPhases.current[index] === 'idle' || cardPhases.current[index] === 'reverse') return;

    const reverseTime = getReverseStartTime(video.currentTime, video.duration, video.duration);
    cardPhases.current[index] = 'reverse';
    if (activeRef.current === index) setActive(null);

    if (reducedMotion) {
      restoreIdle(
        index,
        () => {
          if (mobileState.current.activeIndex !== index) return;
          const pendingIndex = mobileState.current.pendingIndex;
          mobileState.current = { activeIndex: null, pendingIndex: null, phase: 'idle' };
          if (pendingIndex !== null) activateCard(pendingIndex, true);
        },
        true,
      );
      return;
    }

    loadAt(
      index,
      products[index].reverseSrc,
      reverseTime,
      true,
      undefined,
      () => {
        restoreIdle(index, () => {
          if (mobileState.current.activeIndex !== index) return;
          const pendingIndex = mobileState.current.pendingIndex;
          mobileState.current = { activeIndex: null, pendingIndex: null, phase: 'idle' };
          if (pendingIndex !== null) activateCard(pendingIndex, true);
        });
      },
      'frozen',
    );
  };

  const activateCard = (index: number, fromMobile = false) => {
    const previousIndex = activeRef.current;
    if (previousIndex === index && cardPhases.current[index] !== 'reverse') return;

    if (previousIndex !== null && previousIndex !== index) reverseCard(previousIndex);

    cardPhases.current[index] = 'forward';
    setActive(index);
    if (fromMobile) mobileState.current = { activeIndex: index, pendingIndex: null, phase: 'forward' };

    loadAt(index, products[index].forwardSrc, reducedMotion ? Number.MAX_SAFE_INTEGER : 0, !reducedMotion);
  };

  const requestFromTap = (index: number) => {
    if (window.matchMedia(finePointerQuery).matches) return;

    const nextState = requestMobileActivation(mobileState.current, index);
    mobileState.current = nextState;
    if (nextState.phase === 'forward') activateCard(index, true);
    if (nextState.phase === 'reverse' && nextState.activeIndex !== null) reverseCard(nextState.activeIndex);
  };

  const activateFromPointer = (index: number) => {
    if (window.matchMedia(finePointerQuery).matches) activateCard(index);
  };

  const deactivateFromPointer = (index: number) => {
    if (window.matchMedia(finePointerQuery).matches) reverseCard(index);
  };

  return (
    <section className="interactive-furniture" aria-labelledby="interactive-furniture-title">
      <div className="interactive-furniture__heading">
        <motion.h2
          id="interactive-furniture-title"
          initial={reducedMotion ? false : 'hidden'}
          whileInView="visible"
          viewport={{ once: true, amount: 0.45 }}
        >
          {headingWords.map((word, index) => (
            <motion.span
              className="interactive-furniture__heading-word"
              key={word}
              variants={{
                hidden: { opacity: 0, y: 22, filter: 'blur(10px)' },
                visible: {
                  opacity: 1,
                  y: 0,
                  filter: 'blur(0px)',
                  transition: {
                    duration: reducedMotion ? 0 : 0.48,
                    delay: reducedMotion ? 0 : index * 0.08,
                    ease: [0.44, 0, 0.56, 1],
                  },
                },
              }}
            >
              {word}
            </motion.span>
          ))}
        </motion.h2>
      </div>
      <div className="interactive-furniture__rail">
        {products.map((product, index) => (
          <article
            className={`interactive-furniture__card${activeIndex === index ? ' is-active' : ''}`}
            key={product.name}
          >
            <Link
              className="interactive-furniture__button"
              href={SHOWCASE_PRODUCT_PATH}
              aria-label={`${product.name}, ${product.category}, ${product.price}`}
              onPointerEnter={() => activateFromPointer(index)}
              onPointerLeave={() => deactivateFromPointer(index)}
              onFocus={() => activateCard(index)}
              onBlur={() => reverseCard(index)}
              onClick={() => requestFromTap(index)}
            >
              <span className="interactive-furniture__media" aria-hidden="true">
                <img
                  className={
                    getMediaLayerState(videoFrameReady[index], fallbackModes[index]).showIdleFrame ? '' : 'is-hidden'
                  }
                  src={product.idleSrc}
                  alt=""
                />
                <canvas
                  className={
                    getMediaLayerState(videoFrameReady[index], fallbackModes[index]).showFrozenFrame ? 'is-visible' : ''
                  }
                  ref={(node) => {
                    canvasRefs.current[index] = node;
                  }}
                  width="720"
                  height="720"
                />
                <video
                  className={
                    getMediaLayerState(videoFrameReady[index], fallbackModes[index]).showVideo ? 'is-frame-ready' : ''
                  }
                  ref={(node) => {
                    videoRefs.current[index] = node;
                  }}
                  src={product.forwardSrc}
                  muted
                  playsInline
                  preload="auto"
                />
              </span>
              <FurnitureCaption
                name={product.name}
                category={product.category}
                price={product.price}
                active={activeIndex === index}
              />
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
