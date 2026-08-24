import { Icon } from '@/components/admin/icon';
import { formatPrice } from '@/lib/format';
import type { BestSeller } from '@/lib/admin/analytics';

export function BestSellers({ items }: { items: BestSeller[] }) {
  return (
    <article className="min-w-0 rounded-[32px] border border-admin-outline-variant bg-admin-surface p-6 shadow-[var(--admin-shadow-tight)]">
      <div className="mb-[22px] flex items-start justify-between gap-[18px]">
        <div>
          <h2 className="font-admin-head text-[clamp(22px,1.7vw,30px)] font-extrabold leading-[1.05] tracking-[-.035em] text-admin-on-surface">
            Лучшие продажи
          </h2>
          <p className="mt-1.5 text-[13px] text-admin-on-surface-variant">Лидеры по выручке за период</p>
        </div>
        <span className="inline-flex min-h-[38px] items-center rounded-full border border-admin-outline-variant bg-admin-surface-low px-[13px] text-[13px] font-bold text-admin-on-surface">
          Все
        </span>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-admin-on-surface-variant">Продаж за период нет.</p>
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <div
              key={item.productId}
              className="grid grid-cols-[58px_minmax(0,1fr)_auto] items-center gap-[14px] rounded-[18px] border border-admin-outline-variant bg-admin-surface p-3"
            >
              <div className="flex h-[58px] w-[58px] items-center justify-center overflow-hidden rounded-[15px] bg-admin-surface-low p-1">
                {item.imageUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element -- admin thumb */
                  <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Icon name="image" className="text-admin-on-surface-variant" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <strong className="block truncate font-extrabold text-admin-on-surface">{item.name}</strong>
                <span className="mt-1 block text-[12px] text-admin-on-surface-variant tabular-nums">
                  {item.units} продаж
                </span>
              </div>
              <div className="text-right shrink-0">
                <p className="font-mono font-extrabold text-admin-on-surface tabular-nums">
                  {formatPrice(item.revenue)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
