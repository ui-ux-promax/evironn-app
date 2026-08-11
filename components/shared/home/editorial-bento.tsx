'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';

type BentoItem = {
  src: string;
  alt: string;
  className: string;
  sizes: string;
  x: number;
  y: number;
};

const FIRST_CARD_SIZES = '(max-width: 639px) 100vw, (max-width: 1240px) calc(50vw - 34px), 586px';
const DESKTOP_SINGLE_SIZES = '(max-width: 639px) 50vw, (max-width: 1240px) calc(25vw - 27px), 283px';
const DESKTOP_DOUBLE_SIZES = '(max-width: 639px) 50vw, (max-width: 1240px) calc(50vw - 34px), 586px';

const items: BentoItem[] = [
  {
    src: '/home/hero-slide-3.png',
    alt: 'Мужской образ RITM в свободном силуэте',
    className: 'col-span-2 h-[220px] min-[640px]:col-start-1 min-[640px]:row-start-1 min-[640px]:h-auto',
    sizes: FIRST_CARD_SIZES,
    x: 22,
    y: -22,
  },
  {
    src: '/home/collection-rail.png',
    alt: 'Рейл новой коллекции RITM',
    className: 'h-[250px] min-[640px]:col-start-3 min-[640px]:row-start-1 min-[640px]:h-auto',
    sizes: DESKTOP_SINGLE_SIZES,
    x: -22,
    y: -14,
  },
  {
    src: '/home/coming-card.png',
    alt: 'Женский образ RITM в стёганой куртке',
    className: 'h-[250px] min-[640px]:col-start-4 min-[640px]:row-start-1 min-[640px]:row-span-2 min-[640px]:h-auto',
    sizes: DESKTOP_SINGLE_SIZES,
    x: 14,
    y: -24,
  },
  {
    src: '/home/blog-wardrobe.png',
    alt: 'Детали базового гардероба RITM',
    className: 'h-[250px] min-[640px]:col-start-1 min-[640px]:row-start-2 min-[640px]:row-span-2 min-[640px]:h-auto',
    sizes: DESKTOP_SINGLE_SIZES,
    x: -16,
    y: 24,
  },
  {
    src: '/home/blog-chic.png',
    alt: 'Повседневный многослойный образ RITM',
    className: 'h-[250px] min-[640px]:col-span-2 min-[640px]:col-start-2 min-[640px]:row-start-2 min-[640px]:h-auto',
    sizes: DESKTOP_DOUBLE_SIZES,
    x: 24,
    y: 14,
  },
  {
    src: '/home/season-collage.png',
    alt: 'Фактура и крой сезонной коллекции RITM',
    className: 'h-[250px] min-[640px]:col-span-2 min-[640px]:col-start-2 min-[640px]:row-start-3 min-[640px]:h-auto',
    sizes: DESKTOP_DOUBLE_SIZES,
    x: -20,
    y: -20,
  },
  {
    src: '/home/blog-arrival.png',
    alt: 'Новый образ из коллекции RITM',
    className: 'h-[250px] min-[640px]:col-span-1 min-[640px]:col-start-4 min-[640px]:row-start-3 min-[640px]:h-auto',
    sizes: DESKTOP_SINGLE_SIZES,
    x: 18,
    y: 22,
  },
];

export function EditorialBento() {
  const gridRef = useRef<HTMLDivElement>(null);
  const imageRefs = useRef<Array<HTMLImageElement | null>>([]);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let current = 0;
    let target = 0;
    let frame: number | null = null;

    const render = () => {
      current += (target - current) * 0.11;

      imageRefs.current.forEach((image, index) => {
        if (!image) return;
        const item = items[index];
        image.style.transform = `translate3d(${(item.x * current).toFixed(2)}px, ${(item.y * current).toFixed(2)}px, 0) scale(1.26)`;
      });

      if (Math.abs(target - current) > 0.001) {
        frame = window.requestAnimationFrame(render);
      } else {
        frame = null;
      }
    };

    const update = () => {
      const rect = grid.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const gridCenter = rect.top + rect.height / 2;
      target = Math.max(-1, Math.min(1, (viewportHeight / 2 - gridCenter) / ((viewportHeight + rect.height) / 2)));
      if (frame === null) frame = window.requestAnimationFrame(render);
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);

    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={gridRef}
      data-reveal="scale"
      className="grid grid-cols-2 gap-x-4 gap-y-4 min-[640px]:grid-cols-4 min-[640px]:grid-rows-[230px_230px_230px] min-[640px]:gap-x-5 min-[640px]:gap-y-5"
    >
      {items.map((item, index) => (
        <figure key={item.src} className={`relative overflow-hidden rounded-[16px] bg-surface-soft ${item.className}`}>
          <Image
            ref={(node) => {
              imageRefs.current[index] = node;
            }}
            src={item.src}
            alt={item.alt}
            fill
            sizes={item.sizes}
            className="object-cover will-change-transform"
            style={{ transform: 'scale(1.26)' }}
          />
        </figure>
      ))}
    </div>
  );
}
