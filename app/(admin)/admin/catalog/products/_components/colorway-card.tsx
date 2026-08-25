'use client';

import {
  useFieldArray,
  useWatch,
  type Control,
  type UseFormRegister,
  type UseFormSetValue,
  type UseFormGetValues,
} from 'react-hook-form';
import { Input } from '@/components/admin/ui/input';
import { Button } from '@/components/admin/ui/button';
import { ImageUploader } from '@/components/admin/media/image-uploader';
import type { UploadedImage } from '@/lib/cloudinary/types';
import { EVIRONN_PRODUCTS_FOLDER } from '@/lib/cloudinary/folders';
import { VariantMatrix } from './variant-matrix';

export interface ColorwayCardProps {
  ci: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: UseFormRegister<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: UseFormSetValue<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getValues: UseFormGetValues<any>;
  isDefault: boolean;
  onMakeDefault: () => void;
  onRemove: () => void;
  removable: boolean;
  referencedVariantIds: Set<string>;
}

export function ColorwayCard({
  ci,
  control,
  register,
  setValue,
  getValues,
  isDefault,
  onMakeDefault,
  onRemove,
  removable,
  referencedVariantIds,
}: ColorwayCardProps) {
  const variantsArray = useFieldArray({ control, name: `colorways.${ci}.variants` as const, keyName: 'key' });

  // Картинки храним как UploadedImage[] в поле формы; ImageUploader уже умеет upload/reorder/alt/delete.
  const images = (useWatch({ control, name: `colorways.${ci}.images` }) as UploadedImage[] | undefined) ?? [];

  return (
    <div className="space-y-4 rounded-[24px] border border-admin-outline-variant bg-admin-surface p-[22px] shadow-[var(--admin-shadow-tight)]">
      <div className="flex items-center justify-between gap-3 max-[640px]:grid">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-bold">
            <input type="radio" name="defaultColorway" checked={isDefault} onChange={onMakeDefault} />
            Основная
          </label>
          {removable && (
            <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
              Удалить расцветку
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <label className="text-[12px] font-extrabold uppercase tracking-[.06em] text-admin-on-surface-variant">
            Название
          </label>
          <Input placeholder="Чёрный" {...register(`colorways.${ci}.name`)} />
        </div>
        <div className="space-y-1">
          <label className="text-[12px] font-extrabold uppercase tracking-[.06em] text-admin-on-surface-variant">
            Slug
          </label>
          <Input placeholder="black" {...register(`colorways.${ci}.slug`)} />
        </div>
        <div className="space-y-1">
          <label className="text-[12px] font-extrabold uppercase tracking-[.06em] text-admin-on-surface-variant">
            Цвет (HEX)
          </label>
          <Input placeholder="#000000" {...register(`colorways.${ci}.swatchHex`)} />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[12px] font-extrabold uppercase tracking-[.06em] text-admin-on-surface-variant">
          Галерея
        </label>
        <ImageUploader
          value={images}
          onChange={(imgs) => setValue(`colorways.${ci}.images`, imgs, { shouldDirty: true })}
          folder={EVIRONN_PRODUCTS_FOLDER}
          max={8}
        />
      </div>

      <div className="space-y-2">
        <label className="text-[12px] font-extrabold uppercase tracking-[.06em] text-admin-on-surface-variant">
          Размеры и варианты
        </label>
        <VariantMatrix
          ci={ci}
          control={control}
          register={register}
          fieldArray={variantsArray}
          setValue={setValue}
          getValues={getValues}
          referencedVariantIds={referencedVariantIds}
        />
      </div>
    </div>
  );
}
