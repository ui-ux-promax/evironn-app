'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/admin/ui/button';
import { Input } from '@/components/admin/ui/input';
import { slugify } from '@/lib/slugify';
import { optionGroupSchema, type OptionGroupValues } from '@/services/dto/option-group.dto';
import { saveOptionGroup } from '@/app/actions/admin/option-groups';
import { OptionValueEditor } from './option-value-editor';

const EMPTY_VALUE = { name: '', slug: '', swatchHex: null, sortOrder: 0 };

export function OptionGroupForm({ initial }: { initial?: OptionGroupValues }) {
  const router = useRouter();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const slugDirty = React.useRef(Boolean(initial));
  const form = useForm<OptionGroupValues>({
    resolver: zodResolver(optionGroupSchema),
    defaultValues: initial ?? { name: '', slug: '', sortOrder: 0, values: [EMPTY_VALUE] },
  });
  const { register, control, setValue, handleSubmit, formState } = form;
  const values = useFieldArray({ control, name: 'values', keyName: 'key' });

  async function onSubmit(input: OptionGroupValues) {
    setServerError(null);
    const result = await saveOptionGroup(input);
    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    router.push('/admin/catalog/options');
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-[22px]">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className="space-y-1 text-[12px] font-extrabold uppercase tracking-[.06em] text-admin-on-surface-variant">
          Название
          <Input
            {...register('name', {
              onChange: (event) => {
                if (!slugDirty.current) setValue('slug', slugify(event.target.value));
              },
            })}
            placeholder="Отделка"
          />
          {formState.errors.name?.message && (
            <span className="text-sm text-admin-error">{formState.errors.name.message}</span>
          )}
        </label>
        <label className="space-y-1 text-[12px] font-extrabold uppercase tracking-[.06em] text-admin-on-surface-variant">
          Slug
          <Input {...register('slug', { onChange: () => (slugDirty.current = true) })} placeholder="finish" />
          {formState.errors.slug?.message && (
            <span className="text-sm text-admin-error">{formState.errors.slug.message}</span>
          )}
        </label>
        <label className="space-y-1 text-[12px] font-extrabold uppercase tracking-[.06em] text-admin-on-surface-variant">
          Порядок
          <Input type="number" {...register('sortOrder', { valueAsNumber: true })} />
          {formState.errors.sortOrder?.message && (
            <span className="text-sm text-admin-error">{formState.errors.sortOrder.message}</span>
          )}
        </label>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-admin-head text-[22px] font-extrabold tracking-[-.035em] text-admin-on-surface">
            Значения
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => values.append({ ...EMPTY_VALUE, sortOrder: values.fields.length })}
          >
            Добавить значение
          </Button>
        </div>
        {values.fields.map((field, index) => (
          <OptionValueEditor
            key={field.key}
            index={index}
            register={register}
            onRemove={() => values.remove(index)}
            canRemove={values.fields.length > 1}
          />
        ))}
        {typeof formState.errors.values?.message === 'string' && (
          <p className="text-sm text-admin-error">{formState.errors.values.message}</p>
        )}
      </div>

      {serverError && <p className="text-sm text-admin-error">{serverError}</p>}
      <div className="flex flex-wrap gap-3 border-t border-admin-outline-variant pt-[22px]">
        <Button type="submit" loading={formState.isSubmitting}>
          {initial ? 'Сохранить' : 'Создать'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push('/admin/catalog/options')}>
          Отмена
        </Button>
      </div>
    </form>
  );
}
