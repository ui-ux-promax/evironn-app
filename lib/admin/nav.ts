export interface AdminNavItem {
  label: string;
  href: string;
  icon: string; // Material Symbols name
  exact: boolean; // exact match (dashboard) vs prefix match
}

/** Single source of truth for primary admin navigation (sidebar + mobile tab bar). */
export const ADMIN_NAV: AdminNavItem[] = [
  { label: 'Дашборд', href: '/admin', icon: 'dashboard', exact: true },
  { label: 'Заказы', href: '/admin/orders', icon: 'shopping_cart', exact: false },
  { label: 'Каталог', href: '/admin/catalog', icon: 'deployed_code', exact: false },
  { label: 'Клиенты', href: '/admin/customers', icon: 'group', exact: false },
  { label: 'Промокоды', href: '/admin/marketing', icon: 'confirmation_number', exact: false },
];

/** True if a nav item is the active route for `pathname`. */
export function isNavActive(item: AdminNavItem, pathname: string): boolean {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + '/');
}

/** Index of the active ADMIN_NAV item, or -1 if none match. */
export function resolveActiveIndex(pathname: string): number {
  return ADMIN_NAV.findIndex((item) => isNavActive(item, pathname));
}
