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

function UserAvatar({ user, className }: { user: AdminShellProps['user']; className?: string }) {
  const initials = getInitials(user.name, user.email);

  return (
    <span className={cn(styles.avatar, className)} aria-hidden="true">
      {user.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.image} alt="" className={styles.avatarImage} />
      ) : (
        initials
      )}
    </span>
  );
}

export function AdminShell({ user, children }: AdminShellProps) {
  const pathname = usePathname();

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar} aria-label="Навигация админки">
        <SidebarSkeletonGate />

        <Link href="/" className={styles.logo} aria-label="Evironn">
          <Image
            src="/assets/evironn-logo.svg"
            alt="Evironn"
            width={148}
            height={43}
            className={styles.logoImage}
            priority
          />
        </Link>

        <nav className={styles.navigation} aria-label="Основная навигация">
          {ADMIN_NAV.map((item) => {
            const active = isActiveAdminHref(item, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(styles.navigationLink, active && styles.active)}
                aria-current={active ? 'page' : undefined}
              >
                <Icon name={ADMIN_NAV_ICON_NAMES[item.href]} filled={active} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <Link href="/" className={styles.storeLink}>
            <Icon name="storefront" aria-hidden="true" />
            <span>Открыть магазин</span>
          </Link>
        </div>
      </aside>

      <div className={styles.viewport}>
        <header className={styles.topbar}>
          <Link href="/" className={styles.mobileLogo} aria-label="Evironn">
            <Image src="/assets/evironn-logo.svg" alt="Evironn" width={132} height={39} priority />
          </Link>
          <div className={styles.searchUtility} aria-hidden="true">
            <Icon name="search" aria-hidden="true" />
            <span>Поиск заказов, клиентов, товаров</span>
          </div>

          <div className={styles.utilityActions}>
            <div className={styles.profileSummary}>
              <UserAvatar user={user} />
              <div className={styles.profileDetails}>
                <span>{user.name ?? user.email ?? 'Администратор'}</span>
                <span>Администратор</span>
              </div>
              <button
                type="button"
                className={styles.signOut}
                onClick={() => signOut({ callbackUrl: '/login' })}
                aria-label="Выйти"
              >
                <Icon name="logout" aria-hidden="true" />
              </button>
            </div>
            <AdminMobileMenu user={user} pathname={pathname} />
          </div>
        </header>

        <main className={styles.main} id="main-content">
          <div className={styles.inner}>
            <ContentReadyGate>{children}</ContentReadyGate>
          </div>
        </main>
      </div>
    </div>
  );
}
