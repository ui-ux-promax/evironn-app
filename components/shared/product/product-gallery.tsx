'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export interface GalleryImage {
  url: string;
  alt: string;
}

export function ProductGallery({
  images,
  productName,
  isNew = false,
  discountPct = null,
}: {
  images: GalleryImage[];
  productName: string;
  isNew?: boolean;
  discountPct?: number | null;
}) {
  const [active, setActive] = useState(0);

  if (!images.length) {
    return (
      <div className="rounded-[24px] border border-line bg-surface-soft aspect-[1/1.04] grid place-items-center text-ink-muted">
        нет фото
      </div>
    );
  }

  const idx = Math.min(active, images.length - 1);
  const main = images[idx];

  return (
    <div className="grid gap-3">
      {/* Main image */}
      <div className="relative aspect-[1/1.04] rounded-[24px] border border-line bg-surface-soft overflow-hidden">
        {(isNew || discountPct != null) && (
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5">
            {discountPct != null && (
              <span className="inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-full bg-warm text-ink">
                −{discountPct}%
              </span>
            )}
            {isNew && (
              <span className="inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-full bg-primary text-primary-foreground">
                Новинка
              </span>
            )}
          </div>
        )}
        <Image
          src={main.url}
          alt={main.alt}
          fill
          priority
          sizes="(min-width: 1024px) 600px, 100vw"
          className="object-cover"
        />
      </div>

      {/* Thumbnails — 2-col grid */}
      {images.length > 1 && (
        <div className="grid grid-cols-2 gap-3">
          {images.map((img, i) => {
            const isWide = i === images.length - 1 && i % 2 === 0;
            return (
              <button
                key={i}
                type="button"
                className={cn(
                  'group relative overflow-hidden rounded-[18px] border bg-surface-soft transition-all duration-300',
                  isWide ? 'col-span-2 aspect-[1.74/1]' : 'aspect-[1/1.08]',
                  i === idx
                    ? 'border-ink shadow-[0_0_0_1px_hsl(var(--color-text))]'
                    : 'border-line hover:border-ink/30',
                )}
                onClick={() => setActive(i)}
                aria-current={i === idx}
                aria-label={`Фото ${i + 1}`}
              >
                <Image
                  src={img.url}
                  alt={img.alt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(min-width: 1024px) 300px, 50vw"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
