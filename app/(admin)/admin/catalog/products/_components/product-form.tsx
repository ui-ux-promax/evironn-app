'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/admin/ui/button';
import { Input } from '@/components/admin/ui/input';
import { Switch } from '@/components/admin/ui/switch';
import { slugify } from '@/lib/slugify';
import { furnitureProductSchema, type FurnitureProductValues } from '@/services/dto/product.dto';
import { saveFurnitureProduct } from '@/app/actions/admin/products';
import { SpecsEditor } from './specs-editor';
import { SkuMatrix } from './sku-matrix';
import { buildSkuMatrix, type SkuMatrixResult } from '@/lib/admin/sku-matrix';
import type { AdminRoomRow } from '@/lib/admin/catalog';

export interface ProductFormInitial extends FurnitureProductValues {
  id: string;
}

const EMPTY: FurnitureProductValues = {
  name: '',
  slug: '',
  brand: 'Evironn',
  categoryId: '',
  roomIds: [],
  description: '',
  specs: [],
  isBestseller: false,
  active: false,
  sortOrder: 0,
  optionGroups: [],
  skus: [],
  media: [],
  turntable: false,
};

const VALIDATION_ERROR = 'Проверьте поля товара, опций и SKU';

function axesFromValues(values: FurnitureProductValues) {
  return values.optionGroups.map((group) => ({
    optionGroupId: group.id ?? group.slug,
    optionGroupSlug: group.slug,
    optionGroupName: group.name,
    sortOrder: group.sortOrder,
    values: group.values.map((value) => ({
      optionValueId: value.id ?? `${group.slug}:${value.slug}`,
      optionValueSlug: value.slug,
      optionValueName: value.name,
      sortOrder: value.sortOrder,
    })),
  }));
}

function existingForMatrix(values: FurnitureProductValues) {
  return values.skus
    .filter((sku): sku is FurnitureProductValues['skus'][number] & { id: string } => Boolean(sku.id))
    .map((sku) => ({
      skuId: sku.id,
      combinationKey: sku.combinationKey,
      articleNumber: sku.articleNumber,
      price: sku.price,
      oldPrice: sku.oldPrice,
      stock: sku.stock,
      active: sku.active,
      referenced: false,
    }));
}

export function ProductForm({
  initial,
  initialValues,
  categories,
  brands,
  availableRooms = [],
  selectedRoomIds = [],
  detachOptionGroupIds = [],
  detachOptionValueIds = [],
}: {
  initial?: ProductFormInitial;
  initialValues?: FurnitureProductValues;
  categories: { id: string; name: string }[];
  brands: string[];
  availableRooms?: Pick<AdminRoomRow, 'id' | 'name' | 'slug'>[];
  selectedRoomIds?: string[];
  detachOptionGroupIds?: string[];
  detachOptionValueIds?: string[];
}) {
  const router = useRouter();
  const defaults = initial ?? initialValues ?? EMPTY;
  const [serverError, setServerError] = React.useState<string | null>(null);
  const slugDirty = React.useRef(Boolean(initial));
  const [matrixResult, setMatrixResult] = React.useState<SkuMatrixResult>(() =>
    buildSkuMatrix({ axes: axesFromValues(defaults), existing: existingForMatrix(defaults) }),
  );
  const form = useForm<FurnitureProductValues>({
    resolver: zodResolver(furnitureProductSchema),
    defaultValues: defaults,
  });
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = form;
  // RHF's generic Control boundary is required by the shared specs editor.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyControl = control as unknown as Control<any>;
  const optionGroups = watch('optionGroups');
  const axes = React.useMemo(
    () => axesFromValues({ ...defaults, optionGroups: optionGroups ?? [] }),
    [defaults, optionGroups],
  );

  React.useEffect(() => {
    setMatrixResult(
      buildSkuMatrix({ axes, existing: existingForMatrix({ ...defaults, optionGroups: optionGroups ?? [] }) }),
    );
  }, [axes, defaults, optionGroups]);

  function onNameChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (!slugDirty.current) setValue('slug', slugify(event.target.value));
  }

  async function onSubmit(values: FurnitureProductValues) {
    setServerError(null);
    const skus = matrixResult.rows.map((row) => ({
      ...(row.skuId ? { id: row.skuId } : {}),
      articleNumber: row.articleNumber,
      combinationKey: row.combinationKey,
      selectedOptions: row.selections.map((selection) => ({
        groupSlug: selection.optionGroupSlug,
        valueSlug: selection.optionValueSlug,
      })),
      price: row.price,
      oldPrice: row.oldPrice,
      stock: row.stock,
      active: row.active,
      media: row.skuId ? (values.skus.find((sku) => sku.id === row.skuId)?.media ?? []) : [],
    }));
    const result = await saveFurnitureProduct({
      product: { ...(initial ? { id: initial.id } : {}), ...values, skus },
      detachOptionGroupIds,
      detachOptionValueIds,
    });
    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    router.push('/admin/catalog/products');
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, () => setServerError(VALIDATION_ERROR))} className="space-y-[22px]">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Field label="Название" error={errors.name?.message}>
          <Input {...register('name', { onChange: onNameChange })} placeholder="Название товара" />
        </Field>
        <Field label="Slug" error={errors.slug?.message}>
          <Input {...register('slug', { onChange: () => (slugDirty.current = true) })} placeholder="nazvanie-tovara" />
        </Field>
        <Field label="Бренд" error={errors.brand?.message}>
          <Input list="brand-list" {...register('brand')} placeholder="Evironn" />
          <datalist id="brand-list">
            {brands.map((brand) => (
              <option key={brand} value={brand} />
            ))}
          </datalist>
        </Field>
        <Field label="Категория" error={errors.categoryId?.message}>
          <select {...register('categoryId')} className="admin-input w-full">
            <option value="">Выберите категорию</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Порядок" error={errors.sortOrder?.message}>
          <Input type="number" {...register('sortOrder', { valueAsNumber: true })} />
        </Field>
      </div>

      <Field label="Описание" error={errors.description?.message}>
        <textarea
          {...register('description')}
          rows={4}
          className="w-full rounded-[18px] border border-admin-outline-variant bg-admin-surface px-4 py-3 text-sm outline-none"
        />
      </Field>

      {availableRooms.length > 0 && (
        <Field label="Комнаты" error={errors.roomIds?.message}>
          <select
            multiple
            {...register('roomIds')}
            defaultValue={selectedRoomIds}
            aria-label="Комнаты товара"
            data-testid="admin-product-form-rooms"
            className="min-h-24 w-full rounded-[10px] border border-admin-outline-variant bg-admin-surface px-3 py-2 text-[13px]"
          >
            {availableRooms.map((room) => (
              <option key={room.id} value={room.slug}>
                {room.name} ({room.slug})
              </option>
            ))}
          </select>
        </Field>
      )}

      <div className="space-y-2 rounded-[20px] border border-admin-outline-variant bg-admin-surface-low p-4">
        <label className="text-sm font-bold text-admin-on-surface">Характеристики</label>
        <SpecsEditor control={anyControl} register={register} />
      </div>

      <div className="flex flex-wrap gap-6 rounded-[20px] border border-admin-outline-variant bg-admin-surface-low p-4">
        <label className="flex items-center gap-2 text-sm font-bold">
          <Switch checked={watch('isBestseller')} onCheckedChange={(checked) => setValue('isBestseller', checked)} />{' '}
          Хит продаж
        </label>
        <label className="flex items-center gap-2 text-sm font-bold">
          <Switch checked={watch('active')} onCheckedChange={(checked) => setValue('active', checked)} /> Активен
        </label>
      </div>

      <section className="space-y-3">
        <div>
          <h3 className="font-admin-head text-[22px] font-extrabold tracking-[-.035em] text-admin-on-surface">
            Опции и SKU
          </h3>
          <p className="text-sm text-admin-on-surface-variant">
            Существующий остаток изменяется только в консоли остатков.
          </p>
        </div>
        {optionGroups?.map((group) => (
          <div
            key={group.id ?? group.slug}
            className="rounded-[16px] border border-admin-outline-variant bg-admin-surface-low p-3 text-sm"
          >
            <span className="font-bold">{group.name}</span>: {group.values.map((value) => value.name).join(', ')}
          </div>
        ))}
        {axes.length > 0 && (
          <SkuMatrix
            axes={axes}
            existing={existingForMatrix({ ...defaults, optionGroups: optionGroups ?? [] })}
            onChange={setMatrixResult}
          />
        )}
        {typeof errors.skus?.message === 'string' && <p className="text-sm text-admin-error">{errors.skus.message}</p>}
      </section>

      {serverError && <p className="text-sm text-admin-error">{serverError}</p>}
      <div className="flex flex-wrap gap-3 border-t border-admin-outline-variant pt-[22px]">
        <Button type="submit" loading={isSubmitting}>
          {initial ? 'Сохранить' : 'Создать'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push('/admin/catalog/products')}>
          Отмена
        </Button>
      </div>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-[12px] font-extrabold uppercase tracking-[.06em] text-admin-on-surface-variant">
        {label}
      </label>
      {children}
      {error && <p className="text-sm text-admin-error">{error}</p>}
    </div>
  );
}
