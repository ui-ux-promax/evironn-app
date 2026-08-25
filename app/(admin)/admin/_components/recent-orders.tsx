import Link from 'next/link';
import { AdminStatusPill, type AdminStatus } from '@/components/admin/ui/status';
import { formatDate, formatPrice } from '@/lib/format';
import type { RecentOrderRow } from '@/lib/admin/analytics';
import styles from './dashboard-view.module.css';

export function RecentOrders({ rows, className = '' }: { rows: RecentOrderRow[]; className?: string }) {
  return (
    <article className={`${styles.panel} ${className}`.trim()}>
      <div className="mb-[18px] flex items-start justify-between gap-[18px]">
        <div>
          <h2 className="font-admin-head text-base font-medium tracking-[-.005em] text-admin-on-surface">
            Последние заказы
          </h2>
          <p className="mt-[5px] text-xs text-admin-on-surface-variant">Шесть самых свежих</p>
        </div>
        <Link
          href="/admin/orders"
          className="inline-flex min-h-[36px] items-center rounded-full border border-admin-outline-variant bg-admin-surface px-[13px] text-xs font-bold text-admin-on-surface hover:bg-admin-surface-low"
        >
          Все заказы
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className={styles.empty}>Заказов пока нет.</p>
      ) : (
        <ul className={styles.list}>
          {rows.slice(0, 6).map((row) => (
            <li key={row.id} className={styles.listItem}>
              <span className={styles.listText}>
                <Link href={`/admin/orders/${row.id}`} className="font-medium text-admin-on-surface hover:underline">
                  ORD-{row.orderNumber}
                </Link>
                <span>
                  {row.contactName} · {formatDate(row.createdAt)}
                </span>
              </span>
              <AdminStatusPill status={statusFor(row)} />
              <strong className={styles.listValue}>{formatPrice(row.totalAmount)}</strong>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

function statusFor(row: RecentOrderRow): AdminStatus {
  if (row.status === 'CANCELLED') return 'cancelled';
  if (row.status === 'PROCESSING') return 'processing';
  if (row.status === 'DELIVERED' || row.paymentStatus === 'succeeded') return 'delivered';
  return 'pending';
}
