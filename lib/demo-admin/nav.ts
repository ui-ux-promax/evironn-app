export const DEMO_ADMIN_NAV = [
  { href: '/demo-admin', label: 'Дашборд', icon: 'space_dashboard' },
  { href: '/demo-admin/catalog', label: 'Каталог', icon: 'chair' },
  { href: '/demo-admin/orders', label: 'Заказы', icon: 'shopping_bag' },
  { href: '/demo-admin/customers', label: 'Клиенты', icon: 'group' },
  { href: '/demo-admin/marketing', label: 'Промокоды', icon: 'local_offer' },
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
