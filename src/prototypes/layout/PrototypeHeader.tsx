import type { ReactNode } from 'react';

const navigation = [
  { href: '/', label: 'Home' },
  { href: '/catalog', label: 'Catalog' },
  { href: '/faq', label: 'FAQ' },
] as const;

export interface PrototypeHeaderProps {
  readonly activePath?: string;
  readonly leading?: ReactNode;
}

export function PrototypeHeader({
  activePath = '/',
  leading,
}: PrototypeHeaderProps) {
  return (
    <header className="evp-header">
      <div className="evp-header__inner">
        <a className="evp-header__brand" href="/" aria-label="Evironn home">
          {leading ?? 'Evironn'}
        </a>
        <nav className="evp-header__nav" aria-label="Primary navigation">
          {navigation.map((item) => (
            <a
              key={item.href}
              href={item.href}
              aria-current={activePath === item.href ? 'page' : undefined}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <a className="evp-header__account" href="/profile">
          Account
        </a>
      </div>
    </header>
  );
}
