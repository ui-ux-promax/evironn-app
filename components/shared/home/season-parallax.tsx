'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';

const PARALLAX_SCALE = 1.5;
const PARALLAX_LERP = 0.12;

export function SeasonParallax() {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const image = imageRef.current;
    if (!container || !image || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let currentOffset = 0;
    let targetOffset = 0;
    let frame: number | null = null;

    const animate = () => {
      currentOffset += (targetOffset - currentOffset) * PARALLAX_LERP;
      image.style.transform = `translate3d(0, ${currentOffset.toFixed(2)}px, 0) scale(${PARALLAX_SCALE})`;

      if (Math.abs(targetOffset - currentOffset) > 0.05) {
        frame = window.requestAnimationFrame(animate);
      } else {
        currentOffset = targetOffset;
        image.style.transform = `translate3d(0, ${currentOffset.toFixed(2)}px, 0) scale(${PARALLAX_SCALE})`;
        frame = null;
      }
    };

    const updateTarget = () => {
      const rect = container.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      if (rect.bottom < 0 || rect.top > viewportHeight) return;

      const progress = Math.min(1, Math.max(0, (viewportHeight - rect.top) / (viewportHeight + rect.height)));

      targetOffset = (progress - 0.5) * rect.height * (PARALLAX_SCALE - 1);
      if (frame === null) frame = window.requestAnimationFrame(animate);
    };

    updateTarget();
    window.addEventListener('scroll', updateTarget, { passive: true });
    window.addEventListener('resize', updateTarget);

    return () => {
      window.removeEventListener('scroll', updateTarget);
      window.removeEventListener('resize', updateTarget);
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      data-reveal="scale"
      className="relative min-h-[280px] w-screen overflow-hidden md:min-h-[390px]"
      style={{ marginLeft: 'calc(50% - 50vw)' }}
    >
      <Image
        ref={imageRef}
        src="/home/season-collage.png"
        alt="Коллаж коллекции Evironn"
        fill
        sizes="100vw"
        className="season-parallax-image object-cover"
      />
      <div className="absolute bottom-7 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/35 bg-ink/72 px-4 py-2 text-white shadow-xl backdrop-blur-md">
        <span className="font-mono text-[10px] font-bold tracking-[.18em]">EVIRONN / SS26</span>
        <span className="h-1 w-1 rounded-full bg-accent" />
        <span className="hidden text-[11px] text-white/72 sm:inline">Лимитированная коллекция</span>
      </div>
    </div>
  );
}
