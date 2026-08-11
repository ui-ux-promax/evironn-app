'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { usePathname, useSearchParams, type ReadonlyURLSearchParams } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowUpRight, UserRound, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavLink {
  label: string;
  href: string;
  active: (path: string, sp: ReadonlyURLSearchParams) => boolean;
}

const links: NavLink[] = [
  { label: 'Новинки', href: '/catalog?sort=new', active: (p, sp) => p === '/catalog' && sp.get('sort') === 'new' },
  {
    label: 'Футболки',
    href: '/catalog?category=tees',
    active: (p, sp) => p === '/catalog' && sp.get('category') === 'tees',
  },
  {
    label: 'Худи',
    href: '/catalog?category=hoodies',
    active: (p, sp) => p === '/catalog' && sp.get('category') === 'hoodies',
  },
  {
    label: 'Верхняя одежда',
    href: '/catalog?category=outerwear',
    active: (p, sp) => p === '/catalog' && sp.get('category') === 'outerwear',
  },
  { label: 'Каталог', href: '/catalog', active: (p, sp) => p === '/catalog' && !sp.get('category') && !sp.get('sort') },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        className="-ml-2 grid h-10 w-10 place-items-center rounded-full hover:bg-surface-soft md:hidden"
        aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
      >
        <span className="relative block h-[18px] w-6" aria-hidden="true">
          <span
            className={cn(
              'absolute left-0 top-0 h-0.5 w-6 rounded-full bg-ink transition-all duration-300 [transition-timing-function:cubic-bezier(.65,.05,.36,1)]',
              open && 'top-[8px] rotate-45',
            )}
          />
          <span
            className={cn(
              'absolute left-0 top-[8px] h-0.5 w-6 rounded-full bg-ink transition-all duration-200',
              open && 'scale-x-50 opacity-0',
            )}
          />
          <span
            className={cn(
              'absolute left-0 top-[16px] h-0.5 w-6 rounded-full bg-ink transition-all duration-300 [transition-timing-function:cubic-bezier(.65,.05,.36,1)]',
              open && 'top-[8px] -rotate-45',
            )}
          />
        </span>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-ink/45 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-[70] overflow-hidden bg-footer text-white outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:duration-300 data-[state=closed]:duration-200"
        >
          <Image src="/home/hero-slide-4.png" alt="" fill priority sizes="100vw" className="object-cover opacity-45" />
          <div
            className="absolute inset-0 bg-[linear-gradient(180deg,hsl(220_16%_9%_/_0.2),hsl(220_16%_9%_/_0.82)_48%,hsl(220_16%_9%))]"
            aria-hidden
          />

          <div className="relative flex h-full flex-col px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(20px,env(safe-area-inset-top))]">
            <div className="flex items-center justify-between">
              <Image src="/ritm-logo-light.svg" alt="Ritm" width={98} height={28} className="h-auto w-[98px]" />
              <Dialog.Close
                className="grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-white/10 transition-colors hover:bg-white/20"
                aria-label="Закрыть меню"
              >
                <X className="h-5 w-5" />
              </Dialog.Close>
            </div>

            <div className="mt-8 flex items-center justify-between border-y border-white/25 py-3 text-[11px] font-bold tracking-[.14em] text-white/70">
              <Dialog.Title>RITM / SS26</Dialog.Title>
              <span>МЕНЮ</span>
            </div>

            <nav className="mt-3" aria-label="Основная навигация">
              <ul>
                {links.map((link, index) => {
                  const active = link.active(pathname, searchParams);
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={() => setOpen(false)}
                        aria-current={active ? 'page' : undefined}
                        style={{ animationDelay: `${80 + index * 45}ms`, animationFillMode: 'both' }}
                        className={cn(
                          'flex items-center justify-between border-b border-white/20 py-[15px] font-display text-[25px] font-bold tracking-[-.05em] transition-colors motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2',
                          active ? 'text-white' : 'text-white/82 hover:text-white',
                        )}
                      >
                        {link.label}
                        <ArrowUpRight className="h-5 w-5 shrink-0" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="mt-auto">
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-white/72">
                <Link href="/catalog" onClick={() => setOpen(false)} className="hover:text-white">
                  Каталог
                </Link>
                <Link href="/wishlist" onClick={() => setOpen(false)} className="hover:text-white">
                  Избранное
                </Link>
                <Link href="/demo-admin" onClick={() => setOpen(false)} className="hover:text-white">
                  Демо
                </Link>
              </div>
              <Link
                href="/catalog"
                onClick={() => setOpen(false)}
                className="mt-5 flex min-h-[54px] items-center justify-between rounded-full bg-white px-5 text-[15px] font-bold text-ink transition-transform active:scale-[.98] motion-reduce:transform-none"
              >
                Открыть каталог
                <ArrowUpRight className="h-5 w-5" />
              </Link>
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-white/72 hover:text-white"
              >
                <UserRound className="h-4 w-4" />
                Профиль
              </Link>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
