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
    <header className={cn('flex flex-wrap items-end justify-between gap-5', className)}>
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-[.12em] text-admin-on-surface-variant">{kicker}</div>
        <h1 className="mt-2 font-admin-head text-[clamp(1.9rem,3.4vw,2.9rem)] font-medium leading-none tracking-[-.01em] text-admin-on-surface">
          {title}
        </h1>
        <p className="mt-2.5 max-w-[52ch] text-[13.5px] leading-[1.55] text-admin-on-surface-variant">{subtitle}</p>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2.5 max-[760px]:w-full max-[760px]:justify-start">
        {searchPlaceholder && (
          <label className="flex min-h-9 w-[min(36vw,480px)] min-w-[260px] items-center gap-2 rounded-[10px] border border-admin-outline-variant bg-admin-surface px-3.5 text-admin-on-surface-variant shadow-[var(--admin-shadow-tight)] transition-[border-color,box-shadow] focus-within:border-admin-outline focus-within:shadow-[var(--admin-shadow-soft)] max-[760px]:w-full max-[760px]:min-w-0">
            <Icon name="search" className="text-[15px]" />
            <input
              type="search"
              name="q"
              placeholder={searchPlaceholder}
              className="min-w-0 flex-1 bg-transparent text-[13px] text-admin-on-surface outline-none placeholder:text-admin-on-surface-variant"
            />
          </label>
        )}
        {afterSearch}
        {action}
      </div>
    </header>
  );
}
