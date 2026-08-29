'use client';

import * as React from 'react';
import { Icon } from '@/components/admin/icon';
import { buildImageUrl } from '@/lib/cloudinary/url';
import type { UploadedImage } from '@/lib/cloudinary/types';

interface ImagePreviewCardProps {
  image: UploadedImage;
  index: number;
  total: number;
  onRemove: (index: number) => void;
  onAltChange: (index: number, alt: string) => void;
  onMove: (index: number, dir: -1 | 1) => void;
}

export function ImagePreviewCard({ image, index, total, onRemove, onAltChange, onMove }: ImagePreviewCardProps) {
  return (
    <div className="group relative flex min-w-0 flex-col gap-2 rounded-xl border border-admin-outline-variant bg-admin-surface p-1.5">
      {/* eslint-disable-next-line @next/next/no-img-element -- preview only, not LCP */}
      <img
        src={buildImageUrl(image.publicId, 'thumb')}
        alt={image.alt ?? ''}
        width={240}
        height={180}
        className="aspect-[4/3] w-full rounded-lg bg-admin-surface-high object-cover"
      />
      {index === 0 && (
        <span className="absolute left-3 top-3 rounded-full bg-admin-surface/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-admin-on-surface">
          Обложка
        </span>
      )}
      <input
        type="text"
        value={image.alt ?? ''}
        onChange={(e) => onAltChange(index, e.target.value)}
        placeholder="Описание изображения"
        className="w-full rounded-md border border-admin-outline-variant bg-admin-surface px-2 py-1.5 text-xs text-admin-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-primary"
      />
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onMove(index, -1)}
            disabled={index === 0}
            aria-label="Сдвинуть влево"
            className="rounded p-0.5 text-admin-on-surface-variant hover:text-admin-on-surface disabled:opacity-30"
          >
            <Icon name="chevron_left" />
          </button>
          <button
            type="button"
            onClick={() => onMove(index, 1)}
            disabled={index === total - 1}
            aria-label="Сдвинуть вправо"
            className="rounded p-0.5 text-admin-on-surface-variant hover:text-admin-on-surface disabled:opacity-30"
          >
            <Icon name="chevron_right" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => onRemove(index)}
          aria-label="Удалить изображение"
          className="rounded p-0.5 text-admin-error hover:opacity-80"
        >
          <Icon name="delete" />
        </button>
      </div>
    </div>
  );
}
