'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/admin/icon';
import { DEMO_ADMIN_NAV, resolveDemoActiveIndex, isDemoNavActive } from '@/lib/demo-admin/nav';
import { DemoReadonlyBanner } from './demo-readonly-banner';

const demoUser = {
  name: 'Demo Admin',
  email: 'demo@portfolio.invalid',
  role: 'DEMO',
};

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    return name
      .split(' ')
      .map((word) => word[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  return (email?.[0] ?? '?').toUpperCase();
}

export function DemoAdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <>
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 hidden h-full w-[286px] flex-col gap-5 overflow-y-auto px-5 pb-[22px] pt-7 md:flex',
          'border-r border-white/10 bg-[var(--admin-sidebar)] text-admin-on-primary',
        )}
      >
        <div className="flex items-center gap-3 px-1 pb-1">
          <div>
            <Image src="/ritm-logo-light.svg" alt="Ritm" width={112} height={40} priority className="h-auto w-28" />
            <p className="mt-0.5 text-xs font-bold text-white/50">демо-админка магазина</p>
          </div>
        </div>

        <div className="flex min-h-12 cursor-default items-center gap-2 rounded-[18px] border border-white/10 bg-white/10 px-[13px] text-sm font-bold text-white/60">
          <Icon name="lock" className="text-[20px]" />
          <span>Read-only demo</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          <div className="px-2 pt-1 text-[11px] font-extrabold uppercase tracking-[.06em] text-white/40">Главное</div>
          {DEMO_ADMIN_NAV.map((item) => {
            const active = isDemoNavActive(item, pathname);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex min-h-[43px] items-center gap-3 rounded-[13px] px-[13px] text-sm font-bold transition-colors',
                  active
                    ? 'bg-white/10 text-admin-on-primary'
                    : 'text-white/65 hover:bg-white/10 hover:text-admin-on-primary',
                )}
              >
                <Icon name={item.icon} filled={active} className="text-[21px]" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <Link
          href="/"
          className="flex min-h-[43px] items-center gap-3 rounded-[13px] px-[13px] text-sm font-bold text-white/65 transition-colors hover:bg-white/10 hover:text-admin-on-primary"
        >
          <Icon name="storefront" className="text-[21px]" />
          <span>Открыть магазин</span>
        </Link>

        <div className="rounded-[18px] bg-white/10 p-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-admin-on-primary text-sm font-extrabold text-[var(--admin-sidebar)]">
              {getInitials(demoUser.name, demoUser.email)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-extrabold text-admin-on-primary">{demoUser.name}</p>
              <p className="truncate text-xs text-white/55">{demoUser.email}</p>
            </div>
            <Icon name="visibility" className="shrink-0 text-white/55" />
          </div>
        </div>
      </aside>

      <header className="fixed left-0 right-0 top-0 z-30 flex h-16 items-center gap-4 border-b border-admin-outline-variant bg-admin-surface/90 px-[18px] backdrop-blur-lg md:hidden">
        <Link href="/demo-admin" aria-label="Ritm demo admin" className="flex items-center">
          <Image src="/ritm-logo.svg" alt="Ritm" width={98} height={28} priority className="h-auto w-[84px]" />
        </Link>
        <div className="ml-auto grid h-9 w-9 place-items-center rounded-full bg-admin-primary font-admin-head text-[13px] font-bold text-admin-on-primary">
          {getInitials(demoUser.name, demoUser.email)}
        </div>
      </header>

      <main className="h-screen overflow-y-auto overscroll-contain bg-admin-bg pt-16 [scrollbar-gutter:stable] md:ml-[286px] md:pt-0">
        <div className="admin-workspace">
          <DemoReadonlyBanner />
          <div className="mt-6">{children}</div>
        </div>
      </main>

      <DemoAdminTabBar />
    </>
  );
}

function DemoAdminTabBar() {
  const pathname = usePathname();
  const active = resolveDemoActiveIndex(pathname);

  return (
    <nav
      aria-label="Основная навигация"
      className="fixed inset-x-3 bottom-3 z-40 rounded-[24px] border border-admin-outline-variant bg-admin-surface/95 p-2 [padding-bottom:calc(0.5rem+env(safe-area-inset-bottom))] shadow-[var(--admin-shadow-soft)] backdrop-blur-lg md:hidden"
    >
      <div className="relative isolate flex h-14 items-stretch">
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

        {DEMO_ADMIN_NAV.map((item, index) => {
          const isActive = index === active;

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
