'use client';

import { useFieldArray, type Control, type UseFormRegister } from 'react-hook-form';
import { Button } from '@/components/admin/ui/button';
import { Input } from '@/components/admin/ui/input';
import { Icon } from '@/components/admin/icon';

export function SpecsEditor({
  control,
  register,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: UseFormRegister<any>;
}) {
  const { fields, append, remove } = useFieldArray({ control, name: 'specs' });
  return (
    <div className="space-y-2.5">
      {fields.map((f, i) => (
        <div key={f.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] items-center gap-2">
          <Input placeholder="Характеристика" {...register(`specs.${i}.key`)} />
          <Input placeholder="Значение" {...register(`specs.${i}.value`)} />
          <button
            type="button"
            aria-label="Удалить характеристику"
            onClick={() => remove(i)}
            className="text-admin-on-surface-variant hover:text-admin-error"
          >
            <Icon name="delete" />
          </button>
        </div>
      ))}
      <Button type="button" variant="ghost" size="sm" onClick={() => append({ key: '', value: '' })}>
        + Добавить характеристику
      </Button>
    </div>
  );
}
