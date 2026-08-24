'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/admin/icon';
import SidebarSkeletonGate from '@/components/admin/sidebar-skeleton-gate';
import { ContentReadyGate } from '@/components/admin/content-ready-gate';
import { ADMIN_NAV, ADMIN_NAV_ICON_NAMES, isActiveAdminHref } from '@/lib/admin/nav';
import { AdminTabBar } from '@/components/admin/admin-tab-bar';
import { AdminMobileMenu } from '@/components/admin/admin-mobile-menu';

interface AdminShellProps {
  user: {
    name?: string | null;
    email?: string | null;
    role: string;
    image?: string | null;
  };
  children: ReactNode;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Администратор',
  CUSTOMER: 'Клиент',
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

export function AdminShell({ user, children }: AdminShellProps) {
  const pathname = usePathname();

  return (
    <>
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 hidden h-full w-[286px] flex-col gap-5 overflow-y-auto px-5 pb-[22px] pt-7 md:flex',
          'border-r border-white/10 bg-[var(--admin-sidebar)] text-admin-on-primary',
        )}
      >
        <SidebarSkeletonGate />

        <div className="flex items-center gap-3 px-1 pb-1">
          <div>
            <div className="inline-flex rounded-[14px] bg-white px-2.5 py-1.5">
              <Image
                src="/assets/evironn-logo.svg"
                alt="Evironn"
                width={150}
                height={44}
                priority
                className="h-auto w-[132px]"
              />
            </div>
            <p className="mt-1 text-xs font-bold text-white/50">админ-панель</p>
          </div>
        </div>

        <button
          type="button"
          disabled
          aria-disabled="true"
          className="flex min-h-12 cursor-default items-center gap-2 rounded-[18px] border border-white/10 bg-white/10 px-[13px] text-sm font-bold text-white/60"
        >
          <Icon name="search" className="text-[20px]" />
          <span>Быстрый поиск</span>
          <kbd className="ml-auto rounded-lg bg-white/10 px-2 py-1 font-mono text-[11px] text-white/55">/</kbd>
        </button>

        <nav className="flex flex-1 flex-col gap-1">
          <div className="px-2 pt-1 text-[11px] font-extrabold uppercase tracking-[.06em] text-white/40">Главное</div>
          {ADMIN_NAV.map((item) => {
            const active = isActiveAdminHref(item, pathname);
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
                <Icon name={ADMIN_NAV_ICON_NAMES[item.href]} filled={active} className="text-[21px]" />
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
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
            ) : (
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-admin-on-primary text-sm font-extrabold text-[var(--admin-sidebar)]">
                {getInitials(user.name, user.email)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-extrabold text-admin-on-primary">
                {user.name ?? user.email ?? 'Admin'}
              </p>
              <p className="truncate text-xs text-white/55">{ROLE_LABELS[user.role] ?? user.role}</p>
            </div>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/login' })}
              aria-label="Выйти"
              className="shrink-0 text-white/55 transition-colors hover:text-admin-error"
            >
              <Icon name="logout" />
            </button>
          </div>
        </div>
      </aside>

      <header className="fixed left-0 right-0 top-0 z-30 flex h-16 items-center gap-4 border-b border-admin-outline-variant bg-admin-surface/90 px-[18px] backdrop-blur-lg md:hidden">
        <Link href="/admin" aria-label="Evironn admin" className="flex items-center">
          <Image
            src="/assets/evironn-logo.svg"
            alt="Evironn"
            width={124}
            height={36}
            priority
            className="h-auto w-[106px]"
          />
        </Link>
        <div className="ml-auto">
          <AdminMobileMenu user={user} />
        </div>
      </header>

      <main className="h-screen overflow-y-auto overscroll-contain bg-admin-bg pt-16 [scrollbar-gutter:stable] md:ml-[286px] md:pt-0">
        <div className="admin-workspace">
          <ContentReadyGate>{children}</ContentReadyGate>
        </div>
      </main>

      <AdminTabBar />
    </>
  );
}
