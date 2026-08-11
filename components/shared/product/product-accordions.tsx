'use client';

import { ChevronDown } from 'lucide-react';

interface ProductAccordionsProps {
  description: string | null;
  specs: Record<string, string> | null;
}

export function ProductAccordions({ description, specs }: ProductAccordionsProps) {
  return (
    <div className="mt-4">
      {description && (
        <details className="group border-t border-line" open>
          <summary className="flex items-center justify-between list-none py-[18px] px-0.5 font-display font-bold text-base cursor-pointer select-none [&::-webkit-details-marker]:hidden">
            <span>Описание</span>
            <ChevronDown className="w-5 h-5 text-ink-muted transition-transform duration-300 group-open:rotate-180" />
          </summary>
          <div className="pb-5 px-0.5 text-ink-muted text-sm leading-[1.65]">
            <p>{description}</p>
          </div>
        </details>
      )}

      {specs && Object.keys(specs).length > 0 && (
        <details className="group border-t border-line">
          <summary className="flex items-center justify-between list-none py-[18px] px-0.5 font-display font-bold text-base cursor-pointer select-none [&::-webkit-details-marker]:hidden">
            <span>Характеристики</span>
            <ChevronDown className="w-5 h-5 text-ink-muted transition-transform duration-300 group-open:rotate-180" />
          </summary>
          <dl className="pb-5 px-0.5 divide-y divide-line text-sm">
            {Object.entries(specs).map(([key, value]) => (
              <div key={key} className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 py-3 first:pt-0">
                <dt className="text-ink-muted">{key}</dt>
                <dd className="text-right font-medium text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </details>
      )}

      <details className="group border-t border-line">
        <summary className="flex items-center justify-between list-none py-[18px] px-0.5 font-display font-bold text-base cursor-pointer select-none [&::-webkit-details-marker]:hidden">
          <span>Доставка и оплата</span>
          <ChevronDown className="w-5 h-5 text-ink-muted transition-transform duration-300 group-open:rotate-180" />
        </summary>
        <div className="pb-5 px-0.5 text-ink-muted text-sm leading-[1.65] grid gap-2.5">
          <div className="flex items-center gap-3 p-3.5 border border-line rounded-[14px] bg-surface">
            <span className="w-[38px] h-[38px] rounded-full bg-surface-soft grid place-items-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 7h11v8H3zM14 10h4l3 3v2h-7z" />
                <circle cx="7" cy="18" r="1.6" />
                <circle cx="17.5" cy="18" r="1.6" />
              </svg>
            </span>
            <div>
              <b className="block text-[13.5px] text-ink font-bold">Бесплатная стандартная доставка</b>
              <span className="text-[12.5px]">При заказе от 5 000 ₽</span>
            </div>
            <span className="ml-auto text-[12.5px] text-ink-muted whitespace-nowrap">2–4 дня</span>
          </div>
          <div className="flex items-center gap-3 p-3.5 border border-line rounded-[14px] bg-surface">
            <span className="w-[38px] h-[38px] rounded-full bg-surface-soft grid place-items-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M21 16V8l-9-5-9 5v8l9 5z" />
                <path d="m3.3 7 8.7 5 8.7-5" />
                <path d="M12 22V12" />
              </svg>
            </span>
            <div>
              <b className="block text-[13.5px] text-ink font-bold">Курьер или пункт выдачи</b>
              <span className="text-[12.5px]">СДЭК, Boxberry, Почта России</span>
            </div>
            <span className="ml-auto text-[12.5px] text-ink-muted whitespace-nowrap">от 0 ₽</span>
          </div>
          <div className="flex items-center gap-3 p-3.5 border border-line rounded-[14px] bg-surface">
            <span className="w-[38px] h-[38px] rounded-full bg-surface-soft grid place-items-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 10h18M3 10V7a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v3M3 10v7a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-7" />
              </svg>
            </span>
            <div>
              <b className="block text-[13.5px] text-ink font-bold">Оплата при получении</b>
              <span className="text-[12.5px]">Картой или наличными</span>
            </div>
            <span className="ml-auto text-[12.5px] text-ink-muted whitespace-nowrap">14 дней на возврат</span>
          </div>
        </div>
      </details>
    </div>
  );
}
