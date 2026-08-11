export const DEMO_ADMIN_NAV = [
  { href: '/demo-admin', label: 'Дашборд', icon: 'dashboard' },
  { href: '/demo-admin/catalog', label: 'Каталог', icon: 'inventory_2' },
  { href: '/demo-admin/orders', label: 'Заказы', icon: 'receipt_long' },
  { href: '/demo-admin/customers', label: 'Клиенты', icon: 'group' },
  { href: '/demo-admin/marketing', label: 'Маркетинг', icon: 'sell' },
] as const;

export type DemoAdminNavItem = (typeof DEMO_ADMIN_NAV)[number];

export function isDemoNavActive(item: DemoAdminNavItem, pathname: string | null): boolean {
  if (!pathname) return false;
  if (item.href === '/demo-admin') return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function resolveDemoActiveIndex(pathname: string | null): number {
  return DEMO_ADMIN_NAV.findIndex((item) => isDemoNavActive(item, pathname));
}
