export const ADMIN_PRIMARY_ROUTE_ORDER = [
  '/admin',
  '/admin/orders',
  '/admin/catalog',
  '/admin/customers',
  '/admin/marketing',
] as const;

export const ADMIN_ROUTE_SMOKE_TARGETS = [
  { route: '/admin', pageFile: 'app/(admin)/admin/page.tsx' },
  { route: '/admin/catalog', pageFile: 'app/(admin)/admin/catalog/page.tsx' },
  { route: '/admin/catalog/products', pageFile: 'app/(admin)/admin/catalog/products/page.tsx' },
  { route: '/admin/catalog/products/new', pageFile: 'app/(admin)/admin/catalog/products/new/page.tsx' },
  { route: '/admin/catalog/products/[id]/edit', pageFile: 'app/(admin)/admin/catalog/products/[id]/edit/page.tsx' },
  { route: '/admin/catalog/categories', pageFile: 'app/(admin)/admin/catalog/categories/page.tsx' },
  { route: '/admin/catalog/categories/new', pageFile: 'app/(admin)/admin/catalog/categories/new/page.tsx' },
  { route: '/admin/catalog/categories/[id]/edit', pageFile: 'app/(admin)/admin/catalog/categories/[id]/edit/page.tsx' },
  { route: '/admin/orders', pageFile: 'app/(admin)/admin/orders/page.tsx' },
  { route: '/admin/orders/[id]', pageFile: 'app/(admin)/admin/orders/[id]/page.tsx' },
  { route: '/admin/customers', pageFile: 'app/(admin)/admin/customers/page.tsx' },
  { route: '/admin/customers/[id]', pageFile: 'app/(admin)/admin/customers/[id]/page.tsx' },
  { route: '/admin/marketing', pageFile: 'app/(admin)/admin/marketing/page.tsx' },
  { route: '/admin/marketing/new', pageFile: 'app/(admin)/admin/marketing/new/page.tsx' },
  { route: '/admin/marketing/[id]/edit', pageFile: 'app/(admin)/admin/marketing/[id]/edit/page.tsx' },
] as const;
