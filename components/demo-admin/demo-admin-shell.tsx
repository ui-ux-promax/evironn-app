'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { DEMO_ADMIN_NAV, isDemoNavActive, resolveDemoActiveIndex } from '@/lib/demo-admin/nav';
import { DemoIcon } from './demo-icon';
import { DemoReadonlyBanner } from './demo-readonly-banner';

const demoUser = { name: 'Demo Admin', email: 'demo@evironn.invalid' } as const;

function classes(...values: Array<string | false | undefined>): string {
  return values.filter(Boolean).join(' ');
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function DemoAdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="demo-admin-shell">
      <aside className="demo-admin-sidebar">
        <Link href="/demo-admin" className="demo-admin-wordmark" aria-label="Evironn demo admin">
          Evironn
        </Link>
        <p className="demo-admin-sidebar-caption">демо-админка магазина</p>
        <DemoReadonlyBanner />
        <nav className="demo-admin-rail" aria-label="Разделы демо-админки">
          {DEMO_ADMIN_NAV.map((item) => {
            const active = isDemoNavActive(item, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={classes('demo-admin-nav-link', active && 'is-active')}
              >
                <DemoIcon name={item.icon} filled={active} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <Link href="/" className="demo-admin-store-link">
          <DemoIcon name="storefront" />
          <span>Открыть магазин</span>
        </Link>
        <div className="demo-admin-user">
          <span className="demo-admin-avatar">{getInitials(demoUser.name)}</span>
          <span className="demo-admin-user-copy">
            <strong>{demoUser.name}</strong>
            <small>{demoUser.email}</small>
          </span>
          <DemoIcon name="visibility" />
        </div>
      </aside>

      <header className="demo-admin-mobile-header">
        <Link href="/demo-admin" className="demo-admin-wordmark" aria-label="Evironn demo admin">
          Evironn
        </Link>
        <span className="demo-admin-avatar">{getInitials(demoUser.name)}</span>
      </header>

      <main className="demo-admin-main">
        <div className="demo-admin-frame">
          <DemoReadonlyBanner />
          <div className="demo-admin-content">{children}</div>
        </div>
      </main>

      <DemoAdminTabBar pathname={pathname} />
    </div>
  );
}

function DemoAdminTabBar({ pathname }: { pathname: string | null }) {
  const active = resolveDemoActiveIndex(pathname);
  return (
    <nav className="demo-admin-tabbar" aria-label="Мобильная навигация">
      {DEMO_ADMIN_NAV.map((item, index) => {
        const isActive = index === active;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
            className={classes('demo-admin-tab', isActive && 'is-active')}
          >
            <DemoIcon name={item.icon} filled={isActive} />
          </Link>
        );
      })}
    </nav>
  );
}
