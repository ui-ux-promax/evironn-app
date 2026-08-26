'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/admin/ui/button';
import { Input } from '@/components/admin/ui/input';
import { ImageUploader } from '@/components/admin/media/image-uploader';
import { categorySchema, type CategoryValues } from '@/services/dto/category.dto';
import { slugify } from '@/lib/slugify';
import type { UploadedImage } from '@/lib/cloudinary/types';
import { EVIRONN_CATEGORIES_FOLDER } from '@/lib/cloudinary/folders';
import { createCategory, setCategoryTurntable, updateCategory } from '@/app/actions/admin/categories';
import type { AdminCatalogProductRow, AdminCategoryRow } from '@/lib/admin/catalog';

export interface CategoryFormInitial {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  coverImage: string | null;
  coverImagePublicId: string | null;
}

export function CategoryForm({ initial }: { initial?: CategoryFormInitial }) {
  const router = useRouter();
  const [cover, setCover] = React.useState<UploadedImage | null>(
    initial?.coverImage && initial.coverImagePublicId
      ? {
          publicId: initial.coverImagePublicId,
          url: initial.coverImage,
          width: 0,
          height: 0,
          format: '',
          bytes: 0,
          persisted: true,
        }
      : null,
  );
  const [serverError, setServerError] = React.useState<string | null>(null);
  const slugDirty = React.useRef(Boolean(initial));

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CategoryValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: initial?.name ?? '',
      slug: initial?.slug ?? '',
      tagline: initial?.tagline ?? '',
    },
  });

  function onNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!slugDirty.current) setValue('slug', slugify(e.target.value));
  }

  async function onSubmit(values: CategoryValues) {
    setServerError(null);
    const payload = {
      ...values,
      coverImage: cover?.url,
      coverImagePublicId: cover?.publicId,
    };
    const res = initial ? await updateCategory(initial.id, payload) : await createCategory(payload);
    if (!res.ok) {
      setServerError(res.error);
      return;
    }
    router.push('/admin/catalog/categories');
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-[22px]">
      <div className="space-y-1">
        <label className="text-[12px] font-extrabold uppercase tracking-[.06em] text-admin-on-surface-variant">
          Название
        </label>
        <Input {...register('name', { onChange: onNameChange })} placeholder="Футболки" />
        {errors.name && <p className="text-sm text-admin-error">{errors.name.message}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-[12px] font-extrabold uppercase tracking-[.06em] text-admin-on-surface-variant">
          Slug
        </label>
        <Input
          {...register('slug', {
            onChange: () => {
              slugDirty.current = true;
            },
          })}
          placeholder="tees"
        />
        {errors.slug && <p className="text-sm text-admin-error">{errors.slug.message}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-[12px] font-extrabold uppercase tracking-[.06em] text-admin-on-surface-variant">
          Подпись
        </label>
        <Input {...register('tagline')} placeholder="База на каждый день" />
        {errors.tagline && <p className="text-sm text-admin-error">{errors.tagline.message}</p>}
      </div>

      <div className="space-y-2 rounded-[20px] border border-admin-outline-variant bg-admin-surface-low p-4">
        <label className="text-[12px] font-extrabold uppercase tracking-[.06em] text-admin-on-surface-variant">
          Обложка
        </label>
        <ImageUploader
          value={cover ? [cover] : []}
          onChange={(imgs) => setCover(imgs[0] ?? null)}
          folder={EVIRONN_CATEGORIES_FOLDER}
          max={1}
        />
      </div>

      {serverError && <p className="text-sm text-admin-error">{serverError}</p>}

      <div className="flex flex-wrap gap-3 border-t border-admin-outline-variant pt-[22px]">
        <Button type="submit" loading={isSubmitting}>
          {initial ? 'Сохранить' : 'Создать'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push('/admin/catalog')}>
          Отмена
        </Button>
      </div>
    </form>
  );
}

type TurntableProductOption = Pick<AdminCatalogProductRow, 'id' | 'name' | 'slug' | 'turntableReady'>;

export function CategoryTurntableBinding({
  category,
  products,
}: {
  category: Pick<AdminCategoryRow, 'id' | 'name' | 'turntableProductId'>;
  products: TurntableProductOption[];
}) {
  const router = useRouter();
  const [productId, setProductId] = React.useState(category.turntableProductId ?? '');
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const eligibleProducts = products.filter(
    (product) => product.turntableReady || product.id === category.turntableProductId,
  );

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);
    setIsSubmitting(true);
    try {
      const result = await setCategoryTurntable({ categoryId: category.id, productId: productId || null });
      if (!result.ok) {
        setServerError(result.error);
        return;
      }
      router.refresh();
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Не удалось сохранить привязку 360');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-[18px] border border-admin-outline-variant bg-admin-surface-low p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-bold text-admin-on-surface">{category.name}</p>
          <p className="text-xs text-admin-on-surface-variant">Ровно один video, poster и fallback в товаре</p>
        </div>
        <span className="text-xs font-bold text-admin-on-surface-variant">
          {category.turntableProductId ? 'Привязан' : 'Не привязан'}
        </span>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="min-w-0 flex-1 space-y-1">
          <span className="text-[12px] font-extrabold uppercase tracking-[.06em] text-admin-on-surface-variant">
            Товар для 360
          </span>
          <select
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
            data-testid="admin-category-turntable-select"
            className="h-12 w-full rounded-[14px] border border-admin-outline-variant bg-admin-surface px-3 text-sm text-admin-on-surface"
          >
            <option value="">Не привязан</option>
            {eligibleProducts.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} · {product.slug}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit" loading={isSubmitting}>
          Сохранить 360
        </Button>
      </div>
      {serverError && <p className="text-sm text-admin-error">{serverError}</p>}
    </form>
  );
}
