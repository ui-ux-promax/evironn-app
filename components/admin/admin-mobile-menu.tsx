'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { Icon } from '@/components/admin/icon';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/admin/ui/dialog';
import { ADMIN_NAV, ADMIN_NAV_ICON_NAMES, isActiveAdminHref } from '@/lib/admin/nav';
import { cn } from '@/lib/utils';
import styles from './admin-shell.module.css';

interface AdminMobileMenuProps {
  user: { name?: string | null; email?: string | null; role: string; image?: string | null };
  pathname: string;
}

function getInitials(name?: string | null, email?: string | null): string {
  if (name)
    return name
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  return (email?.[0] ?? '?').toUpperCase();
}

/** Accessible mobile navigation and account actions. */
export function AdminMobileMenu({ user, pathname }: AdminMobileMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={styles.mobileMenuTrigger}
          aria-label={open ? 'Закрыть меню навигации' : 'Открыть меню навигации'}
          aria-controls="admin-mobile-navigation"
          aria-expanded={open}
        >
          <Icon name={open ? 'close' : 'menu'} aria-hidden="true" />
        </button>
      </DialogTrigger>

      <DialogContent id="admin-mobile-navigation" className={styles.mobileMenuPanel}>
        <div className={styles.mobileMenuHandle} aria-hidden="true" />
        <DialogTitle className={styles.mobileMenuHeading}>Навигация</DialogTitle>
        <DialogDescription className={styles.visuallyHidden}>
          Переход между разделами защищённой админки и выход из аккаунта.
        </DialogDescription>

        <nav aria-label="Основная навигация" className={styles.mobileNavigation}>
          {ADMIN_NAV.map((item) => {
            const active = isActiveAdminHref(item, pathname);
            return (
              <DialogClose key={item.href} asChild>
                <Link
                  href={item.href}
                  className={cn(styles.mobileNavigationLink, active && styles.active)}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon name={ADMIN_NAV_ICON_NAMES[item.href]} filled={active} aria-hidden="true" />
                  <span>{item.label}</span>
                  <Icon name="chevron_right" aria-hidden="true" />
                </Link>
              </DialogClose>
            );
          })}
        </nav>

        <DialogClose asChild>
          <Link href="/" className={styles.mobileStoreLink}>
            <Icon name="storefront" aria-hidden="true" />
            <span>Открыть магазин</span>
            <Icon name="open_in_new" aria-hidden="true" />
          </Link>
        </DialogClose>

        <div className={styles.mobileAccount}>
          <span className={styles.avatar} aria-hidden="true">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt="" className={styles.avatarImage} />
            ) : (
              getInitials(user.name, user.email)
            )}
          </span>
          <span className={styles.mobileAccountName}>{user.name ?? user.email ?? 'Администратор'}</span>
          <button
            type="button"
            className={styles.mobileSignOut}
            onClick={() => signOut({ callbackUrl: '/login' })}
            aria-label="Выйти"
          >
            <Icon name="logout" aria-hidden="true" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
