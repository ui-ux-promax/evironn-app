'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertModal } from '@/components/admin/ui/alert-modal';
import { Button } from '@/components/admin/ui/button';
import { Icon } from '@/components/admin/icon';
import { Input } from '@/components/admin/ui/input';
import { Switch } from '@/components/admin/ui/switch';
import { ImageUploader } from '@/components/admin/media/image-uploader';
import type { UploadedImage } from '@/lib/cloudinary/types';
import { EVIRONN_PRODUCTS_FOLDER } from '@/lib/cloudinary/folders';
import { slugify } from '@/lib/slugify';
import { furnitureProductSchema, type FurnitureProductValues } from '@/services/dto/product.dto';
import { deleteFurnitureProduct, saveFurnitureProduct } from '@/app/actions/admin/products';
import { SpecsEditor } from './specs-editor';
import { SkuMatrix } from './sku-matrix';
import { buildSkuMatrix, type SkuMatrixResult } from '@/lib/admin/sku-matrix';
import type { AdminRoomRow } from '@/lib/admin/catalog';

export interface ProductFormInitial extends FurnitureProductValues {
  id: string;
}

type ProductSkuMedia = NonNullable<FurnitureProductValues['skus'][number]['media']>;
type ProductMedia = FurnitureProductValues['media'][number];

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
const TURNTABLE_KINDS = ['TURN_TABLE_VIDEO', 'TURN_TABLE_POSTER', 'TURN_TABLE_FALLBACK'] as const;
const TURNTABLE_LABELS: Record<(typeof TURNTABLE_KINDS)[number], string> = {
  TURN_TABLE_VIDEO: 'Turntable video',
  TURN_TABLE_POSTER: 'Poster',
  TURN_TABLE_FALLBACK: 'Fallback',
};

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
      media: sku.media ?? [],
    }));
}

export function ProductForm({
  initial,
  initialValues,
  categories,
  brands,
  availableRooms = [],
  detachOptionGroupIds = [],
  detachOptionValueIds = [],
}: {
  initial?: ProductFormInitial;
  initialValues?: FurnitureProductValues;
  categories: { id: string; name: string }[];
  brands: string[];
  availableRooms?: Pick<AdminRoomRow, 'id' | 'name' | 'slug'>[];
  detachOptionGroupIds?: string[];
  detachOptionValueIds?: string[];
}) {
  const router = useRouter();
  const defaults = initial ?? initialValues ?? EMPTY;
  const isEdit = Boolean(initial);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const slugDirty = React.useRef(Boolean(initial));
  const [matrixResult, setMatrixResult] = React.useState<SkuMatrixResult>(() =>
    buildSkuMatrix({ axes: axesFromValues(defaults), existing: existingForMatrix(defaults) }),
  );
  const [newSkuMedia, setNewSkuMedia] = React.useState<Record<string, ProductSkuMedia>>({});
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
  const optionGroups = watch('optionGroups') ?? [];
  const watchedMedia = watch('media') ?? [];
  const watchedSkus = watch('skus') ?? [];
  const active = watch('active');
  const isBestseller = watch('isBestseller');
  const turntable = watch('turntable');
  const selectedCategoryId = watch('categoryId');
  const selectedRoomIds = watch('roomIds') ?? [];
  const selectedCategory = categories.find((category) => category.id === selectedCategoryId);
  const selectedRooms = availableRooms.filter((room) => selectedRoomIds.includes(room.slug));
  const axes = React.useMemo(() => axesFromValues({ ...defaults, optionGroups }), [defaults, optionGroups]);

  React.useEffect(() => {
    setMatrixResult(buildSkuMatrix({ axes, existing: existingForMatrix({ ...defaults, optionGroups }) }));
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
      ...(row.skuId
        ? (() => {
            const existingSku = values.skus.find((sku) => sku.id === row.skuId);
            return existingSku ? { media: existingSku.media } : {};
          })()
        : { media: newSkuMedia[row.combinationKey] ?? [] }),
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

  async function onDelete() {
    if (!initial) return;
    setDeleting(true);
    setServerError(null);
    const result = await deleteFurnitureProduct({ productId: initial.id });
    setDeleting(false);
    if (!result.ok) {
      setDeleteOpen(false);
      setServerError(result.error);
      return;
    }
    router.push('/admin/catalog/products');
  }

  function updateProductImages(images: UploadedImage[]) {
    const existingImages = watchedMedia.filter((media) => media.kind === 'IMAGE');
    const nextImages = images.map((image, index) => {
      const previous = existingImages.find((media) => media.publicId === image.publicId);
      return {
        id: previous?.id,
        kind: 'IMAGE' as const,
        url: image.url,
        publicId: image.publicId,
        alt: image.alt,
        sortOrder: index,
      };
    });
    setValue(
      'media',
      [
        ...watchedMedia.filter((media) => media.kind !== 'IMAGE'),
        ...watchedMedia.filter((media) => media.kind === 'IMAGE' && !media.publicId),
        ...nextImages,
      ],
      { shouldDirty: true, shouldValidate: true },
    );
  }

  function updateTurntableResource(kind: ProductMedia['kind'], url: string) {
    setValue(
      'media',
      watchedMedia.map((media) => (media.kind === kind ? { ...media, url } : media)),
      { shouldDirty: true, shouldValidate: true },
    );
  }

  function removeTurntableResources() {
    setValue(
      'media',
      watchedMedia.filter((media) => !TURNTABLE_KINDS.includes(media.kind as (typeof TURNTABLE_KINDS)[number])),
      { shouldDirty: true, shouldValidate: true },
    );
    setValue('turntable', false, { shouldDirty: true, shouldValidate: true });
  }

  return (
    <form
      data-testid="admin-product-form"
      onSubmit={handleSubmit(onSubmit, () => setServerError(VALIDATION_ERROR))}
      className="mx-auto min-w-0 max-w-[1500px] space-y-5 overflow-x-clip pb-4"
    >
      <nav className="flex min-w-0 items-center gap-2 overflow-hidden text-xs text-admin-on-surface-variant">
        <a className="shrink-0 hover:text-admin-on-surface" href="/admin/catalog">
          Каталог
        </a>
        <Icon name="chevron_right" className="shrink-0 text-[16px]" />
        <a className="shrink-0 hover:text-admin-on-surface" href="/admin/catalog/products">
          Товары
        </a>
        <Icon name="chevron_right" className="shrink-0 text-[16px]" />
        <span className="truncate text-admin-on-surface">{initial?.name || 'Новый товар'}</span>
      </nav>

      <section
        data-testid="admin-product-form-hero"
        className="flex flex-col gap-4 rounded-[28px] border border-admin-outline-variant bg-admin-surface px-6 py-5 shadow-[var(--admin-shadow-tight)] lg:flex-row lg:items-center lg:justify-between"
      >
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[.12em] text-admin-on-surface-variant">
            Карточка товара
          </p>
          <h1 className="mt-2 truncate font-admin-head text-[clamp(1.8rem,3vw,2.5rem)] font-medium leading-none tracking-[-.02em] text-admin-on-surface">
            {initial?.name || 'Новый товар'}
          </h1>
          <span
            className={`mt-3 inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${
              active ? 'bg-admin-success/10 text-admin-success' : 'bg-admin-surface-low text-admin-on-surface-variant'
            }`}
          >
            {active ? 'Активен' : 'Черновик'}
          </span>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="secondary" disabled className="h-11 rounded-[14px] px-4">
            <Icon name="visibility" className="text-[19px]" />
            Предпросмотр
          </Button>
          <Button type="submit" loading={isSubmitting} className="h-11 rounded-[14px] px-5">
            <Icon name="save" className="text-[19px]" />
            {isEdit ? 'Сохранить' : 'Создать'}
          </Button>
        </div>
      </section>

      <div data-testid="admin-product-form-content" className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-5">
          <FormSection
            testId="admin-product-form-basics"
            title="Основное"
            description="Название, описание и размещение в каталоге"
            meta="* обязательные поля"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Название товара *" error={errors.name?.message} className="md:col-span-2">
                <Input
                  {...register('name', { onChange: onNameChange })}
                  aria-label="Название товара *"
                  placeholder="Название товара"
                  className="mt-2 h-11 rounded-[12px]"
                />
              </Field>
              <Field label="Slug *" error={errors.slug?.message}>
                <Input
                  {...register('slug', { onChange: () => (slugDirty.current = true) })}
                  aria-label="Slug *"
                  placeholder="nazvanie-tovara"
                  className="mt-2 h-11 rounded-[12px]"
                />
              </Field>
              <Field label="Бренд *" error={errors.brand?.message}>
                <Input
                  list="brand-list"
                  {...register('brand')}
                  aria-label="Бренд *"
                  placeholder="Evironn"
                  className="mt-2 h-11 rounded-[12px]"
                />
                <datalist id="brand-list">
                  {brands.map((brand) => (
                    <option key={brand} value={brand} />
                  ))}
                </datalist>
              </Field>
              <Field label="Категория *" error={errors.categoryId?.message}>
                <div className="relative mt-2 h-11">
                  <select
                    {...register('categoryId')}
                    aria-label="Категория *"
                    className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                  >
                    <option value="">Выберите категорию</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <div className="flex h-full items-center justify-between rounded-[12px] border border-admin-outline-variant px-3 text-sm text-admin-on-surface">
                    <span>{selectedCategory?.name || 'Выберите категорию'}</span>
                    <Icon name="expand_more" className="text-admin-on-surface-variant" />
                  </div>
                </div>
              </Field>
              <Field label="Комнаты" error={errors.roomIds?.message}>
                <div className="relative mt-2 min-h-11">
                  <select
                    multiple
                    {...register('roomIds')}
                    aria-label="Комнаты товара"
                    data-testid="admin-product-form-rooms"
                    className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                  >
                    {availableRooms.map((room) => (
                      <option key={room.id} value={room.slug}>
                        {room.name}
                      </option>
                    ))}
                  </select>
                  <div className="flex min-h-11 flex-wrap items-center gap-2 rounded-[12px] border border-admin-outline-variant px-3 py-2 text-sm">
                    {selectedRooms.length > 0 ? (
                      selectedRooms.map((room) => (
                        <span key={room.id} className="rounded-full bg-admin-surface-low px-2.5 py-1 text-xs">
                          {room.name} ×
                        </span>
                      ))
                    ) : (
                      <span className="text-admin-on-surface-variant">Выберите комнаты</span>
                    )}
                    <Icon name="add" className="ml-auto text-admin-primary" />
                  </div>
                </div>
              </Field>
              <Field label="Краткое описание" error={errors.description?.message} className="md:col-span-2">
                <textarea
                  {...register('description')}
                  aria-label="Краткое описание"
                  rows={3}
                  className="mt-2 min-h-[88px] w-full rounded-[12px] border border-admin-outline-variant bg-admin-surface px-3 py-3 text-sm text-admin-on-surface outline-none focus-visible:ring-2 focus-visible:ring-admin-primary"
                />
              </Field>
            </div>
          </FormSection>

          <FormSection
            testId="admin-product-form-media"
            title="Медиа"
            description="Основные изображения, карточка каталога и 360°"
          >
            <ImageUploader
              value={watchedMedia
                .filter((media) => media.kind === 'IMAGE' && Boolean(media.publicId))
                .map((media) => ({
                  publicId: media.publicId as string,
                  url: media.url,
                  width: 0,
                  height: 0,
                  format: 'image',
                  bytes: 0,
                  alt: media.alt ?? undefined,
                  persisted: Boolean(media.id),
                }))}
              onChange={updateProductImages}
              folder={EVIRONN_PRODUCTS_FOLDER}
              max={12}
            />

            <div className="mt-4 rounded-[14px] bg-admin-surface-low p-4" data-testid="admin-product-turntable">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-admin-surface text-admin-primary">
                    <Icon name="360" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-sm">360°-товар</strong>
                      <Switch
                        checked={Boolean(turntable)}
                        onCheckedChange={(checked) =>
                          setValue('turntable', checked, { shouldDirty: true, shouldValidate: true })
                        }
                        aria-label="360°-товар"
                      />
                    </div>
                    <p className="mt-1 text-xs text-admin-on-surface-variant">Три обязательных ресурса одной сцены</p>
                  </div>
                </div>
                <Button type="button" variant="outline" size="sm" disabled>
                  Управлять 360°
                </Button>
              </div>
              {turntable && (
                <>
                  <div className="mt-4 grid gap-2 md:grid-cols-3">
                    {TURNTABLE_KINDS.map((kind) => {
                      const resource = watchedMedia.find((media) => media.kind === kind);
                      return (
                        <div key={kind} className="rounded-[10px] bg-admin-surface p-3">
                          <div className="flex items-center justify-between gap-2">
                            <b className="text-xs">{TURNTABLE_LABELS[kind]}</b>
                            <span className="text-[10px] font-bold text-admin-on-surface-variant">
                              {resource?.url ? 'Загружено' : 'Не загружено'}
                            </span>
                          </div>
                          {resource ? (
                            <Input
                              value={resource.url}
                              aria-label={`${kind} URL`}
                              onChange={(event) => updateTurntableResource(kind, event.target.value)}
                              className="mt-2 h-8 rounded-[8px] text-xs"
                            />
                          ) : (
                            <span className="mt-2 block text-xs text-admin-on-surface-variant">Ресурс не задан</span>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled
                            className="mt-1 px-0 text-admin-primary"
                          >
                            Заменить
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={removeTurntableResources}
                    className="mt-3 text-xs font-bold text-admin-error"
                  >
                    Удалить комплект 360°
                  </button>
                </>
              )}
            </div>
            {typeof errors.media?.message === 'string' && (
              <p className="text-sm text-admin-error">{errors.media.message}</p>
            )}
          </FormSection>

          <FormSection
            testId="admin-product-form-options"
            title="Опции и SKU"
            description="Выберите существующие группы — комбинации сформируются автоматически"
            action={
              <Button type="button" variant="outline" size="sm" disabled>
                <Icon name="add" className="text-[18px]" />
                Добавить группу опций
              </Button>
            }
          >
            <div className="grid gap-3 md:grid-cols-2">
              {optionGroups.map((group) => (
                <div
                  key={group.id ?? group.slug}
                  className="rounded-[14px] border border-admin-outline-variant bg-admin-surface-low p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <b className="text-sm">{group.name}</b>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled
                        className="h-auto min-h-0 px-0 text-admin-primary"
                      >
                        Изменить
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled
                        className="h-auto min-h-0 px-0 text-admin-error"
                      >
                        Убрать
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {group.values.map((value) => (
                      <span key={value.id ?? value.slug} className="rounded-full bg-admin-surface px-2.5 py-1 text-xs">
                        {value.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <span className="rounded-full bg-admin-primary/10 px-3 py-1.5 text-xs font-bold text-admin-primary">
                {matrixResult.rows.length} комбинаций / {matrixResult.rows.length} SKU
              </span>
              <a className="text-xs font-bold text-admin-primary" href="/admin/catalog/options">
                Открыть справочник опций ↗
              </a>
            </div>
            {axes.length > 0 && (
              <div className="mt-4 min-w-0">
                <SkuMatrix
                  axes={axes}
                  existing={existingForMatrix({ ...defaults, optionGroups, skus: watchedSkus })}
                  mediaByCombinationKey={newSkuMedia}
                  onMediaChange={(skuId, combinationKey, media) => {
                    if (skuId) {
                      setValue(
                        'skus',
                        watchedSkus.map((sku) => (sku.id === skuId ? { ...sku, media } : sku)),
                        { shouldDirty: true },
                      );
                    } else {
                      setNewSkuMedia((current) => ({ ...current, [combinationKey]: media }));
                    }
                  }}
                  onChange={setMatrixResult}
                />
              </div>
            )}
            {typeof errors.skus?.message === 'string' && (
              <p className="text-sm text-admin-error">{errors.skus.message}</p>
            )}
          </FormSection>
        </div>

        <aside className="min-w-0 space-y-5">
          <FormSection
            testId="admin-product-form-publication"
            title="Публикация"
            description="Видимость и положение товара"
          >
            <div className={`rounded-[14px] p-4 ${active ? 'bg-admin-success/10' : 'bg-admin-surface-low'}`}>
              <div className="flex items-center justify-between gap-3">
                <b className={`text-sm ${active ? 'text-admin-success' : 'text-admin-on-surface'}`}>
                  {active ? 'Товар активен' : 'Товар не опубликован'}
                </b>
                <Switch
                  data-testid="admin-product-active-switch"
                  checked={Boolean(active)}
                  onCheckedChange={(checked) =>
                    setValue('active', checked, { shouldDirty: true, shouldValidate: true })
                  }
                  aria-label="Активен"
                />
              </div>
              <p className="mt-2 text-xs text-admin-on-surface-variant">
                {active ? 'Доступен в каталоге и поиске' : 'Не отображается в каталоге и поиске'}
              </p>
            </div>
            <label className="mt-4 flex items-center justify-between text-sm text-admin-on-surface">
              Хит продаж
              <Switch
                checked={Boolean(isBestseller)}
                onCheckedChange={(checked) => setValue('isBestseller', checked, { shouldDirty: true })}
                aria-label="Хит продаж"
              />
            </label>
            <Field label="Порядок сортировки" error={errors.sortOrder?.message} className="mt-4">
              <Input
                type="number"
                {...register('sortOrder', { valueAsNumber: true })}
                aria-label="Порядок сортировки"
                className="mt-1.5 h-10 rounded-[10px]"
              />
            </Field>
            <p className="mt-3 text-xs leading-relaxed text-admin-on-surface-variant">
              Активному товару нужен минимум один активный SKU.
            </p>
          </FormSection>

          <FormSection testId="admin-product-form-specs" title="Характеристики" description="Ключевые параметры товара">
            <SpecsEditor control={anyControl} register={register} />
          </FormSection>

          {isEdit && (
            <FormSection testId="admin-product-form-danger" title="Опасная зона" description="Удаление нельзя отменить">
              <Button
                type="button"
                variant="danger"
                onClick={() => setDeleteOpen(true)}
                className="mt-1 w-full justify-center"
              >
                Удалить товар
              </Button>
            </FormSection>
          )}
        </aside>
      </div>

      {serverError && (
        <p
          data-testid="admin-product-form-errors"
          role="alert"
          className="rounded-[12px] bg-admin-error/10 px-3 py-2 text-sm text-admin-error"
        >
          {serverError}
        </p>
      )}

      <AlertModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={onDelete}
        loading={deleting}
        title="Удалить товар?"
        description={initial ? `«${initial.name}» будет удалён безвозвратно.` : undefined}
      />
    </form>
  );
}

function FormSection({
  testId,
  title,
  description,
  meta,
  action,
  children,
}: {
  testId?: string;
  title: string;
  description: string;
  meta?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      data-testid={testId}
      className="min-w-0 rounded-[20px] border border-admin-outline-variant bg-admin-surface p-5 shadow-[var(--admin-shadow-tight)]"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-admin-head text-base font-medium tracking-[-.005em] text-admin-on-surface">{title}</h2>
          <p className="mt-1 text-xs text-admin-on-surface-variant">{description}</p>
        </div>
        {meta && <span className="text-xs text-admin-on-surface-variant">{meta}</span>}
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  error,
  children,
  className = '',
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <div className="text-sm font-medium text-admin-on-surface">{label}</div>
      {children}
      {error && <p className="mt-1 text-sm text-admin-error">{error}</p>}
    </div>
  );
}
