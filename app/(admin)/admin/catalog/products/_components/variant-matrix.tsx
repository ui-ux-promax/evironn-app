'use client';

import * as React from 'react';
import { Button } from '@/components/admin/ui/button';
import { Input } from '@/components/admin/ui/input';
import { Switch } from '@/components/admin/ui/switch';
import { Icon } from '@/components/admin/icon';
import {
  useWatch,
  type Control,
  type UseFieldArrayReturn,
  type UseFormRegister,
  type UseFormSetValue,
  type UseFormGetValues,
} from 'react-hook-form';
import { CLOTHING_SIZE_ORDER, CLOTHING_SIZES, type ClothingSize } from '@/constants/config';
import { suggestSku } from '@/lib/sku';
import { cn } from '@/lib/utils';

export interface VariantMatrixProps {
  ci: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: UseFormRegister<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fieldArray: UseFieldArrayReturn<any, `colorways.${number}.variants`, 'key'>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: UseFormSetValue<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getValues: UseFormGetValues<any>;
  referencedVariantIds: Set<string>;
}

export function VariantMatrix({
  ci,
  control,
  register,
  fieldArray,
  setValue,
  getValues,
  referencedVariantIds,
}: VariantMatrixProps) {
  const { fields, append, remove } = fieldArray;
  const base = `colorways.${ci}.variants` as const;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const watchedVariants = (useWatch({ control, name: base }) as any[] | undefined) ?? [];

  function activeSizes(): Set<string> {
    const vs = (getValues(base) as { size: string }[]) ?? [];
    return new Set(vs.map((v) => v.size));
  }

  function toggleSize(size: ClothingSize) {
    const current = getValues(base) as { id?: string; size: string }[];
    const idx = current.findIndex((v) => v.size === size);
    if (idx >= 0) {
      if (current[idx].id && referencedVariantIds.has(current[idx].id!)) return;
      remove(idx);
    } else {
      const product = getValues() as { brand: string; name: string; colorways: { slug: string }[] };
      append({
        size,
        sizeOrder: CLOTHING_SIZE_ORDER[size],
        sku: suggestSku({
          brand: product.brand,
          productName: product.name,
          colorwaySlug: product.colorways[ci]?.slug ?? '',
          size,
        }),
        price: 0,
        compareAtPrice: null,
        stock: 0,
        active: true,
      });
    }
  }

  function bulkPrice(value: number) {
    (getValues(base) as unknown[]).forEach((_, i) => setValue(`${base}.${i}.price`, value));
  }
  function bulkStock(value: number) {
    (getValues(base) as unknown[]).forEach((_, i) => setValue(`${base}.${i}.stock`, value));
  }

  const selected = activeSizes();

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {CLOTHING_SIZES.map((size) => (
          <button
            key={size}
            type="button"
            onClick={() => toggleSize(size)}
            className={
              'min-h-[35px] rounded-full border px-[13px] text-xs font-bold transition-colors ' +
              (selected.has(size)
                ? 'border-[var(--admin-sidebar)] bg-[var(--admin-sidebar)] text-white'
                : 'border-admin-outline-variant text-admin-on-surface-variant hover:bg-admin-surface-low')
            }
          >
            {size}
          </button>
        ))}
      </div>

      {fields.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <BulkInput label="Цена всем" onApply={bulkPrice} />
            <BulkInput label="Остаток всем" onApply={bulkStock} />
          </div>
          <div className="space-y-2">
            {fields.map((f, i) => {
              const row = f as unknown as { key: string; id?: string; size: string };
              const id = row.id;
              const locked = Boolean(id && referencedVariantIds.has(id));
              return (
                <div
                  key={row.key}
                  className={cn(
                    'grid gap-2 rounded-[18px] border border-admin-outline-variant bg-admin-surface-low p-3',
                    'grid-cols-2 [grid-template-areas:"size_ctrl"_"price_old"_"stock_sku"]',
                    'md:items-center md:rounded-none md:border-0 md:bg-transparent md:p-0',
                    'md:grid-cols-[60px_1fr_110px_110px_90px_auto] md:[grid-template-areas:"size_sku_price_old_stock_ctrl"]',
                  )}
                >
                  <span className="[grid-area:size] flex items-center font-bold text-admin-on-surface md:font-normal md:text-admin-on-surface-variant md:text-sm">
                    {row.size}
                  </span>

                  <Field area="sku" label="SKU">
                    <Input placeholder="SKU" {...register(`${base}.${i}.sku`)} />
                  </Field>
                  <Field area="price" label="Цена">
                    <Input
                      type="number"
                      placeholder="Цена"
                      {...register(`${base}.${i}.price`, { valueAsNumber: true })}
                    />
                  </Field>
                  <Field area="old" label="Старая цена">
                    <Input
                      type="number"
                      placeholder="Старая цена"
                      {...register(`${base}.${i}.compareAtPrice`, {
                        setValueAs: (v) => (v === '' || v === null || Number.isNaN(Number(v)) ? null : Number(v)),
                      })}
                    />
                  </Field>
                  <Field area="stock" label="Сток">
                    <Input
                      type="number"
                      placeholder="Сток"
                      {...register(`${base}.${i}.stock`, { valueAsNumber: true })}
                    />
                  </Field>

                  <div className="[grid-area:ctrl] flex items-center justify-end gap-2 md:justify-start">
                    <Switch
                      checked={Boolean(watchedVariants[i]?.active ?? true)}
                      onCheckedChange={(c) => setValue(`${base}.${i}.active`, c, { shouldDirty: true })}
                    />
                    <button
                      type="button"
                      aria-label="Удалить размер"
                      disabled={locked}
                      title={locked ? 'В заказах - только деактивация' : undefined}
                      onClick={() => remove(i)}
                      className="grid place-items-center w-9 h-9 text-admin-on-surface-variant hover:text-admin-error disabled:opacity-30"
                    >
                      <Icon name="delete" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function BulkInput({ label, onApply }: { label: string; onApply: (v: number) => void }) {
  const [v, setV] = React.useState('');
  return (
    <div className="flex items-center gap-1">
      <Input className="w-32" type="number" placeholder={label} value={v} onChange={(e) => setV(e.target.value)} />
      <Button type="button" variant="outline" size="sm" onClick={() => onApply(Number(v) || 0)}>
        OK
      </Button>
    </div>
  );
}

function Field({ area, label, children }: { area: string; label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0" style={{ gridArea: area }}>
      <label className="mb-1 block text-[11px] font-bold uppercase tracking-[.06em] text-admin-on-surface-variant md:hidden">
        {label}
      </label>
      {children}
    </div>
  );
}
