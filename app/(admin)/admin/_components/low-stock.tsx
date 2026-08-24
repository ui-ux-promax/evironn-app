import Link from 'next/link';
import { LOW_STOCK_THRESHOLD } from '@/constants/config';
import { cn } from '@/lib/utils';
import type { AdminLowStockSku } from '@/lib/admin/analytics';

export function LowStock({ rows }: { rows: AdminLowStockSku[] }) {
  return (
    <section className="rounded-[32px] border border-admin-outline-variant bg-admin-surface p-6 shadow-[var(--admin-shadow-tight)]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-admin-head text-[clamp(22px,1.7vw,30px)] font-extrabold leading-[1.05] tracking-[-.035em] text-admin-on-surface">
          Низкие остатки
        </h2>
        {rows.length > 0 && (
          <span className="rounded-full bg-admin-error px-3 py-1 text-xs font-bold text-admin-on-error">
            {rows.length} поз.
          </span>
        )}
      </div>
      {rows.length === 0 ? (
        <p className="rounded-[20px] border border-admin-outline-variant bg-admin-surface-low p-8 text-center text-sm font-bold text-admin-on-surface-variant">
          Низких остатков нет.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {rows.map((row) => {
            const critical = row.stock <= LOW_STOCK_THRESHOLD;
            return (
              <Link
                href="/admin/catalog/stock"
                key={row.skuId}
                className={cn(
                  'flex items-center justify-between gap-2 rounded-xl border p-3',
                  critical
                    ? 'border-admin-error bg-admin-error/10'
                    : 'border-admin-secondary-container bg-admin-secondary-container/30',
                )}
              >
                <div className="min-w-0">
                  <p className="truncate font-bold text-admin-on-surface">{row.productName}</p>
                  <p className="truncate text-xs text-admin-on-surface-variant">{row.combinationLabel}</p>
                  <p className="text-[10px] font-bold uppercase text-admin-on-surface-variant">{row.articleNumber}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p
                    className={cn(
                      'font-admin-head text-xl font-bold tabular-nums',
                      critical ? 'text-admin-error' : 'text-admin-on-surface',
                    )}
                  >
                    {row.stock}
                  </p>
                  <p className="text-[10px] font-bold uppercase text-admin-on-surface-variant">в наличии</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
