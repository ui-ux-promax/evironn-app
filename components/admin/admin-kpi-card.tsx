import { Icon } from '@/components/admin/icon';
import { cn } from '@/lib/utils';

interface AdminKpiCardProps {
  icon: string;
  label: string;
  value: string;
  delta?: string;
  tone?: 'default' | 'primary' | 'danger';
}

export function AdminKpiCard({ icon, label, value, delta, tone = 'default' }: AdminKpiCardProps) {
  const primary = tone === 'primary';
  return (
    <article
      className={cn(
        'relative flex min-h-[166px] flex-col gap-[15px] overflow-hidden rounded-[24px] border p-5 shadow-[var(--admin-shadow-tight)]',
        primary
          ? 'border-[var(--admin-sidebar)] bg-[var(--admin-sidebar)] text-admin-on-primary'
          : 'border-admin-outline-variant bg-admin-surface text-admin-on-surface',
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div
          className={cn(
            'grid h-11 w-11 place-items-center rounded-full',
            primary ? 'bg-admin-on-primary text-[var(--admin-sidebar)]' : 'bg-admin-surface-low text-admin-on-surface',
          )}
        >
          <Icon name={icon} className="text-[21px]" />
        </div>
      </div>
      <div>
        <div
          className={cn(
            'text-[13px] font-bold',
            primary ? 'text-admin-on-primary opacity-70' : 'text-admin-on-surface-variant',
          )}
        >
          {label}
        </div>
        <div className="mt-2 font-admin-head text-[clamp(28px,2.3vw,38px)] font-extrabold leading-[.92] tracking-[-.055em] tabular-nums">
          {value}
        </div>
      </div>
      {delta && (
        <span
          className={cn(
            'mt-auto text-[13px] font-extrabold',
            tone === 'danger' ? 'text-admin-error' : primary ? 'text-admin-on-primary' : 'text-[var(--admin-money)]',
          )}
        >
          {delta}
        </span>
      )}
    </article>
  );
}
