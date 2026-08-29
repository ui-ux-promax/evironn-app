'use client';

import * as React from 'react';
import { Button } from '@/components/admin/ui/button';
import { Icon } from '@/components/admin/icon';
import { validateImageFile } from '@/lib/cloudinary/validate';
import type { UploadedImage } from '@/lib/cloudinary/types';
import { shouldDeleteImmediately } from '@/lib/cloudinary/admin-media';
import { EVIRONN_UPLOADS_FOLDER } from '@/lib/cloudinary/folders';
import { ImagePreviewCard } from './image-preview-card';

interface ImageUploaderProps {
  value: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  folder?: string;
  max?: number;
  compact?: boolean;
}

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

export function ImageUploader({
  value,
  onChange,
  folder = EVIRONN_UPLOADS_FOLDER,
  max = 8,
  compact = false,
}: ImageUploaderProps) {
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const disabled = !CLOUD_NAME;
  const full = value.length >= max;

  async function uploadOne(file: File): Promise<UploadedImage> {
    const signRes = await fetch('/api/admin/media/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder }),
    });
    if (!signRes.ok) {
      const body = await signRes.json().catch(() => ({}));
      throw new Error(body.message ?? 'Не удалось получить подпись загрузки');
    }
    const { signature, timestamp, apiKey, cloudName, folder: signedFolder } = await signRes.json();

    const form = new FormData();
    form.append('file', file);
    form.append('api_key', apiKey);
    form.append('timestamp', String(timestamp));
    form.append('folder', signedFolder);
    form.append('signature', signature);

    const upRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: form,
    });
    if (!upRes.ok) {
      const body = await upRes.json().catch(() => ({}));
      throw new Error(body?.error?.message ?? 'Cloudinary отклонил загрузку');
    }
    const data = await upRes.json();
    return {
      publicId: data.public_id,
      url: data.secure_url,
      width: data.width,
      height: data.height,
      format: data.format,
      bytes: data.bytes,
      persisted: false,
    };
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    const remaining = max - value.length;
    const picked = Array.from(files).slice(0, remaining);

    for (const f of picked) {
      const v = validateImageFile({ type: f.type, size: f.size });
      if (!v.ok) {
        setError(v.error);
        return;
      }
    }

    setUploading(true);
    try {
      const uploaded: UploadedImage[] = [];
      for (const f of picked) {
        uploaded.push(await uploadOne(f));
      }
      onChange([...value, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function handleRemove(index: number) {
    const img = value[index];
    onChange(value.filter((_, i) => i !== index));
    if (shouldDeleteImmediately(img)) {
      void fetch('/api/admin/media/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId: img.publicId }),
      }).catch(() => {});
    }
  }

  function handleMove(index: number, dir: -1 | 1) {
    const next = [...value];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function handleAltChange(index: number, alt: string) {
    onChange(value.map((img, i) => (i === index ? { ...img, alt } : img)));
  }

  if (disabled) {
    return (
      <div className="rounded-xl border border-dashed border-admin-outline-variant bg-admin-surface-low px-4 py-3 text-sm text-admin-on-surface-variant">
        Cloudinary не настроен. Задайте NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY и CLOUDINARY_API_SECRET,
        чтобы включить загрузку изображений.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (!uploading && !full) handleFiles(e.dataTransfer.files);
        }}
        className={compact ? 'grid min-w-0 grid-cols-1 gap-2' : 'grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4'}
      >
        {value.map((img, i) => (
          <ImagePreviewCard
            key={img.publicId}
            image={img}
            index={i}
            total={value.length}
            onRemove={handleRemove}
            onAltChange={handleAltChange}
            onMove={handleMove}
          />
        ))}
        <button
          type="button"
          disabled={full || uploading}
          onClick={() => inputRef.current?.click()}
          className={
            compact
              ? 'flex h-9 min-w-0 items-center justify-center gap-1.5 overflow-hidden rounded-[10px] border border-dashed border-admin-outline-variant bg-admin-surface-low px-2 text-[11px] font-medium text-admin-on-surface-variant transition-colors hover:border-admin-primary hover:text-admin-primary disabled:cursor-not-allowed disabled:opacity-50'
              : 'flex aspect-[4/3] min-h-0 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-admin-outline-variant bg-admin-surface-low text-admin-on-surface-variant transition-colors hover:border-admin-primary hover:text-admin-primary disabled:cursor-not-allowed disabled:opacity-50'
          }
        >
          <Icon name="add_photo_alternate" className={compact ? 'shrink-0 text-base' : 'text-2xl'} aria-hidden="true" />
          <span className="truncate whitespace-nowrap">
            {uploading ? 'Загрузка…' : full ? `Лимит ${max}` : 'Добавить фото'}
          </span>
        </button>
      </div>

      {error && <p className="text-sm text-admin-error">{error}</p>}
      {!full && value.length === 0 && (
        <p
          className={
            compact ? 'truncate text-[10px] text-admin-on-surface-variant' : 'text-xs text-admin-on-surface-variant'
          }
        >
          {compact ? 'Перетащите или добавьте.' : 'Перетащите изображения в эту область или добавьте их кнопкой.'}
        </p>
      )}
    </div>
  );
}
