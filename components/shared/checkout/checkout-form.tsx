'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/lib/format';
import { calcShipping } from '@/lib/order';
import { FREE_SHIPPING_THRESHOLD } from '@/constants/config';
import { checkoutSchema, type CheckoutValues } from '@/services/dto/order.dto';
import { placeOrder } from '@/app/actions/order';
import { AddressSuggest } from './address-suggest';
import { PromoCodeField } from '@/components/shared/promo-code-field';
import { useCouponStore } from '@/store/coupon';
import type { CheckoutDefaults } from '@/lib/checkout-defaults';
import type { CartDetails } from '@/services/dto/cart.dto';

const SHIP_INFO = {
  courier: { label: 'Курьер', desc: '2–4 дня, от 390 ₽' },
  pickup: { label: 'Пункт выдачи', desc: '2–5 дней', extra: `Бесплатно от ${formatPrice(FREE_SHIPPING_THRESHOLD)}` },
} as const;

export function CheckoutForm({
  details,
  defaults,
  buyNowVariantId,
}: {
  details: CartDetails;
  defaults: CheckoutDefaults;
  buyNowVariantId?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const coupon = useCouponStore((state) => state.coupon);

  const methods = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { ...defaults, shippingMethod: 'courier', paymentMethod: 'online' },
  });
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = methods;
  const addressLineRegistration = register('addressLine');

  const shippingMethod = watch('shippingMethod');
  const paymentMethod = watch('paymentMethod');
  const shipping = calcShipping(details.totalAmount, shippingMethod);
  const discount = coupon ? Math.floor((details.totalAmount * coupon.percent) / 100) : 0;
  const total = details.totalAmount - discount + shipping;

  useEffect(() => {
    setValue('couponCode', coupon?.code ?? '');
  }, [coupon?.code, setValue]);

  const onSubmit = async (v: CheckoutValues) => {
    setError(null);
    const res = await placeOrder({ ...v, buyNowVariantId });
    if (!res.ok) {
      setError('paymentInitialization' in res ? res.paymentInitialization.heading : res.error);
      return;
    }
    if (res.paymentUrl) {
      window.location.href = res.paymentUrl;
      return;
    }
    router.push(`/orders/${res.orderNumber}`);
    router.refresh();
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <input type="hidden" {...register('couponCode')} />
        <input type="hidden" {...register('city')} />

        <div className="grid lg:grid-cols-[minmax(0,1fr)_400px] gap-7 mt-[22px] items-start">
          {/* LEFT — form sections */}
          <div>
            {/* 1. Contact */}
            <section className="grid gap-4 rounded-[20px] border border-line bg-surface p-4 sm:rounded-[24px] sm:p-[22px]">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 grid place-items-center rounded-full bg-primary text-primary-foreground font-display font-bold text-sm">
                  1
                </span>
                <h2 className="font-display font-bold text-[17px] tracking-tight">Контактные данные</h2>
              </div>
              <div className="grid gap-2">
                <label className="text-ink-muted text-xs font-bold uppercase tracking-wider" htmlFor="contactEmail">
                  E-mail
                </label>
                <input
                  id="contactEmail"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...register('contactEmail')}
                  className="h-12 px-3.5 border border-line rounded-[14px] bg-surface text-sm outline-none transition-colors hover:border-ink/24 placeholder:text-ink-muted/70"
                />
                {errors.contactEmail && (
                  <span className="text-danger text-xs font-semibold">{errors.contactEmail.message}</span>
                )}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-ink-muted text-xs font-bold uppercase tracking-wider" htmlFor="contactName">
                    Имя
                  </label>
                  <input
                    id="contactName"
                    type="text"
                    autoComplete="name"
                    placeholder="Иван Иванов"
                    {...register('contactName')}
                    className="h-12 px-3.5 border border-line rounded-[14px] bg-surface text-sm outline-none transition-colors hover:border-ink/24 placeholder:text-ink-muted/70"
                  />
                  {errors.contactName && (
                    <span className="text-danger text-xs font-semibold">{errors.contactName.message}</span>
                  )}
                </div>
                <div className="grid gap-2">
                  <label className="text-ink-muted text-xs font-bold uppercase tracking-wider" htmlFor="contactPhone">
                    Телефон
                  </label>
                  <input
                    id="contactPhone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+7 999 123-45-67"
                    {...register('contactPhone')}
                    className="h-12 px-3.5 border border-line rounded-[14px] bg-surface text-sm outline-none transition-colors hover:border-ink/24 placeholder:text-ink-muted/70"
                  />
                  {errors.contactPhone && (
                    <span className="text-danger text-xs font-semibold">{errors.contactPhone.message}</span>
                  )}
                </div>
              </div>
            </section>

            {/* 2. Address */}
            <section className="mt-4 grid gap-4 rounded-[20px] border border-line bg-surface p-4 sm:rounded-[24px] sm:p-[22px]">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 grid place-items-center rounded-full bg-primary text-primary-foreground font-display font-bold text-sm">
                  2
                </span>
                <h2 className="font-display font-bold text-[17px] tracking-tight">Адрес доставки</h2>
              </div>
              <div className="grid gap-2 relative">
                <label className="text-ink-muted text-xs font-bold uppercase tracking-wider" htmlFor="addressLine">
                  Адрес
                </label>
                <input
                  id="addressLine"
                  autoComplete="off"
                  placeholder="Город, улица, дом, квартира"
                  {...addressLineRegistration}
                  onChange={(e) => {
                    void addressLineRegistration.onChange(e);
                    if (e.target.value !== defaults.addressLine) setValue('city', '');
                  }}
                  className="h-12 px-3.5 border border-line rounded-[14px] bg-surface text-sm outline-none transition-colors hover:border-ink/24 placeholder:text-ink-muted/70"
                />
                <AddressSuggest />
                {errors.addressLine && (
                  <span className="text-danger text-xs font-semibold">{errors.addressLine.message}</span>
                )}
              </div>
              <div className="grid gap-2">
                <label className="text-ink-muted text-xs font-bold uppercase tracking-wider" htmlFor="addressComment">
                  Комментарий
                </label>
                <input
                  id="addressComment"
                  type="text"
                  placeholder="Квартира, этаж, код домофона"
                  {...register('addressComment')}
                  className="h-12 px-3.5 border border-line rounded-[14px] bg-surface text-sm outline-none transition-colors hover:border-ink/24 placeholder:text-ink-muted/70"
                />
              </div>
            </section>

            {/* 3. Delivery */}
            <section className="mt-4 grid gap-4 rounded-[20px] border border-line bg-surface p-4 sm:rounded-[24px] sm:p-[22px]">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 grid place-items-center rounded-full bg-primary text-primary-foreground font-display font-bold text-sm">
                  3
                </span>
                <h2 className="font-display font-bold text-[17px] tracking-tight">Способ доставки</h2>
              </div>
              <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label="Способ доставки">
                {(['courier', 'pickup'] as const).map((method) => {
                  const info = SHIP_INFO[method];
                  const isActive = shippingMethod === method;
                  return (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setValue('shippingMethod', method, { shouldValidate: true })}
                      className={`flex-1 min-w-[140px] p-3.5 border rounded-[16px] bg-surface flex flex-col gap-1.5 cursor-pointer transition-colors ${isActive ? 'border-primary bg-primary/3' : 'border-line hover:border-ink/30'}`}
                    >
                      <b className="text-sm font-bold">{info.label}</b>
                      <span className="text-ink-muted text-[12.5px]">{info.desc}</span>
                      {'extra' in info && info.extra && (
                        <span className="text-accent text-xs font-bold">{info.extra}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 4. Payment */}
            <section className="mt-4 grid gap-4 rounded-[20px] border border-line bg-surface p-4 sm:rounded-[24px] sm:p-[22px]">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 grid place-items-center rounded-full bg-primary text-primary-foreground font-display font-bold text-sm">
                  4
                </span>
                <h2 className="font-display font-bold text-[17px] tracking-tight">Способ оплаты</h2>
              </div>
              <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label="Способ оплаты">
                {(
                  [
                    { value: 'online', label: 'Карта онлайн' },
                    { value: 'cod', label: 'Картой при получении' },
                  ] as const
                ).map((opt) => {
                  const isActive = paymentMethod === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setValue('paymentMethod', opt.value, { shouldValidate: true })}
                      className={`flex-1 min-w-[140px] p-3.5 border rounded-[16px] bg-surface flex items-center gap-2.5 cursor-pointer transition-colors ${isActive ? 'border-primary bg-primary/3' : 'border-line hover:border-ink/30'}`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full border grid place-items-center transition-colors ${isActive ? 'border-primary bg-primary' : 'border-line'}`}
                      >
                        {isActive && <span className="w-2 h-2 rounded-full bg-surface" />}
                      </span>
                      <b className="text-sm font-bold">{opt.label}</b>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          {/* RIGHT — sticky summary */}
          <div className="self-stretch">
            <div className="lg:sticky lg:top-[140px] border border-line rounded-[24px] bg-surface grid gap-3.5">
              {/* Head */}
              <div className="pt-5 px-[22px]">
                <h2 className="font-display font-bold text-[18px] tracking-tight">Ваш заказ</h2>
              </div>

              {/* Items */}
              <div className="px-[22px]">
                {details.items.map((it) => (
                  <div key={it.id} className="flex items-center gap-3 py-2.5 border-t border-line first:border-t-0">
                    <div className="w-[52px] h-[58px] shrink-0 rounded-[10px] overflow-hidden bg-surface-soft border border-line">
                      {it.imageUrl && (
                        <Image
                          src={it.imageUrl}
                          alt={it.name}
                          width={52}
                          height={58}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <b className="block text-[13px] font-bold truncate">{it.name}</b>
                      <span className="text-[11.5px] text-ink-muted">
                        {it.colorwayName} · {it.size}
                        {it.quantity > 1 ? ` × ${it.quantity}` : ''}
                      </span>
                    </div>
                    <span className="text-accent font-bold text-[13px] tnum whitespace-nowrap">
                      {formatPrice(it.lineTotal)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Foot */}
              <div className="px-[22px] pb-[22px] grid gap-3.5">
                {/* Ship msg */}
                <div className="flex items-center gap-1.5 text-accent text-[12.5px] font-semibold">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  {shipping === 0 ? 'Бесплатная доставка' : `Доставка: ${formatPrice(shipping)}`}
                </div>

                {/* Promo */}
                <PromoCodeField />

                {/* Rows */}
                <div className="grid gap-2.5 border-t border-line pt-4">
                  <div className="flex items-center justify-between gap-3 text-sm text-ink-muted">
                    <span>Товары ({details.items.reduce((a, i) => a + i.quantity, 0)})</span>
                    <span className="text-ink font-semibold tnum">{formatPrice(details.totalAmount)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex items-center justify-between gap-3 text-sm text-ink-muted">
                      <span>Скидка</span>
                      <span className="text-accent font-semibold tnum">−{formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-3 text-sm text-ink-muted">
                    <span>Доставка</span>
                    <span className="text-ink font-semibold tnum">
                      {shipping === 0 ? 'Бесплатно' : formatPrice(shipping)}
                    </span>
                  </div>
                </div>

                {/* Total */}
                <div className="flex items-baseline justify-between gap-3 border-t border-line pt-4">
                  <span className="font-display font-bold text-[17px] tracking-tight">Итого к оплате</span>
                  <span className="font-display font-bold text-[26px] tnum tracking-tight">{formatPrice(total)}</span>
                </div>

                {/* Safe note */}
                <div className="flex items-center justify-center gap-1.5 text-ink-muted text-xs">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="4" y="10.5" width="16" height="10" rx="2.5" />
                    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
                  </svg>
                  Безопасная оплата · возврат 14 дней
                </div>

                {/* Error */}
                {error && (
                  <p className="text-danger text-sm font-semibold" role="alert">
                    {error}
                  </p>
                )}

                {/* Pay button */}
                {process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && paymentMethod === 'online' && (
                  <p role="status" className="rounded-xl border border-black/10 bg-black/[.03] px-4 py-3 text-sm">
                    <strong>Тестовая оплата.</strong> Деньги не списываются; используйте тестовый сценарий YooKassa.
                  </p>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-14 rounded-full bg-primary text-primary-foreground text-[16px] font-bold inline-flex items-center justify-center gap-2.5 w-full hover:bg-footer transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    'Проверяем данные…'
                  ) : (
                    <>
                      Оплатить <span className="tnum">{formatPrice(total)}</span>
                    </>
                  )}
                  {!isSubmitting && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
