export type AdminNavItem = {
  href: string;
  label: string;
  match: 'exact' | 'prefix';
};

export const ADMIN_NAV: readonly AdminNavItem[] = [
  { href: '/admin', label: 'Дашборд', match: 'exact' },
  { href: '/admin/catalog', label: 'Каталог', match: 'prefix' },
  { href: '/admin/orders', label: 'Заказы', match: 'prefix' },
  { href: '/admin/customers', label: 'Клиенты', match: 'prefix' },
  { href: '/admin/marketing', label: 'Промокоды', match: 'prefix' },
] as const;

export const ADMIN_CATALOG_TABS: readonly AdminNavItem[] = [
  { href: '/admin/catalog/products', label: 'Товары', match: 'prefix' },
  { href: '/admin/catalog/categories', label: 'Категории', match: 'prefix' },
  { href: '/admin/catalog/options', label: 'Опции', match: 'prefix' },
  { href: '/admin/catalog/rooms', label: 'Комнаты', match: 'prefix' },
] as const;

export const ADMIN_NAV_ICON_NAMES: Readonly<Record<string, string>> = {
  '/admin': 'dashboard',
  '/admin/catalog': 'deployed_code',
  '/admin/orders': 'shopping_cart',
  '/admin/customers': 'group',
  '/admin/marketing': 'confirmation_number',
};

export function isActiveAdminHref(item: AdminNavItem, pathname: string): boolean {
  return item.match === 'exact'
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);
}
