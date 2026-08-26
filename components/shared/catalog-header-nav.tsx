'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { HeaderSearch } from './header-search';
import { cn } from '@/lib/utils';

const baseClass =
  'h-[38px] px-4 inline-flex items-center rounded-full border text-[13px] font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-300 ease-out';

function Chip({
  href,
  children,
  expected,
}: {
  href: string;
  children: React.ReactNode;
  expected: Record<string, string>;
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const active = pathname === '/catalog' && Object.entries(expected).every(([key, value]) => params.get(key) === value);

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        baseClass,
        active
          ? 'header-active-in border-primary bg-primary text-primary-foreground shadow-[0_5px_14px_hsl(var(--color-text)/.13)]'
          : 'border-line bg-surface text-ink-muted hover:border-ink/35 hover:text-ink',
      )}
    >
      {children}
    </Link>
  );
}

export function CatalogHeaderNav() {
  const pathname = usePathname();
  const params = useSearchParams();
  const catalogActive =
    pathname === '/catalog' && !['sort', 'gender', 'brand', 'category', 'q'].some((key) => params.has(key));

  return (
    <>
      <Link
        href="/catalog"
        aria-current={catalogActive ? 'page' : undefined}
        className={cn(
          baseClass,
          'h-[42px] w-[182px] justify-center',
          catalogActive
            ? 'header-active-in border-primary bg-primary text-primary-foreground shadow-[0_5px_14px_hsl(var(--color-text)/.13)]'
            : 'border-line bg-surface text-ink-muted hover:border-ink/35 hover:text-ink',
        )}
      >
        Каталог
      </Link>
      <div className="flex min-w-0 items-center gap-2.5 overflow-x-clip">
        <Chip href="/catalog?sort=new" expected={{ sort: 'new' }}>
          Новинки
        </Chip>
        <Chip href="/catalog?sort=discount" expected={{ sort: 'discount' }}>
          Sale
        </Chip>
        <HeaderSearch />
      </div>
      <div className="flex items-center gap-2.5">
        <Chip href="/catalog?gender=MEN" expected={{ gender: 'MEN' }}>
          Мужчины
        </Chip>
        <Chip href="/catalog?gender=WOMEN" expected={{ gender: 'WOMEN' }}>
          Женщины
        </Chip>
        <Chip href="/catalog?gender=KIDS" expected={{ gender: 'KIDS' }}>
          Дети
        </Chip>
        <Chip href="/catalog?brand=Evironn" expected={{ brand: 'Evironn' }}>
          Бренд
        </Chip>
      </div>
    </>
  );
}
