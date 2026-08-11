'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const links = [
  { href: '/catalog', label: 'Каталог' },
  { href: '/demo-admin', label: 'Демо' },
] as const;

export function HeaderTopLinks() {
  const pathname = usePathname();
  return (
    <nav className="hidden items-center gap-6 text-[13px] font-semibold md:flex" aria-label="Разделы сайта">
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'transition-[color,transform] duration-300 ease-out',
              active ? 'header-active-in text-primary' : 'text-ink hover:text-ink-muted',
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
