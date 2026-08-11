import type { ReactNode } from 'react';
import { Icon } from '@/components/admin/icon';
import { cn } from '@/lib/utils';

interface AdminPageHeaderProps {
  kicker: string;
  title: string;
  subtitle: string;
  searchPlaceholder?: string;
  action?: ReactNode;
  afterSearch?: ReactNode;
  className?: string;
}

export function AdminPageHeader({
  kicker,
  title,
  subtitle,
  searchPlaceholder,
  action,
  afterSearch,
  className,
}: AdminPageHeaderProps) {
  return (
    <header className={cn('flex items-start justify-between gap-[22px] max-[760px]:grid', className)}>
      <div className="min-w-0">
        <div className="text-[13px] font-bold uppercase tracking-[.06em] text-admin-on-surface-variant">{kicker}</div>
        <h1 className="mt-1 font-admin-head text-[clamp(32px,3.4vw,52px)] font-extrabold leading-[.96] tracking-[-.035em] text-admin-on-surface">
          {title}
        </h1>
        <p className="mt-[9px] max-w-[64ch] text-[15px] text-admin-on-surface-variant">{subtitle}</p>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-3 max-[760px]:justify-start">
        {searchPlaceholder && (
          <label className="flex h-14 w-[min(36vw,480px)] min-w-[330px] items-center gap-3 rounded-full border border-admin-outline-variant bg-admin-surface px-[18px] text-admin-on-surface-variant shadow-[var(--admin-shadow-tight)] max-[760px]:w-full max-[760px]:min-w-0">
            <Icon name="search" className="text-[20px]" />
            <input
              type="search"
              name="q"
              placeholder={searchPlaceholder}
              className="min-w-0 flex-1 bg-transparent text-[15px] text-admin-on-surface outline-none placeholder:text-admin-on-surface-variant"
            />
          </label>
        )}
        {afterSearch}
        {action}
      </div>
    </header>
  );
}
