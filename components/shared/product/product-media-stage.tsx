'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import styles from './product-media-stage.module.css';

export interface ProductMediaStageProps {
  images: Array<{ url: string; alt: string }>;
  turntable: {
    videoUrl: string;
    posterUrl: string;
    fallbackUrl: string;
    alt: string;
  } | null;
}

export function ProductMediaStage({ images, turntable }: ProductMediaStageProps): React.JSX.Element {
  const [activeImage, setActiveImage] = useState(0);
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [motionOptIn, setMotionOptIn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const selectedImage = images[activeImage] ?? images[0];

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches);

    setReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener?.('change', handleChange);
    return () => mediaQuery.removeEventListener?.('change', handleChange);
  }, []);

  const handlePlayback = () => {
    const video = videoRef.current;
    if (!video) return;

    if (playing) {
      video.pause();
      return;
    }

    if (reducedMotion) setMotionOptIn(true);
    void video.play().catch(() => {
      setPlaying(false);
    });
  };

  if (!turntable && !selectedImage) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-[24px] border border-line bg-surface-soft p-6 text-center text-sm text-ink-muted">
        Изображение недоступно
      </div>
    );
  }

  if (!turntable) {
    return (
      <div className="grid gap-3">
        <div className={styles.stage}>
          <Image
            src={selectedImage.url}
            alt={selectedImage.alt}
            fill
            priority
            sizes="(min-width: 1024px) 600px, 100vw"
            className={styles.media}
          />
        </div>
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto" aria-label="Галерея изображений">
            {images.map((image, index) => (
              <button
                key={image.url}
                type="button"
                onClick={() => setActiveImage(index)}
                aria-label={`Фото ${index + 1}`}
                aria-current={activeImage === index ? 'true' : undefined}
                className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-line bg-surface-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                <Image src={image.url} alt="" fill sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <div className={`${styles.stage} ${failed ? styles.failed : ''}`}>
        <Image
          src={turntable.fallbackUrl}
          alt={turntable.alt}
          fill
          data-testid="turntable-fallback"
          sizes="(min-width: 1024px) 600px, 100vw"
          className={`${styles.layer} ${styles.mediaTransition}`}
        />
        <Image
          src={turntable.posterUrl}
          alt={turntable.alt}
          fill
          data-testid="turntable-poster"
          sizes="(min-width: 1024px) 600px, 100vw"
          className={`${styles.layer} ${styles.mediaTransition}`}
        />
        {!failed && (
          <video
            ref={videoRef}
            data-testid="turntable-video"
            src={turntable.videoUrl}
            poster={turntable.posterUrl}
            muted
            playsInline
            preload="metadata"
            loop={!reducedMotion}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
            onError={() => {
              setFailed(true);
              setPlaying(false);
            }}
            data-motion-enabled={(!reducedMotion || motionOptIn).toString()}
            className={`${styles.layer} ${styles.videoLayer} ${styles.mediaTransition}`}
          />
        )}
        <button
          type="button"
          onClick={handlePlayback}
          aria-label={playing ? 'Пауза обзора 360°' : 'Запустить обзор 360°'}
          className="absolute bottom-4 left-4 z-10 inline-flex min-h-11 items-center rounded-full bg-surface/90 px-4 text-sm font-bold text-ink shadow-sm backdrop-blur hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          {playing ? 'Пауза обзора 360°' : 'Запустить обзор 360°'}
        </button>
      </div>
      {failed && (
        <p role="status" className="text-sm text-ink-muted">
          360° недоступен, показано статичное изображение
        </p>
      )}
      {selectedImage && (
        <div className="flex gap-2 overflow-x-auto" aria-label="Галерея изображений">
          {images.map((image, index) => (
            <button
              key={image.url}
              type="button"
              onClick={() => setActiveImage(index)}
              aria-label={`Фото ${index + 1}`}
              aria-current={activeImage === index ? 'true' : undefined}
              className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-line bg-surface-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              <Image src={image.url} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
