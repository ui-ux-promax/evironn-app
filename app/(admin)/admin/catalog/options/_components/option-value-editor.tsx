'use client';

import type { UseFormRegister } from 'react-hook-form';
import { Button } from '@/components/admin/ui/button';
import { Input } from '@/components/admin/ui/input';
import type { OptionGroupValues } from '@/services/dto/option-group.dto';

export function OptionValueEditor({
  index,
  register,
  onRemove,
  canRemove,
}: {
  index: number;
  register: UseFormRegister<OptionGroupValues>;
  onRemove: () => void;
  canRemove: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 rounded-[16px] border border-admin-outline-variant bg-admin-surface p-3 sm:grid-cols-[1fr_1fr_140px_110px_auto] sm:items-end">
      <label className="space-y-1 text-[12px] font-extrabold uppercase tracking-[.06em] text-admin-on-surface-variant">
        Название
        <Input {...register(`values.${index}.name`)} placeholder="Дуб" />
      </label>
      <label className="space-y-1 text-[12px] font-extrabold uppercase tracking-[.06em] text-admin-on-surface-variant">
        Slug
        <Input {...register(`values.${index}.slug`)} placeholder="oak" />
      </label>
      <label className="space-y-1 text-[12px] font-extrabold uppercase tracking-[.06em] text-admin-on-surface-variant">
        Swatch
        <Input {...register(`values.${index}.swatchHex`)} placeholder="#aa7733" />
      </label>
      <label className="space-y-1 text-[12px] font-extrabold uppercase tracking-[.06em] text-admin-on-surface-variant">
        Порядок
        <Input type="number" {...register(`values.${index}.sortOrder`, { valueAsNumber: true })} />
      </label>
      <Button type="button" variant="danger" size="sm" onClick={onRemove} disabled={!canRemove}>
        Удалить
      </Button>
    </div>
  );
}
