'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/admin/icon';
import SidebarSkeletonGate from '@/components/admin/sidebar-skeleton-gate';
import { ContentReadyGate } from '@/components/admin/content-ready-gate';
import { AdminMobileMenu } from '@/components/admin/admin-mobile-menu';
import { ADMIN_NAV, ADMIN_NAV_ICON_NAMES, isActiveAdminHref } from '@/lib/admin/nav';
import styles from './admin-shell.module.css';

interface AdminShellProps {
  user: {
    name?: string | null;
    email?: string | null;
    role: string;
    image?: string | null;
  };
  children: ReactNode;
}

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
  const initials = getInitials(user.name, user.email);

  return (
    <div className={styles.shell}>
      <aside className={styles.rail} aria-label="Навигация админки">
        <SidebarSkeletonGate />

        <Link href="/" className={styles.mark} aria-label="Evironn">
          <Image
            src="/assets/evironn-logo.svg"
            alt="Evironn"
            width={38}
            height={38}
            className={styles.markImage}
            priority
          />
        </Link>

        <div className={styles.railGroup}>
          {ADMIN_NAV.map((item) => {
            const active = isActiveAdminHref(item, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(styles.railLink, active && styles.active)}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
              >
                <Icon name={ADMIN_NAV_ICON_NAMES[item.href]} filled={active} aria-hidden="true" />
                <span className={styles.tooltip} role="tooltip">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>

        <Link href="/" className={cn(styles.railLink, styles.store)} aria-label="Открыть магазин">
          <Icon name="storefront" aria-hidden="true" />
          <span className={styles.tooltip} role="tooltip">
            Открыть магазин
          </span>
        </Link>

        <div className={styles.profile}>
          <div className={styles.avatar} aria-label={`${user.name ?? user.email ?? 'Admin'}, администратор`}>
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt="" className="h-full w-full rounded-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <button
            type="button"
            className={styles.profileSignOut}
            onClick={() => signOut({ callbackUrl: '/login' })}
            aria-label="Выйти"
          >
            <Icon name="logout" aria-hidden="true" />
          </button>
        </div>

        <div className={styles.mobileProfile}>
          <AdminMobileMenu user={user} />
        </div>
      </aside>

      <main className={styles.main} id="main-content">
        <div className={styles.inner}>
          <ContentReadyGate>{children}</ContentReadyGate>
        </div>
      </main>
    </div>
  );
}
