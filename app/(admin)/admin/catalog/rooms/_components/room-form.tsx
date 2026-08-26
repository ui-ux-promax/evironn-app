'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { saveRoom } from '@/app/actions/admin/rooms';
import { Button } from '@/components/admin/ui/button';
import { Input } from '@/components/admin/ui/input';
import { slugify } from '@/lib/slugify';
import { roomSchema, type RoomValues } from '@/services/dto/room.dto';

export type RoomFormInitial = Pick<RoomValues, 'id' | 'name' | 'slug' | 'sortOrder'>;

export function RoomForm({ initial }: { initial?: RoomFormInitial }) {
  const router = useRouter();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const slugDirty = React.useRef(Boolean(initial));
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RoomValues>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      id: initial?.id,
      name: initial?.name ?? '',
      slug: initial?.slug ?? '',
      sortOrder: initial?.sortOrder ?? 0,
    },
  });

  function onNameChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (!slugDirty.current) setValue('slug', slugify(event.target.value));
  }

  async function onSubmit(values: RoomValues) {
    setServerError(null);
    const result = await saveRoom(values);
    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    router.push('/admin/catalog/rooms');
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-[22px]">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Название" error={errors.name?.message}>
          <Input
            {...register('name', { onChange: onNameChange })}
            placeholder="Гостиная"
            data-testid="admin-rooms-form-name"
          />
        </Field>
        <Field label="Slug" error={errors.slug?.message}>
          <Input
            {...register('slug', {
              onChange: () => {
                slugDirty.current = true;
              },
            })}
            placeholder="living-room"
            data-testid="admin-rooms-form-slug"
          />
        </Field>
        <Field label="Порядок" error={errors.sortOrder?.message}>
          <Input
            type="number"
            {...register('sortOrder', { valueAsNumber: true })}
            data-testid="admin-rooms-form-sort-order"
          />
        </Field>
      </div>

      {serverError && <p className="text-sm text-admin-error">{serverError}</p>}

      <div className="flex flex-wrap gap-3 border-t border-admin-outline-variant pt-[22px]">
        <Button type="submit" loading={isSubmitting}>
          {initial ? 'Сохранить' : 'Создать'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push('/admin/catalog/rooms')}>
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
