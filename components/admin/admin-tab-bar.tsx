'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/admin/icon';
import { ADMIN_NAV, resolveActiveIndex } from '@/lib/admin/nav';

/**
 * Мобильный нижний таб-бар (5 разделов). Виден только <md (десктоп — сайдбар).
 * Активный таб подсвечивается скользящей лайм-пилюлей — механика тоггла темы:
 * 5 равных сегментов → пилюля шириной 1/5 двигается translateX(index*100%),
 * без JS-замеров. Позиция берётся из usePathname через resolveActiveIndex.
 */
export function AdminTabBar() {
  const pathname = usePathname();
  const active = resolveActiveIndex(pathname);

  return (
    <nav
      aria-label="Основная навигация"
      className="fixed inset-x-3 bottom-3 z-40 rounded-[24px] border border-admin-outline-variant bg-admin-surface/95 p-2 [padding-bottom:calc(0.5rem+env(safe-area-inset-bottom))] shadow-[var(--admin-shadow-soft)] backdrop-blur-lg md:hidden"
    >
      <div className="relative isolate flex h-14 items-stretch">
        {/* Скользящая лайм-пилюля (декоративная) */}
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-y-0 left-0 z-0 w-1/5 rounded-[18px]',
            'bg-admin-primary shadow-[var(--pill-shadow)]',
            'transition-[transform,opacity] duration-[420ms] ease-[cubic-bezier(.34,1.56,.64,1)]',
            active < 0 && 'opacity-0',
          )}
          style={{ transform: `translateX(${Math.max(active, 0) * 100}%)` }}
        />

        {ADMIN_NAV.map((item, i) => {
          const isActive = i === active;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'relative z-10 flex min-h-[44px] flex-1 items-center justify-center rounded-[18px]',
                'transition-colors duration-200',
                isActive ? 'text-admin-on-primary' : 'text-admin-on-surface-variant',
              )}
            >
              <Icon name={item.icon} filled={isActive} className="text-[26px]" />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
