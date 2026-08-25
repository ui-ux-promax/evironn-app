import { Icon } from '@/components/admin/icon';
import { formatPrice } from '@/lib/format';
import type { BestSeller } from '@/lib/admin/analytics';
import styles from './dashboard-view.module.css';

export function BestSellers({ items, className = '' }: { items: BestSeller[]; className?: string }) {
  return (
    <article className={`${styles.panel} ${className}`.trim()}>
      <div className="mb-[18px]">
        <h2 className="font-admin-head text-base font-medium tracking-[-.005em] text-admin-on-surface">
          Часто покупают
        </h2>
        <p className="mt-[5px] text-xs text-admin-on-surface-variant">Топ по выручке</p>
      </div>
      {items.length === 0 ? (
        <p className={styles.empty}>Продаж за период нет.</p>
      ) : (
        <ul className={styles.list}>
          {items.slice(0, 4).map((item) => (
            <li key={item.productId} className={styles.listItem}>
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- admin thumb
                <img src={item.imageUrl} alt="" loading="lazy" className={styles.listImage} />
              ) : (
                <span className={styles.listImage} aria-hidden="true">
                  <Icon name="image" className="text-admin-on-surface-variant" />
                </span>
              )}
              <span className={styles.listText}>
                <strong>{item.name}</strong>
                <span>{item.units} продаж</span>
              </span>
              <strong className={styles.listValue}>{formatPrice(item.revenue)}</strong>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
