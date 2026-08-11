'use client';

import Image from 'next/image';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { useEffect, useMemo, useState, useTransition, type ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { updatePassword, updateProfile } from '@/app/actions/profile';
import { toggleWishlist } from '@/app/actions/wishlist';
import { addAddress, deleteAddress, setDefaultAddress } from '@/app/actions/address';
import { OrderStatusBadge } from '@/components/shared/orders/order-status-badge';
import { formatPrice } from '@/lib/format';
import { getOrderDetailHref, getProfileOrderPaymentHref } from '@/lib/order-links';
import { cn } from '@/lib/utils';
import { ORDER_STATUS_META } from '@/lib/order';
import { profileSchema, type ProfileValues } from '@/services/dto/auth.dto';
import type { ProductCardData } from '@/lib/product-summary';

// ── Types ──────────────────────────────────────────────────────────────────

type OrderStatusKey = keyof typeof ORDER_STATUS_META;
type PanelKey = 'overview' | 'orders' | 'favorites' | 'addresses' | 'settings';
type FilterKey = 'all' | 'processing' | 'transit' | 'delivered' | 'returned' | 'cancelled';

export interface ProfileOrderItem {
  productName: string;
  productNameFromVariant: string;
  brand: string;
  colorwayName: string;
  size: string;
  imageUrl: string | null;
  qty: number;
  price: number;
  lineTotal: number;
}

export interface ProfileOrder {
  orderNumber: number;
  status: OrderStatusKey;
  createdAt: string;
  itemsTotal: number;
  discountAmount: number;
  shippingAmount: number;
  totalAmount: number;
  paymentMethod: string;
  shippingMethod: string;
  city: string;
  addressLine: string;
  paymentStatus: string | null;
  items: ProfileOrderItem[];
}

interface ProfileUser {
  email: string;
  name: string;
  phone: string;
  birthdate: string;
  createdAt: string;
}

interface SavedAddress {
  id: string;
  label: string;
  city: string;
  street: string;
  comment: string | null;
  isDefault: boolean;
}

interface ProfileViewProps {
  user: ProfileUser;
  initial: ProfileValues;
  isAdmin: boolean;
  orders: ProfileOrder[];
  wishlist: ProductCardData[];
  addresses: SavedAddress[];
}

// ── Icons ──────────────────────────────────────────────────────────────────

const ICONS = {
  overview: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.6" />
    </svg>
  ),
  orders: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 7.5 12 4l7 3.5v9L12 20l-7-3.5z" />
      <path d="m5 7.5 7 3.5 7-3.5" />
      <path d="M12 11v9" />
    </svg>
  ),
  favorites: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 20.5s-7.25-4.45-7.25-10.2A4.35 4.35 0 0 1 12 7.25a4.35 4.35 0 0 1 7.25 3.05C19.25 16.05 12 20.5 12 20.5Z" />
    </svg>
  ),
  addresses: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13.5a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06A2 2 0 1 1 7.04 3.4l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  ),
  logout: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 17l5-5-5-5" />
      <path d="M20 12H9" />
      <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" />
    </svg>
  ),
  star: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m12 3 2.4 5.1 5.6.7-4.1 3.9 1.05 5.5L12 16.9l-4.95 2.3L8.1 13.7 4 9.8l5.6-.7Z" />
    </svg>
  ),
  money: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  arrow: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  chevron: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="m9 6 6 6-6 6" />
    </svg>
  ),
} as const;

// ── Constants ──────────────────────────────────────────────────────────────

const PANELS: Array<{ key: PanelKey; label: string }> = [
  { key: 'overview', label: 'Обзор' },
  { key: 'orders', label: 'Заказы' },
  { key: 'favorites', label: 'Избранное' },
  { key: 'addresses', label: 'Адреса' },
  { key: 'settings', label: 'Настройки' },
];

const FILTERS: Array<{ key: FilterKey; label: string; dot: string }> = [
  { key: 'all', label: 'Все', dot: 'bg-ink-muted' },
  { key: 'processing', label: 'Собирается', dot: 'bg-warning' },
  { key: 'transit', label: 'В пути', dot: 'bg-info' },
  { key: 'delivered', label: 'Доставлен', dot: 'bg-accent' },
  { key: 'returned', label: 'Возврат', dot: 'bg-warm' },
  { key: 'cancelled', label: 'Отменён', dot: 'bg-danger' },
];

// TEMP: mock card data removed — payments panel deleted

const POINTS = 1240;
const fmtDate = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

// ── Main component ─────────────────────────────────────────────────────────

export function ProfileView({ user, initial, isAdmin, orders, wishlist, addresses }: ProfileViewProps) {
  const [panel, setPanel] = useState<PanelKey>('overview');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<ReadonlySet<number>>(() => new Set());
  const [favorites, setFavorites] = useState<ProductCardData[]>(wishlist);
  const [toast, setToast] = useState<string | null>(null);

  const name = user.name.trim() || user.email.split('@')[0] || 'Покупатель Ritm';
  const totalSpent = useMemo(
    () => orders.filter((o) => o.status !== 'CANCELLED').reduce((s, o) => s + o.totalAmount, 0),
    [orders],
  );
  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = {
      all: orders.length,
      processing: 0,
      transit: 0,
      delivered: 0,
      returned: 0,
      cancelled: 0,
    };
    orders.forEach((o) => {
      c[toFilter(o.status)] += 1;
    });
    return c;
  }, [orders]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      const matchStatus = filter === 'all' || toFilter(o.status) === filter;
      const searchText = [
        `ritm-${o.orderNumber}`,
        ORDER_STATUS_META[o.status].label,
        o.city,
        o.addressLine,
        ...o.items.flatMap((i) => [i.productName, i.productNameFromVariant, i.brand, i.colorwayName, i.size]),
      ]
        .join(' ')
        .toLowerCase();
      return matchStatus && (!q || searchText.includes(q));
    });
  }, [filter, orders, query]);

  // Hash deep-linking
  useEffect(() => {
    const sync = () => {
      const hash = location.hash.slice(1);
      if (isPanel(hash)) setPanel(hash as PanelKey);
    };
    sync();
    if (location.hash) {
      history.scrollRestoration = 'manual';
      scrollTo(0, 0);
    }
    addEventListener('hashchange', sync);
    return () => removeEventListener('hashchange', sync);
  }, []);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(id);
  }, [toast]);

  const go = (key: PanelKey) => {
    setPanel(key);
    history.replaceState(null, '', `#${key}`);
    // replaceState does not emit hashchange; header navigation uses that event
    // to keep the favorites shortcut in sync with the active profile panel.
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    requestAnimationFrame(() => document.getElementById(key)?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
  };

  const toggleOrder = (id: number) =>
    setOpen((old) => {
      const next = new Set(old);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Remove from favorites (optimistic UI + server toggle)
  const handleRemoveFavorite = async (productId: string) => {
    setFavorites((prev) => prev.filter((p) => p.id !== productId));
    await toggleWishlist({ productId });
    setToast('Удалено из избранного');
  };

  return (
    <main className="mx-auto w-[min(100%-48px,1200px)] pb-20 pt-[26px] max-[560px]:w-[min(100%-28px,1200px)]">
      <style>{'@keyframes panelIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}'}</style>

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-[13px] text-ink-muted">
        <Link href="/" className="hover:text-ink">
          Главная
        </Link>
        <span className="[&>svg]:h-[14px] [&>svg]:w-[14px] opacity-60">{ICONS.chevron}</span>
        <span className="font-semibold text-ink">Профиль</span>
      </nav>

      {/* Account hero */}
      <section className="mt-3.5 grid grid-cols-[minmax(0,1fr)_360px] items-center gap-6 max-[980px]:grid-cols-1 max-[980px]:gap-[18px]">
        <div className="flex min-w-0 flex-wrap items-center gap-5">
          {/* Avatar */}
          <div className="grid h-[76px] w-[76px] shrink-0 place-items-center rounded-full border border-line bg-surface-soft font-display text-[28px] font-extrabold tracking-tight">
            {initials(name, user.email)}
          </div>
          {/* Identity */}
          <div className="min-w-0">
            <h1 className="font-display text-[clamp(28px,3.6vw,40px)] font-extrabold leading-none tracking-[-0.035em]">
              {name}
            </h1>
            <div className="mt-[9px] flex flex-wrap items-center gap-2.5 text-[13.5px] text-ink-muted">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(151_35%_38%_/_0.12)] px-3 py-1 text-xs font-bold text-[hsl(151_45%_26%)]">
                <span className="[&>svg]:h-[13px] [&>svg]:w-[13px]">{ICONS.star}</span>
                Ritm Club · Gold
              </span>
              <span className="h-[3px] w-[3px] rounded-full bg-ink-muted/55" />
              <span className="min-w-0 break-all">{user.email}</span>
              <span className="h-[3px] w-[3px] rounded-full bg-ink-muted/55" />
              <span>С нами с {fmtDate.format(new Date(user.createdAt))}</span>
            </div>
            <div className="mt-3.5 flex flex-wrap items-center gap-2">
              {isAdmin && (
                <Link
                  href="/admin"
                  className="inline-flex h-[38px] items-center gap-2 rounded-full bg-primary px-4 text-[13px] font-bold text-primary-foreground hover:bg-primary/90"
                >
                  <span className="[&>svg]:h-4 [&>svg]:w-4">{ICONS.overview}</span>
                  Админка
                </Link>
              )}
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: '/' })}
                className="inline-flex h-[38px] items-center gap-2 rounded-full border border-line bg-surface px-4 text-[13px] font-bold text-ink-muted hover:border-danger/40 hover:text-danger"
              >
                <span className="[&>svg]:h-4 [&>svg]:w-4">{ICONS.logout}</span>
                Выйти
              </button>
            </div>
          </div>
        </div>

        {/* Loyalty card */}
        <Loyalty name={name} createdAt={user.createdAt} />
      </section>

      {/* Layout: sidebar + panels */}
      <div className="mt-[30px] grid grid-cols-[248px_minmax(0,1fr)] items-start gap-7 max-[900px]:mt-2 max-[900px]:grid-cols-1 max-[900px]:gap-0">
        {/* Sidebar */}
        <aside className="sticky top-[140px] grid gap-1.5 rounded-[24px] border border-line bg-surface p-3.5 max-[900px]:hidden">
          {PANELS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => go(p.key)}
              aria-current={panel === p.key ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-[14px] px-[13px] py-[11px] text-left text-sm font-semibold hover:bg-surface-soft/70',
                panel === p.key && 'bg-primary text-primary-foreground hover:bg-primary',
              )}
            >
              <span
                className={cn(
                  'h-[18px] w-[18px] shrink-0 [&_svg]:h-[18px] [&_svg]:w-[18px]',
                  panel === p.key ? 'text-primary-foreground' : 'text-ink-muted',
                )}
              >
                {ICONS[p.key]}
              </span>
              <span className="flex-1">{p.label}</span>
              {p.key === 'orders' && <NavCount active={panel === p.key}>{orders.length}</NavCount>}
              {p.key === 'favorites' && <NavCount active={panel === p.key}>{favorites.length}</NavCount>}
            </button>
          ))}
          <span className="mx-1 my-2 h-px bg-line" />
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center gap-3 rounded-[14px] px-[13px] py-[11px] text-left text-sm font-semibold text-danger hover:bg-danger/10"
          >
            <span className="h-[18px] w-[18px] shrink-0 text-danger [&_svg]:h-[18px] [&_svg]:w-[18px]">
              {ICONS.logout}
            </span>
            <span className="flex-1">Выйти</span>
          </button>
        </aside>

        {/* Mobile panel switcher */}
        <div className="mt-[22px] hidden gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] max-[900px]:flex [&::-webkit-scrollbar]:hidden">
          {PANELS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => go(p.key)}
              aria-current={panel === p.key ? 'page' : undefined}
              className={cn(
                'min-h-10 whitespace-nowrap rounded-full border border-line bg-surface px-4 text-[13px] font-bold',
                panel === p.key && 'border-primary bg-primary text-primary-foreground',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Panels */}
        <div className="min-w-0">
          <Panel
            id="overview"
            active={panel === 'overview'}
            title="Обзор"
            text="Главное по аккаунту, заказам и сохранённым данным."
          >
            <Overview
              user={user}
              orders={orders}
              totalSpent={totalSpent}
              favs={favorites.length}
              go={go}
              addresses={addresses}
            />
          </Panel>

          <Panel
            id="orders"
            active={panel === 'orders'}
            title="Заказы"
            text="История покупок, трекинг доставки и детали каждого заказа."
          >
            <Orders
              orders={orders}
              visible={visible}
              counts={counts}
              filter={filter}
              query={query}
              open={open}
              setFilter={setFilter}
              setQuery={setQuery}
              toggle={toggleOrder}
            />
          </Panel>

          <Panel
            id="favorites"
            active={panel === 'favorites'}
            title="Избранное"
            text="Сохранённые товары — добавьте в корзину, пока есть размеры."
          >
            <Favorites favorites={favorites} onRemove={handleRemoveFavorite} />
          </Panel>

          <Panel
            id="addresses"
            active={panel === 'addresses'}
            title="Адреса"
            text="Адреса доставки для оформления заказов."
          >
            <Addresses addresses={addresses} />
          </Panel>

          <Panel
            id="settings"
            active={panel === 'settings'}
            title="Настройки"
            text="Личные данные, уведомления и безопасность аккаунта."
          >
            <Settings user={user} initial={initial} toast={setToast} />
          </Panel>
        </div>
      </div>

      {/* Toast */}
      <div
        className={cn(
          'pointer-events-none fixed bottom-[26px] left-1/2 z-[80] -translate-x-1/2 translate-y-5 rounded-full bg-footer px-5 py-3 text-[13.5px] font-bold text-primary-foreground opacity-0 shadow-[0_22px_70px_hsl(var(--color-text)/.08)] transition-all',
          toast && 'translate-y-0 opacity-100',
        )}
      >
        {toast ?? 'Сохранено'}
      </div>
    </main>
  );
}

// ── Panel wrapper ─────────────────────────────────────────────────────────

function Panel({
  id,
  active,
  title,
  text,
  children,
}: {
  id: PanelKey;
  active: boolean;
  title: string;
  text: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      tabIndex={-1}
      className={cn(
        'hidden scroll-mt-[86px]',
        active && 'block [animation:panelIn_.32s_cubic-bezier(.3,.7,.2,1)_both]',
      )}
    >
      <div className="mb-[18px]">
        <h2 className="font-display text-[clamp(22px,2.6vw,28px)] font-extrabold tracking-[-0.035em]">{title}</h2>
        <p className="mt-1 text-[13.5px] text-ink-muted">{text}</p>
      </div>
      {children}
    </section>
  );
}

// ── Loyalty card ──────────────────────────────────────────────────────────

function Loyalty({ name, createdAt }: { name: string; createdAt: string }) {
  const p = Math.min(100, Math.round((POINTS / 2000) * 100));
  return (
    <div className="relative isolate grid gap-3.5 overflow-hidden rounded-[24px] bg-footer px-[22px] py-5 text-primary-foreground shadow-[0_22px_70px_hsl(var(--color-text)/.08)] max-[980px]:max-w-[460px]">
      {/* Watermark — Ritm wordmark */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-1 -bottom-4 select-none font-display text-[124px] font-extrabold leading-none tracking-[-0.11em] text-primary-foreground opacity-[.08]"
      >
        Ritm
      </span>

      {/* Top: eyebrow + gold badge */}
      <div className="z-[1] flex justify-between">
        <span className="text-[10.5px] font-extrabold uppercase tracking-[.18em] text-primary-foreground/70">
          Ritm Club
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-warm/40 bg-warm/15 px-[11px] py-[3px] text-[11px] font-bold text-[hsl(42_92%_72%)]">
          <span className="[&>svg]:h-3 [&>svg]:w-3">{ICONS.star}</span>
          Gold
        </span>
      </div>

      {/* Points */}
      <div className="z-[1] flex items-baseline gap-2.5">
        <span className="tnum font-display text-[38px] font-extrabold leading-none tracking-tight text-warm">
          {POINTS.toLocaleString('ru-RU')}
        </span>
        <span className="text-[12.5px] font-semibold text-primary-foreground/72">бонусных баллов</span>
      </div>

      {/* Meta */}
      <div className="z-[1] flex flex-wrap items-center gap-2.5 text-[12.5px] text-primary-foreground/82">
        <b className="text-primary-foreground">{name}</b>
        <span className="h-[3px] w-[3px] rounded-full bg-primary-foreground/40" />
        <span>в Ritm с {fmtDate.format(new Date(createdAt))}</span>
      </div>

      {/* Progress bar */}
      <div className="z-[1] grid gap-2">
        <div className="flex items-center justify-between gap-2.5 text-[11.5px] text-primary-foreground/78">
          <span>
            До статуса Platinum — <b className="text-primary-foreground">{2000 - POINTS} баллов</b>
          </span>
          <b className="tnum">{p}%</b>
        </div>
        <div className="h-[7px] overflow-hidden rounded-full bg-primary-foreground/15">
          <div className="h-full rounded-full bg-gradient-to-r from-warm/75 to-warm" style={{ width: `${p}%` }} />
        </div>
      </div>
    </div>
  );
}

// ── Overview panel ────────────────────────────────────────────────────────

function Overview({
  user,
  orders,
  totalSpent,
  favs,
  go,
  addresses,
}: {
  user: ProfileUser;
  orders: ProfileOrder[];
  totalSpent: number;
  favs: number;
  go: (key: PanelKey) => void;
  addresses: SavedAddress[];
}) {
  const a = addresses[0] ?? { city: 'Не указан', street: '', label: '', id: '', comment: null, isDefault: false };
  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3.5 max-[1024px]:grid-cols-2">
        <Stat icon={ICONS.orders} n={orders.length} t="Заказов" />
        <Stat icon={ICONS.money} n={formatPrice(totalSpent)} t="Потрачено" />
        <Stat icon={ICONS.favorites} n={favs} t="В избранном" />
        <Stat icon={ICONS.star} n={POINTS.toLocaleString('ru-RU')} t="Баллов Ritm Club" />
      </div>

      {/* Columns: recent orders + profile summary */}
      <div className="mt-[18px] grid grid-cols-[1.4fr_1fr] gap-[18px] max-[1024px]:grid-cols-1">
        <Card>
          <div className="mb-3.5 flex items-center justify-between gap-3">
            <h3 className="font-display text-base font-extrabold">Последние заказы</h3>
            <button
              type="button"
              onClick={() => go('orders')}
              className="inline-flex items-center gap-1.5 text-[13px] font-bold text-ink-muted hover:text-ink"
            >
              Все заказы
              <span className="[&>svg]:h-[14px] [&>svg]:w-[14px]">{ICONS.arrow}</span>
            </button>
          </div>
          {orders.slice(0, 3).map((o) => (
            <MiniOrder key={o.orderNumber} order={o} />
          ))}
          {orders.length === 0 && (
            <p className="rounded-[18px] border border-dashed border-line bg-surface-soft p-4 text-sm text-ink-muted">
              Заказов пока нет.
            </p>
          )}
        </Card>

        <Card>
          <div className="mb-3.5 flex items-center justify-between gap-3">
            <h3 className="font-display text-base font-extrabold">Профиль</h3>
            <button
              type="button"
              onClick={() => go('settings')}
              className="inline-flex items-center gap-1.5 text-[13px] font-bold text-ink-muted hover:text-ink"
            >
              Изменить
              <span className="[&>svg]:h-[14px] [&>svg]:w-[14px]">{ICONS.arrow}</span>
            </button>
          </div>
          <Row k="Имя" v={user.name || 'Не указано'} />
          <Row k="E-mail" v={user.email} />
          <Row k="Телефон" v={user.phone || 'Не указан'} />
          <Row k="Адрес" v={a.city && a.street ? `${a.city}, ${a.street}` : 'Не указан'} />
        </Card>
      </div>
    </>
  );
}

// ── Orders panel ──────────────────────────────────────────────────────────

function Orders(p: {
  orders: ProfileOrder[];
  visible: ProfileOrder[];
  counts: Record<FilterKey, number>;
  filter: FilterKey;
  query: string;
  open: ReadonlySet<number>;
  setFilter: (f: FilterKey) => void;
  setQuery: (q: string) => void;
  toggle: (id: number) => void;
}) {
  return (
    <>
      {/* Toolbar */}
      <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] gap-3.5 max-[760px]:grid-cols-1">
        <label className="grid h-11 max-w-[320px] grid-cols-[auto_minmax(0,1fr)] items-center gap-2.5 rounded-full border border-line bg-surface px-4 text-ink-muted max-[760px]:max-w-none">
          <svg className="h-[17px] w-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
            <circle cx="11" cy="11" r="7" />
            <path d="m16.5 16.5 4 4" />
          </svg>
          <input
            value={p.query}
            onChange={(e) => p.setQuery(e.target.value)}
            placeholder="Найти заказ или товар…"
            className="min-w-0 bg-transparent text-sm text-ink outline-none"
          />
        </label>
        <span className="text-[13px] font-semibold text-ink-muted">
          <b className="text-ink">{p.visible.length}</b> заказов
        </span>
      </div>

      {/* Filter chips */}
      <div className="mb-[18px] flex gap-[9px] overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => p.setFilter(f.key)}
            aria-pressed={p.filter === f.key}
            className={cn(
              'inline-flex min-h-[38px] items-center gap-2 whitespace-nowrap rounded-full border border-line bg-surface px-4 text-[13px] font-semibold',
              p.filter === f.key && 'border-primary bg-primary text-primary-foreground',
            )}
          >
            {f.key !== 'all' && <span className={cn('h-[7px] w-[7px] rounded-full', f.dot)} />}
            {f.label}
            <span className="tnum text-[11px] opacity-70">{p.counts[f.key]}</span>
          </button>
        ))}
      </div>

      {/* Order cards */}
      <div className="grid gap-3.5">
        {p.visible.map((o) => (
          <OrderCard
            key={o.orderNumber}
            order={o}
            open={p.open.has(o.orderNumber)}
            toggle={() => p.toggle(o.orderNumber)}
          />
        ))}
      </div>

      {/* Empty states */}
      {p.orders.length === 0 && (
        <Empty
          title="Заказов пока нет"
          text="Когда вы оформите первый заказ, здесь появятся детали, трекинг и состав покупки."
          href="/catalog"
        />
      )}
      {p.orders.length > 0 && p.visible.length === 0 && (
        <Empty title="Ничего не нашлось" text="Попробуйте изменить фильтр или поисковый запрос." />
      )}
    </>
  );
}

function OrderCard({ order, open, toggle }: { order: ProfileOrder; open: boolean; toggle: () => void }) {
  const thumbs = order.items.slice(0, 3);
  const detailHref = getOrderDetailHref(order.orderNumber);
  const paymentHref = getProfileOrderPaymentHref(order);
  return (
    <article className="overflow-hidden rounded-[24px] border border-line bg-surface">
      {/* Summary row (clickable) */}
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 p-4 text-left max-[560px]:grid-cols-[minmax(0,1fr)_auto]"
      >
        {/* Thumbnails */}
        <div className="flex max-[560px]:hidden">
          {thumbs.map((i, n) => (
            <span
              key={n}
              className={cn(
                'relative h-14 w-[50px] overflow-hidden rounded-xl border border-line bg-surface-soft shadow-[0_0_0_3px_hsl(var(--color-surface))]',
                n > 0 && '-ml-3.5',
              )}
            >
              {i.imageUrl && <Image src={i.imageUrl} alt="" fill sizes="50px" className="object-cover" />}
            </span>
          ))}
          {order.items.length > thumbs.length && (
            <span className="-ml-3.5 grid h-14 w-[50px] place-items-center rounded-xl border border-line bg-surface-soft text-xs font-bold text-ink-muted">
              +{order.items.length - thumbs.length}
            </span>
          )}
        </div>

        {/* Meta */}
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-display text-base font-extrabold tracking-tight">RITM-{order.orderNumber}</span>
            <OrderStatusBadge status={order.status} paymentStatus={order.paymentStatus} />
          </div>
          <p className="mt-[5px] text-[12.5px] text-ink-muted">
            {fmtDate.format(new Date(order.createdAt))} · <b className="text-ink">{order.items.length} поз.</b>
          </p>
        </div>

        {/* Right: total + chevron */}
        <div className="flex items-center gap-3.5">
          <div className="text-right">
            <div className="text-[11px] text-ink-muted">Итого</div>
            <div className="tnum font-display text-lg font-extrabold">{formatPrice(order.totalAmount)}</div>
          </div>
          <span
            className={cn(
              'grid h-[34px] w-[34px] place-items-center rounded-full border border-line bg-surface text-ink-muted transition-transform',
              open && 'rotate-180 bg-surface-soft text-ink',
            )}
          >
            <span aria-hidden="true" className="h-2 w-2 rotate-45 border-b-2 border-r-2 border-current" />
          </span>
        </div>
      </button>

      {/* Expanded detail */}
      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-300',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <div className="grid grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] gap-[26px] border-t border-line p-5 max-[760px]:grid-cols-1">
            {/* Timeline */}
            <Timeline status={order.status} date={order.createdAt} />

            {/* Line items + totals */}
            <div>
              <h4 className="mb-3.5 text-xs font-extrabold uppercase tracking-[.06em] text-ink-muted">Состав заказа</h4>
              {order.items.map((item, i) => (
                <Line key={i} item={item} />
              ))}

              {/* Mini totals */}
              <div className="mt-[22px] border-t border-line pt-4">
                <h4 className="mb-3 text-xs font-extrabold uppercase tracking-[.06em] text-ink-muted">Итоги</h4>
                <Total label="Подытог" value={order.itemsTotal} />
                {order.discountAmount > 0 && <Total label="Скидка" value={-order.discountAmount} />}
                <Total label="Доставка" value={order.shippingAmount} />
                <div className="mt-2 flex items-baseline justify-between border-t border-line pt-3">
                  <span className="font-display text-[15px] font-extrabold">Итого</span>
                  <span className="tnum font-display text-xl font-extrabold">{formatPrice(order.totalAmount)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-[18px] flex flex-wrap gap-2.5">
                <Link
                  href={detailHref}
                  className="inline-flex h-[42px] items-center gap-2 rounded-full bg-primary px-[18px] text-[13px] font-bold text-primary-foreground"
                >
                  <svg
                    className="h-[15px] w-[15px]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                  >
                    <path d="M14 3h7v7" />
                    <path d="M21 3 10 14" />
                    <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
                  </svg>
                  Открыть заказ
                </Link>
                {paymentHref && (
                  <Link
                    href={paymentHref}
                    className="inline-flex h-[42px] items-center gap-2 rounded-full border border-line bg-surface px-[18px] text-[13px] font-bold"
                  >
                    <svg
                      className="h-[15px] w-[15px]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.9"
                    >
                      <rect x="3" y="6" width="18" height="12" rx="2" />
                      <path d="M3 10h18" />
                    </svg>
                    Продолжить оплату
                  </Link>
                )}
                <button
                  type="button"
                  disabled
                  className="inline-flex h-[42px] items-center gap-2 rounded-full border border-line bg-surface-soft px-[18px] text-[13px] font-bold text-ink-muted opacity-70"
                >
                  <svg
                    className="h-[15px] w-[15px]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                  >
                    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                    <path d="M3 4v4h4" />
                  </svg>
                  Повторить заказ
                </button>
                <button
                  type="button"
                  disabled
                  className="inline-flex h-[42px] items-center gap-2 rounded-full border border-line bg-surface-soft px-[18px] text-[13px] font-bold text-ink-muted opacity-70"
                >
                  <svg
                    className="h-[15px] w-[15px]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                  >
                    <path d="M14 3h7v7" />
                    <path d="M21 3 10 14" />
                    <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
                  </svg>
                  Накладная
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function Timeline({ status, date }: { status: OrderStatusKey; date: string }) {
  const steps = status === 'CANCELLED' ? ['Оформлен', 'Отменён'] : ['Оформлен', 'Собирается', 'В пути', 'Доставлен'];
  const cur =
    status === 'PENDING' ? 0 : status === 'PROCESSING' ? 1 : status === 'SHIPPED' ? 2 : status === 'DELIVERED' ? 3 : 1;

  return (
    <div>
      <h4 className="mb-3.5 text-xs font-extrabold uppercase tracking-[.06em] text-ink-muted">Трекинг</h4>
      {steps.map((s, i) => {
        const done = status === 'DELIVERED' || i < cur;
        const current = i === cur && !done;
        const cancelled = status === 'CANCELLED' && i === 1;
        return (
          <div key={s} className="grid grid-cols-[22px_1fr] gap-3">
            {/* Rail */}
            <div className="grid justify-items-center">
              <span
                className={cn(
                  'z-[1] mt-px h-[18px] w-[18px] rounded-full border-2 border-line bg-surface',
                  done && 'border-accent bg-accent',
                  current && 'border-accent shadow-[0_0_0_4px_hsl(var(--color-accent)/.16)]',
                  cancelled && 'border-danger bg-danger',
                )}
              />
              {i < steps.length - 1 && (
                <span className={cn('min-h-[26px] w-0.5 flex-1 bg-line', done && 'bg-accent')} />
              )}
            </div>
            {/* Body */}
            <div className="pb-[18px]">
              <div className={cn('text-[13.5px] font-bold', !done && !current && !cancelled && 'text-ink-muted')}>
                {s}
              </div>
              <div className="text-xs text-ink-muted">
                {i === 0 ? fmtDate.format(new Date(date)) : !done && !current && !cancelled ? 'Ожидается' : 'Обновлено'}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Favorites panel ───────────────────────────────────────────────────────

function Favorites({ favorites, onRemove }: { favorites: ProductCardData[]; onRemove: (productId: string) => void }) {
  if (favorites.length === 0) {
    return (
      <div className="rounded-[24px] border border-dashed border-line bg-surface px-6 py-[60px] text-center">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-surface-soft text-ink-muted">
          <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M12 20.5s-7.25-4.45-7.25-10.2A4.35 4.35 0 0 1 12 7.25a4.35 4.35 0 0 1 7.25 3.05C19.25 16.05 12 20.5 12 20.5Z" />
          </svg>
        </div>
        <h3 className="font-display text-[22px] font-bold tracking-tight">В избранном пусто</h3>
        <p className="mx-auto mt-2 max-w-[38ch] text-sm text-ink-muted">
          Нажимайте ♡ на товарах в каталоге, чтобы сохранить их сюда.
        </p>
        <Link
          href="/catalog"
          className="mt-5 inline-flex h-[50px] items-center gap-2.5 rounded-full bg-primary px-6 text-[15px] font-bold text-primary-foreground"
        >
          В каталог
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4 max-[1024px]:grid-cols-2 max-[400px]:grid-cols-1">
      {favorites.map((p) => (
        <article
          key={p.slug}
          className="group rounded-[18px] border border-line bg-surface p-2.5 transition-all hover:border-ink/20 hover:shadow-[0_16px_36px_hsl(var(--color-text)/.07)]"
        >
          <div className="relative aspect-[1/1.04] overflow-hidden rounded-[13px] bg-surface-soft">
            <Link href={`/product/${p.slug}`} className="block h-full w-full">
              {p.imageUrl && (
                <Image
                  src={p.imageUrl}
                  alt={p.imageAlt}
                  fill
                  sizes="(max-width:400px) 100vw, (max-width:1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-[400ms] group-hover:scale-105"
                />
              )}
            </Link>
            <button
              type="button"
              onClick={() => onRemove(p.id)}
              className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-surface/92 text-danger backdrop-blur transition-transform hover:scale-110"
              aria-label={`Убрать ${p.name} из избранного`}
            >
              <svg className="h-[17px] w-[17px]" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor">
                <path d="M12 20.5s-7.25-4.45-7.25-10.2A4.35 4.35 0 0 1 12 7.25a4.35 4.35 0 0 1 7.25 3.05C19.25 16.05 12 20.5 12 20.5Z" />
              </svg>
            </button>
          </div>
          <div className="flex items-end justify-between gap-2.5 px-1.5 pb-px pt-3">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-extrabold tracking-tight">{p.name}</h3>
              <p className="mt-0.5 text-[11.5px] text-ink-muted">{p.brand}</p>
              <span className="tnum mt-1.5 block font-extrabold text-accent">{formatPrice(p.minPrice)}</span>
            </div>
            <Link
              href={`/product/${p.slug}`}
              className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full border border-line bg-surface text-ink transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
              aria-label={`Открыть ${p.name}`}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}

// ── Addresses panel ───────────────────────────────────────────────────────

function Addresses({ addresses }: { addresses: SavedAddress[] }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ label: 'Дом', city: '', street: '', comment: '' });
  const [pending, startAdd] = useTransition();

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    startAdd(async () => {
      await addAddress(form);
      setForm({ label: 'Дом', city: '', street: '', comment: '' });
      setShowForm(false);
    });
  };

  return (
    <div className="grid grid-cols-2 gap-4 max-[560px]:grid-cols-1">
      {addresses.map((a) => (
        <div
          key={a.id}
          className={cn(
            'relative grid gap-2 rounded-[24px] border border-line bg-surface p-5',
            a.isDefault && 'border-accent/45 shadow-[inset_0_0_0_1px_hsl(var(--color-accent)/.2)]',
          )}
        >
          {a.isDefault && (
            <span className="absolute right-4 top-4 rounded-full border border-accent/30 bg-accent/12 px-[9px] py-[3px] text-[10.5px] font-bold uppercase tracking-[.04em] text-[hsl(151_48%_24%)]">
              По умолчанию
            </span>
          )}
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-surface-soft text-ink [&_svg]:h-[18px] [&_svg]:w-[18px]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 11.5 12 4l9 7.5" />
                <path d="M5 10v9.5h14V10" />
                <path d="M9.5 19.5V14h5v5.5" />
              </svg>
            </span>
            <div>
              <div className="text-[14.5px] font-extrabold">{a.label}</div>
            </div>
          </div>
          <p className="text-[13px] leading-[1.55] text-ink-muted">
            <b className="text-ink">{a.city}</b>
            <br />
            {a.street}
            {a.comment && (
              <>
                <br />
                {a.comment}
              </>
            )}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {!a.isDefault && (
              <button
                type="button"
                onClick={() => setDefaultAddress(a.id)}
                className="h-9 rounded-full border border-line bg-surface px-3.5 text-[12.5px] font-bold hover:border-ink/30"
              >
                По умолчанию
              </button>
            )}
            <button
              type="button"
              onClick={() => deleteAddress(a.id)}
              className="h-9 rounded-full border border-line bg-surface px-3.5 text-[12.5px] font-bold text-danger hover:border-danger/40"
            >
              Удалить
            </button>
          </div>
        </div>
      ))}

      {/* Add address tile or form */}
      {showForm ? (
        <form onSubmit={handleAdd} className="grid gap-3 rounded-[24px] border border-line bg-surface p-5">
          <h3 className="text-base font-extrabold">Новый адрес</h3>
          <input
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            placeholder="Название (Дом, Работа…)"
            className="h-12 rounded-[14px] border border-line bg-surface px-3.5 text-sm outline-none"
          />
          <input
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            placeholder="Город"
            required
            className="h-12 rounded-[14px] border border-line bg-surface px-3.5 text-sm outline-none"
          />
          <input
            value={form.street}
            onChange={(e) => setForm({ ...form, street: e.target.value })}
            placeholder="Улица, дом, квартира"
            required
            className="h-12 rounded-[14px] border border-line bg-surface px-3.5 text-sm outline-none"
          />
          <input
            value={form.comment}
            onChange={(e) => setForm({ ...form, comment: e.target.value })}
            placeholder="Комментарий (необязательно)"
            className="h-12 rounded-[14px] border border-line bg-surface px-3.5 text-sm outline-none"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="h-[42px] rounded-full bg-primary px-5 text-[13px] font-bold text-primary-foreground disabled:opacity-60"
            >
              {pending ? 'Сохраняем…' : 'Сохранить'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="h-[42px] rounded-full border border-line px-5 text-[13px] font-bold"
            >
              Отмена
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="grid min-h-[150px] place-items-center gap-2.5 rounded-[24px] border border-dashed border-line text-[13.5px] font-bold text-ink-muted hover:bg-surface/50"
        >
          <span className="grid h-10 w-10 place-items-center rounded-full bg-surface-soft text-ink">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
          Добавить адрес
        </button>
      )}
    </div>
  );
}

// ── Settings panel ─────────────────────────────────────────────────────────

function Settings({ user, initial, toast }: { user: ProfileUser; initial: ProfileValues; toast: (s: string) => void }) {
  return (
    <>
      <Personal user={user} initial={initial} toast={toast} />
      <Password toast={toast} />
    </>
  );
}

function Personal({ user, initial, toast }: { user: ProfileUser; initial: ProfileValues; toast: (s: string) => void }) {
  const [first, last] = splitName(initial.name ?? '');
  const [f, setF] = useState({
    name: first,
    surname: last,
    phone: initial.phone ?? '',
    birthdate: initial.birthdate ?? '',
    email: user.email,
  });
  const [err, setErr] = useState(false);
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsed = profileSchema.safeParse({
      name: [f.name, f.surname].filter(Boolean).join(' ').trim(),
      phone: f.phone,
      birthdate: f.birthdate,
    });
    if (!parsed.success) {
      setErr(true);
      return;
    }
    setErr(false);
    start(async () => {
      const r = await updateProfile(parsed.data);
      toast(r.ok ? 'Изменения сохранены' : r.error);
    });
  };

  return (
    <Card className="mb-[18px]">
      <h3 className="mb-4 text-base font-extrabold">Личные данные</h3>
      <form onSubmit={submit} className="grid max-w-[560px] gap-[18px]">
        <div className="grid grid-cols-2 gap-4 max-[560px]:grid-cols-1">
          <Field id="set-name" label="Имя" value={f.name} set={(v) => setF({ ...f, name: v })} error={err} />
          <Field id="set-surname" label="Фамилия" value={f.surname} set={(v) => setF({ ...f, surname: v })} />
          <Field id="set-phone" label="Телефон" value={f.phone} set={(v) => setF({ ...f, phone: v })} />
          <Field
            id="set-birthdate"
            label="Дата рождения"
            value={f.birthdate}
            set={(v) => setF({ ...f, birthdate: v })}
            type="date"
          />
        </div>
        <Field
          id="set-email"
          label="E-mail"
          value={f.email}
          set={(v) => setF({ ...f, email: v })}
          type="email"
          disabled
        />
        <Submit pending={pending}>{pending ? 'Сохраняем...' : 'Сохранить изменения'}</Submit>
      </form>
    </Card>
  );
}

function Password({ toast }: { toast: (s: string) => void }) {
  const [v, setV] = useState({ current: '', next: '', repeat: '' });
  const [show, setShow] = useState({ current: false, next: false, repeat: false });
  const [bad, setBad] = useState<ReadonlySet<keyof typeof v>>(() => new Set());
  const [pending, start] = useTransition();
  const str = strength(v.next);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const b = new Set<keyof typeof v>();
    if (!v.current) b.add('current');
    if (v.next.length < 8) b.add('next');
    if (v.repeat !== v.next || v.repeat.length < 8) b.add('repeat');
    setBad(b);
    if (b.size === 0) {
      start(async () => {
        const r = await updatePassword({
          currentPassword: v.current,
          newPassword: v.next,
          repeatPassword: v.repeat,
        });
        if (!r.ok) {
          toast(r.error);
          if (r.error.includes('Текущий')) setBad(new Set(['current']));
          if (r.error.includes('Новый')) setBad(new Set(['next']));
          if (r.error.includes('совпадают')) setBad(new Set(['repeat']));
          return;
        }
        setV({ current: '', next: '', repeat: '' });
        toast('Пароль обновлён');
      });
    }
  };

  return (
    <Card className="mb-[18px]">
      <h3 className="mb-4 text-base font-extrabold">Смена пароля</h3>
      <form onSubmit={submit} className="grid max-w-[560px] gap-[18px]">
        <Pass
          id="pw-current"
          label="Текущий пароль"
          value={v.current}
          set={(x) => setV({ ...v, current: x })}
          show={show.current}
          toggle={() => setShow({ ...show, current: !show.current })}
          error={bad.has('current')}
        />
        <Pass
          id="pw-new"
          label="Новый пароль"
          value={v.next}
          set={(x) => setV({ ...v, next: x })}
          show={show.next}
          toggle={() => setShow({ ...show, next: !show.next })}
          error={bad.has('next')}
        />
        {/* Strength meter */}
        <div className="-mt-4 flex items-center gap-2">
          <div className="flex flex-1 gap-1">
            {[1, 2, 3, 4].map((n) => (
              <i key={n} className={cn('h-1 flex-1 rounded-full bg-line', str.level >= n && str.color)} />
            ))}
          </div>
          <span className="min-w-14 text-right text-[11px] font-bold text-ink-muted">{str.label}</span>
        </div>
        <Pass
          id="pw-repeat"
          label="Повторите пароль"
          value={v.repeat}
          set={(x) => setV({ ...v, repeat: x })}
          show={show.repeat}
          toggle={() => setShow({ ...show, repeat: !show.repeat })}
          error={bad.has('repeat')}
        />
        <Submit pending={pending}>{pending ? 'Обновляем...' : 'Обновить пароль'}</Submit>
      </form>
    </Card>
  );
}

// ── Small primitives ───────────────────────────────────────────────────────

function Field({
  id,
  label,
  value,
  set,
  type = 'text',
  disabled,
  error,
}: {
  id: string;
  label: string;
  value: string;
  set: (v: string) => void;
  type?: string;
  disabled?: boolean;
  error?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-xs font-bold uppercase tracking-[.04em] text-ink-muted">
        {label}
      </label>
      <div className="relative flex items-center">
        <LeadIcon />
        <input
          id={id}
          value={value}
          onChange={(e) => set(e.target.value)}
          type={type}
          disabled={disabled}
          className={cn(
            'h-12 w-full rounded-[14px] border border-line bg-surface pl-[42px] pr-3.5 text-sm outline-none hover:border-ink/25 disabled:opacity-70',
            error && 'border-danger',
          )}
        />
      </div>
      {error && <span className="text-xs font-semibold text-danger">Проверьте поля</span>}
    </div>
  );
}

function Pass(p: {
  id: string;
  label: string;
  value: string;
  set: (v: string) => void;
  show: boolean;
  toggle: () => void;
  error: boolean;
}) {
  return (
    <div className="grid gap-2">
      <label htmlFor={p.id} className="text-xs font-bold uppercase tracking-[.04em] text-ink-muted">
        {p.label}
      </label>
      <div className="relative flex items-center">
        <LeadIcon />
        <input
          id={p.id}
          type={p.show ? 'text' : 'password'}
          value={p.value}
          onChange={(e) => p.set(e.target.value)}
          className={cn(
            'h-12 w-full rounded-[14px] border border-line bg-surface pl-[42px] pr-[46px] text-sm outline-none hover:border-ink/25',
            p.error && 'border-danger',
          )}
        />
        <button
          type="button"
          onClick={p.toggle}
          className="absolute right-2 grid h-[34px] w-[34px] place-items-center rounded-full text-ink-muted hover:bg-surface-soft"
        >
          {p.show ? <EyeOff className="h-[19px] w-[19px]" /> : <Eye className="h-[19px] w-[19px]" />}
        </button>
      </div>
      {p.error && <span className="text-xs font-semibold text-danger">Проверьте пароль</span>}
    </div>
  );
}

function LeadIcon() {
  return (
    <svg
      className="pointer-events-none absolute left-3.5 h-[18px] w-[18px] text-ink-muted"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
    </svg>
  );
}

function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded-[24px] border border-line bg-surface p-[22px]', className)}>{children}</div>;
}

function Stat({ icon, n, t }: { icon: ReactNode; n: string | number; t: string }) {
  return (
    <div className="grid gap-2 rounded-[18px] border border-line bg-surface p-[18px]">
      <span className="grid h-[38px] w-[38px] place-items-center rounded-xl bg-surface-soft text-ink [&_svg]:h-[19px] [&_svg]:w-[19px]">
        {icon}
      </span>
      <span className="tnum font-display text-[26px] font-extrabold tracking-tight">{n}</span>
      <span className="text-[12.5px] font-semibold text-ink-muted">{t}</span>
    </div>
  );
}

function MiniOrder({ order }: { order: ProfileOrder }) {
  const first = order.items[0];
  return (
    <div className="flex flex-wrap items-center gap-3.5 border-t border-line py-3 first:border-t-0 sm:flex-nowrap">
      <div className="relative h-[50px] w-[46px] overflow-hidden rounded-[11px] border border-line bg-surface-soft">
        {first?.imageUrl && (
          <Image src={first.imageUrl} alt={first.productName} fill sizes="46px" className="object-cover" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-bold">RITM-{order.orderNumber}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
          <span>
            {fmtDate.format(new Date(order.createdAt))} · {order.items.length} поз.
          </span>
          <OrderStatusBadge status={order.status} paymentStatus={order.paymentStatus} />
        </div>
      </div>
      <div className="tnum shrink-0 text-sm font-extrabold">{formatPrice(order.totalAmount)}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 border-t border-line py-[13px] first:border-t-0">
      <span className="text-[13px] text-ink-muted">{k}</span>
      <span className="text-right text-[13.5px] font-semibold">{v}</span>
    </div>
  );
}

function Line({ item }: { item: ProfileOrderItem }) {
  return (
    <div className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 border-t border-line py-[9px] first:border-t-0">
      <div className="relative h-[50px] w-11 overflow-hidden rounded-[10px] border border-line bg-surface-soft">
        {item.imageUrl && (
          <Image src={item.imageUrl} alt={item.productName} fill sizes="44px" className="object-cover" />
        )}
      </div>
      <div>
        <div className="text-[13.5px] font-bold">{item.productName}</div>
        <div className="text-xs text-ink-muted">
          {item.brand} · {item.colorwayName} · {item.size}
        </div>
      </div>
      <div className="text-right">
        <div className="tnum text-sm font-extrabold">{formatPrice(item.price)}</div>
        <div className="text-xs text-ink-muted">x{item.qty}</div>
      </div>
    </div>
  );
}

function Total({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between py-1 text-[13px] text-ink-muted">
      <span>{label}</span>
      <span className="tnum text-ink">{value < 0 ? `-${formatPrice(Math.abs(value))}` : formatPrice(value)}</span>
    </div>
  );
}

function Empty({ title, text, href }: { title: string; text: string; href?: string }) {
  return (
    <div className="rounded-[24px] border border-dashed border-line bg-surface px-6 py-[60px] text-center">
      <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-surface-soft text-ink-muted">
        <span aria-hidden="true" className="h-7 w-7 rounded-full border border-ink-muted/40" />
      </div>
      <h3 className="font-display text-[22px] font-bold tracking-tight">{title}</h3>
      <p className="mx-auto mt-2 max-w-[38ch] text-sm text-ink-muted">{text}</p>
      {href && (
        <Link
          href={href}
          className="mt-5 inline-flex h-[50px] items-center gap-2.5 rounded-full bg-primary px-6 text-[15px] font-bold text-primary-foreground"
        >
          В каталог
        </Link>
      )}
    </div>
  );
}

function Submit({ children, pending }: { children: ReactNode; pending?: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-[52px] items-center justify-center gap-2.5 justify-self-start rounded-full bg-primary px-7 text-[15px] font-bold text-primary-foreground hover:bg-footer disabled:opacity-60"
    >
      {children}
    </button>
  );
}

function NavCount({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <span
      className={cn(
        'tnum rounded-full px-2 py-px text-[11px] font-bold',
        active ? 'bg-primary-foreground text-primary' : 'bg-surface-soft text-ink-muted',
      )}
    >
      {children}
    </span>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function isPanel(v: string): v is PanelKey {
  return PANELS.some((p) => p.key === v);
}

function toFilter(status: OrderStatusKey): FilterKey {
  if (status === 'PENDING' || status === 'PROCESSING') return 'processing';
  if (status === 'SHIPPED') return 'transit';
  if (status === 'DELIVERED') return 'delivered';
  return 'cancelled';
}

function splitName(name: string): [string, string] {
  const p = name.trim().split(/\s+/).filter(Boolean);
  return [p[0] ?? '', p.slice(1).join(' ')];
}

function initials(name: string, email: string) {
  const p = (name || email).trim().split(/\s+/);
  return p.length > 1 ? `${p[0][0]}${p[1][0]}`.toUpperCase() : (name || email).slice(0, 2).toUpperCase();
}

function strength(v: string) {
  let level = 0;
  if (v.length >= 8) level++;
  if (v.length >= 12) level++;
  if (/[A-ZА-Я]/.test(v) && /[a-zа-я]/.test(v)) level++;
  if (/\d/.test(v) && /[^\w\s]/.test(v)) level++;
  level = Math.min(level, 4);
  return {
    level,
    label: ['—', 'Слабый', 'Средний', 'Хороший', 'Надёжный'][level],
    color: ['bg-line', 'bg-danger', 'bg-warning', 'bg-warning', 'bg-accent'][level],
  };
}
