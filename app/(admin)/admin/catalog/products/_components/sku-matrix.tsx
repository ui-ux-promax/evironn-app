'use client';

import * as React from 'react';
import { ImageUploader } from '@/components/admin/media/image-uploader';
import { Input } from '@/components/admin/ui/input';
import { EVIRONN_SKUS_FOLDER } from '@/lib/cloudinary/folders';
import type { FurnitureProductValues } from '@/services/dto/product.dto';
import type { UploadedImage } from '@/lib/cloudinary/types';
import { buildSkuMatrix, type SkuMatrixAxis, type SkuMatrixResult, type SkuMatrixRow } from '@/lib/admin/sku-matrix';

type SkuMedia = NonNullable<FurnitureProductValues['skus'][number]['media']>[number];
type SkuMatrixExistingSku = Parameters<typeof buildSkuMatrix>[0]['existing'][number] & { media?: SkuMedia[] };

type SkuMatrixProps = {
  axes: SkuMatrixAxis[];
  existing: SkuMatrixExistingSku[];
  onChange?: (result: SkuMatrixResult) => void;
  mediaByCombinationKey?: Record<string, SkuMedia[]>;
  onMediaChange?: (skuId: string | null, combinationKey: string, media: SkuMedia[]) => void;
};

export function SkuMatrix({ axes, existing, mediaByCombinationKey = {}, onChange, onMediaChange }: SkuMatrixProps) {
  const [result, setResult] = React.useState(() => buildSkuMatrix({ axes, existing }));

  React.useEffect(() => {
    setResult(buildSkuMatrix({ axes, existing }));
  }, [axes, existing]);

  function updateRow(rowIndex: number, changes: Partial<SkuMatrixRow>) {
    setResult((current) => {
      const next = {
        ...current,
        rows: current.rows.map((row, index) => (index === rowIndex ? { ...row, ...changes } : row)),
      };
      onChange?.(next);
      return next;
    });
  }

  return (
    <div className="overflow-x-auto rounded-[14px] border border-admin-outline-variant">
      <table className="w-full min-w-[760px] text-left text-xs">
        <thead className="bg-admin-surface-low text-admin-on-surface-variant">
          <tr>
            <th className="px-3 py-2 font-bold">Combination</th>
            <th className="px-3 py-2 font-bold">Article number</th>
            <th className="px-3 py-2 font-bold">Price</th>
            <th className="px-3 py-2 font-bold">Old price</th>
            <th className="px-3 py-2 font-bold">Stock</th>
            <th className="px-3 py-2 font-bold">Active</th>
            <th className="px-3 py-2 font-bold">Media</th>
          </tr>
        </thead>
        <tbody>
          {result.rows.map((row, rowIndex) => (
            <tr key={row.combinationKey} className="border-t border-admin-outline-variant">
              <td
                className="px-3 py-2 font-medium text-admin-on-surface"
                data-testid={`admin-product-matrix-row-${row.combinationKey}`}
              >
                {row.combinationKey}
              </td>
              <td className="px-3 py-2">
                <Input
                  aria-label={`Article number ${row.combinationKey}`}
                  value={row.articleNumber}
                  onChange={(event) => updateRow(rowIndex, { articleNumber: event.target.value })}
                />
              </td>
              <td className="px-3 py-2">
                <Input
                  aria-label={`Price ${row.combinationKey}`}
                  type="number"
                  value={row.price}
                  onChange={(event) => updateRow(rowIndex, { price: Number(event.target.value) })}
                />
              </td>
              <td className="px-3 py-2">
                <Input
                  aria-label={`Old price ${row.combinationKey}`}
                  type="number"
                  value={row.oldPrice ?? ''}
                  onChange={(event) =>
                    updateRow(rowIndex, { oldPrice: event.target.value === '' ? null : Number(event.target.value) })
                  }
                />
              </td>
              <td className="px-3 py-2">
                <Input
                  data-testid={`admin-product-matrix-stock-${row.combinationKey}`}
                  aria-label={`Stock ${row.combinationKey}`}
                  type="number"
                  value={row.stock}
                  readOnly={row.state === 'existing'}
                  onChange={(event) => updateRow(rowIndex, { stock: Number(event.target.value) })}
                />
                {row.state === 'existing' && (
                  <span className="mt-1 block text-[11px] text-admin-on-surface-variant">
                    Stock is managed in the stock console.
                  </span>
                )}
              </td>
              <td className="px-3 py-2">
                <input
                  aria-label={`Active ${row.combinationKey}`}
                  type="checkbox"
                  checked={row.active}
                  onChange={(event) => updateRow(rowIndex, { active: event.target.checked })}
                />
              </td>
              <td className="min-w-[220px] px-3 py-2 align-top">
                <SkuMediaEditor
                  media={
                    row.skuId
                      ? (existing.find((sku) => sku.skuId === row.skuId)?.media ?? [])
                      : (mediaByCombinationKey[row.combinationKey] ?? [])
                  }
                  onChange={(media) => onMediaChange?.(row.skuId, row.combinationKey, media)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SkuMediaEditor({ media, onChange }: { media: SkuMedia[]; onChange?: (media: SkuMedia[]) => void }) {
  const images = media.filter((item) => item.kind === 'IMAGE' && Boolean(item.publicId));
  function handleChange(uploaded: UploadedImage[]) {
    const previousImages = media.filter((item) => item.kind === 'IMAGE');
    const nextImages = uploaded.map((image, index) => {
      const previous = previousImages.find((item) => item.publicId === image.publicId);
      return {
        id: previous?.id,
        kind: 'IMAGE' as const,
        url: image.url,
        publicId: image.publicId,
        alt: image.alt,
        sortOrder: index,
      };
    });
    onChange?.([
      ...media.filter((item) => item.kind !== 'IMAGE'),
      ...media.filter((item) => item.kind === 'IMAGE' && !item.publicId),
      ...nextImages,
    ]);
  }

  return (
    <ImageUploader
      value={images.map((image) => ({
        publicId: image.publicId as string,
        url: image.url,
        width: 0,
        height: 0,
        format: 'image',
        bytes: 0,
        alt: image.alt ?? undefined,
        persisted: Boolean(image.id),
      }))}
      onChange={handleChange}
      folder={EVIRONN_SKUS_FOLDER}
      max={4}
    />
  );
}
