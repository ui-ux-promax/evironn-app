'use client';

import { useRef, useState } from 'react';
import { FiHeart } from 'react-icons/fi';
import Link from 'next/link';

import { FadeArc } from '@/components/loading-ui/fade-arc';
import {
  CARD_PLAYBACK_RATE,
  getMediaLayerState,
  getReverseStartTime,
  type MediaFallbackMode,
} from '@/components/evironn/home/furniture-playback';
import type { CatalogBCard } from '@/components/evironn/catalog/catalog-variant-b-adapter';
import { formatPrice } from '@/lib/format';
import type { WishlistMutationResult } from '@/services/dto/wishlist.dto';

const finePointerQuery = '(hover: hover) and (pointer: fine)';
const reducedMotionQuery = '(prefers-reduced-motion: reduce)';

type CardPhase = 'idle' | 'forward' | 'reverse';
type CatalogCardProps = {
  product: CatalogBCard;
  wishlisted: boolean;
  onWishlistToggle: (productId: string) => Promise<WishlistMutationResult>;
  wishlistPending?: boolean;
  eager?: boolean;
};

function badgeClass(tone: string): string {
  if (tone === 'discount') return 'sale';
  return tone;
}

export function CatalogCard({
  product,
  wishlisted,
  onWishlistToggle,
  wishlistPending: externalWishlistPending,
  eager = false,
}: CatalogCardProps): React.ReactElement {
  const [frameReady, setFrameReady] = useState(false);
  const [fallback, setFallback] = useState<MediaFallbackMode>('idle');
  const [wishlistPending, setWishlistPending] = useState(false);
  const isWishlistPending = externalWishlistPending ?? wishlistPending;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const phaseRef = useRef<CardPhase>('idle');
  const operationRef = useRef(0);
  const hoverRef = useRef(false);
  const focusRef = useRef(false);

  const layers = getMediaLayerState(frameReady, fallback);

  const freezeFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || !video.videoWidth) return false;
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

  const loadAt = (source: string, time: number, fallbackMode: MediaFallbackMode, onEnded?: () => void) => {
    const video = videoRef.current;
    if (!video) return;
    const operation = ++operationRef.current;
    const effectiveFallback = fallbackMode === 'frozen' && freezeFrame() ? 'frozen' : 'idle';
    video.pause();
    setFallback(effectiveFallback);
    setFrameReady(false);

    const onMetadata = () => {
      if (operationRef.current !== operation) return;
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      let revealed = false;
      const reveal = () => {
        if (revealed || operationRef.current !== operation) return;
        revealed = true;
        setFrameReady(true);
        void video.play().catch(() => undefined);
      };
      if (time > 0) video.addEventListener('seeked', reveal, { once: true });
      else video.addEventListener('loadeddata', reveal, { once: true });
      video.currentTime = Math.max(0, Math.min(time, duration));
      video.playbackRate = CARD_PLAYBACK_RATE;
    };

    video.addEventListener('loadedmetadata', onMetadata, { once: true });
    if (onEnded) {
      video.addEventListener(
        'ended',
        () => {
          if (operationRef.current === operation) onEnded();
        },
        { once: true },
      );
    }
    video.src = source;
    video.load();
  };

  const activate = () => {
    if (!window.matchMedia(finePointerQuery).matches) return;
    if (window.matchMedia(reducedMotionQuery).matches) return;
    if (phaseRef.current === 'forward') return;
    phaseRef.current = 'forward';
    loadAt(product.media.forward, 0, 'idle');
  };

  const deactivate = () => {
    if (hoverRef.current || focusRef.current) return;
    const video = videoRef.current;
    if (!video || phaseRef.current === 'idle' || phaseRef.current === 'reverse') return;
    phaseRef.current = 'reverse';
    const reverseTime = getReverseStartTime(video.currentTime, video.duration, video.duration);
    loadAt(product.media.reverse, reverseTime, 'frozen', () => {
      phaseRef.current = 'idle';
      setFrameReady(false);
      setFallback('idle');
    });
  };

  const badge = product.badges[0];

  return (
    <article
      className={`cat-card cat-card--compact${product.soldOut ? ' is-out' : ''}`}
      data-testid="catalog-card"
      data-reduced-motion-query={reducedMotionQuery}
    >
      <Link
        className="cat-card__frame"
        href={product.href}
        aria-label={`${product.name}, ${formatPrice(product.minPrice)}`}
        onPointerEnter={() => {
          hoverRef.current = true;
          activate();
        }}
        onPointerLeave={() => {
          hoverRef.current = false;
          deactivate();
        }}
        onFocus={() => {
          focusRef.current = true;
          activate();
        }}
        onBlur={() => {
          focusRef.current = false;
          deactivate();
        }}
      >
        <span className="cat-card__media" aria-hidden="true">
          <img
            className={layers.showIdleFrame ? '' : 'is-hidden'}
            src={product.media.idle}
            alt=""
            loading={eager ? 'eager' : 'lazy'}
            decoding="async"
          />
          <canvas className={layers.showFrozenFrame ? 'is-visible' : ''} ref={canvasRef} width="720" height="720" />
          <video
            className={layers.showVideo ? 'is-frame-ready' : ''}
            ref={videoRef}
            role="presentation"
            muted
            playsInline
            preload="none"
            onError={() => {
              operationRef.current += 1;
              phaseRef.current = 'idle';
              setFrameReady(false);
              setFallback('idle');
            }}
          />
        </span>
        {badge && <span className={`cat-card__badge cat-card__badge--${badgeClass(badge.tone)}`}>{badge.label}</span>}
        {product.soldOut && <span className="cat-card__badge cat-card__badge--out">Под заказ</span>}
        <span className="cat-card__peek">Смотреть товар</span>
      </Link>
      <button
        className={`cat-card__fav${wishlisted ? ' is-on' : ''}`}
        type="button"
        aria-pressed={wishlisted}
        aria-label={wishlisted ? `Убрать ${product.name} из избранного` : `Добавить ${product.name} в избранное`}
        disabled={isWishlistPending}
        aria-busy={isWishlistPending || undefined}
        onClick={async () => {
          if (isWishlistPending) return;
          if (externalWishlistPending === undefined) setWishlistPending(true);
          try {
            await onWishlistToggle(product.id);
          } catch {
            // The controller restores the previous server-backed state.
          } finally {
            if (externalWishlistPending === undefined) setWishlistPending(false);
          }
        }}
      >
        {isWishlistPending ? (
          <FadeArc className="h-[18px] w-[18px]" aria-hidden="true" />
        ) : (
          <FiHeart aria-hidden="true" />
        )}
      </button>
      <div className="cat-card__body">
        <h3 className="cat-card__name">{product.name}</h3>
        <p className="cat-card__note">{product.note}</p>
        <p className="cat-card__price">
          <span>{formatPrice(product.minPrice)}</span>
          {product.minOldPrice && <s>{formatPrice(product.minOldPrice)}</s>}
          {badge?.tone === 'discount' && <em>{badge.label}</em>}
        </p>
        {product.colors.length > 0 && (
          <ul className="cat-card__colors">
            {product.colors.map((color) => (
              <li key={color.label} style={{ background: color.swatchHex ?? '#d8d3c9' }} title={color.label}>
                <span className="cat-card__sr">{color.label}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
