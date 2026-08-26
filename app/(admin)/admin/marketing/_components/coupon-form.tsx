'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/admin/ui/button';
import { Input } from '@/components/admin/ui/input';
import { Switch } from '@/components/admin/ui/switch';
import { couponSchema, type CouponValues } from '@/services/dto/coupon-admin.dto';
import { createCoupon, updateCoupon } from '@/app/actions/admin/coupons';

export type CouponFormProps = {
  mode: 'create' | 'edit';
  coupon?: { id: string; code: string; percent: number; active: boolean; expiresAt: string };
};

export function CouponForm({ mode, coupon }: CouponFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CouponValues>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: coupon?.code ?? '',
      percent: coupon?.percent ?? 10,
      active: coupon?.active ?? true,
      expiresAt: coupon?.expiresAt ?? '',
    },
  });

  const active = watch('active');

  async function onSubmit(values: CouponValues) {
    setServerError(null);
    const res = mode === 'edit' && coupon ? await updateCoupon(coupon.id, values) : await createCoupon(values);
    if (!res.ok) {
      setServerError(res.error);
      return;
    }
    router.push('/admin/marketing');
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-[22px]">
      <div className="space-y-1">
        <label className="text-[12px] font-extrabold uppercase tracking-[.06em] text-admin-on-surface-variant">
          Код
        </label>
        <Input
          {...register('code', {
            // Косметический uppercase на клиенте; сервер повторно нормализует код перед валидацией.
            onBlur: (e) => setValue('code', e.target.value.trim().toUpperCase()),
          })}
          placeholder="EVIRONN15"
          autoCapitalize="characters"
        />
        {errors.code && <p className="text-sm text-admin-error">{errors.code.message}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-[12px] font-extrabold uppercase tracking-[.06em] text-admin-on-surface-variant">
          Скидка, %
        </label>
        <Input type="number" min={1} max={100} {...register('percent')} placeholder="10" />
        {errors.percent && <p className="text-sm text-admin-error">{errors.percent.message}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-[12px] font-extrabold uppercase tracking-[.06em] text-admin-on-surface-variant">
          Действует до
        </label>
        <Input type="date" {...register('expiresAt')} />
        <p className="text-xs text-admin-on-surface-variant">Оставьте пустым для бессрочного промокода.</p>
        {errors.expiresAt && <p className="text-sm text-admin-error">{errors.expiresAt.message}</p>}
      </div>

      <div className="flex items-center gap-3 rounded-[20px] border border-admin-outline-variant bg-admin-surface-low p-4">
        <Switch aria-label="Промокод активен" checked={active} onCheckedChange={(v) => setValue('active', v)} />
        <span className="text-sm font-bold text-admin-on-surface">Активен</span>
      </div>

      {serverError && <p className="text-sm text-admin-error">{serverError}</p>}

      <div className="flex flex-wrap gap-3 border-t border-admin-outline-variant pt-[22px]">
        <Button type="submit" loading={isSubmitting}>
          {mode === 'edit' ? 'Сохранить' : 'Создать'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push('/admin/marketing')}>
          Отмена
        </Button>
      </div>
    </form>
  );
}
