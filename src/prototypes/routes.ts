export type PrototypeArea = 'storefront' | 'admin';
export type PrototypePhase = `P${number}`;
export type PrototypeStatus = 'implemented' | 'planned';

export interface PrototypeRoute {
  readonly path: string;
  readonly label: string;
  readonly area: PrototypeArea;
  readonly phase: PrototypePhase;
  readonly status: PrototypeStatus;
}

export const prototypeRoutes = [
  {
    path: '/',
    label: 'Home',
    area: 'storefront',
    phase: 'P0',
    status: 'implemented',
  },
  {
    path: '/catalog',
    label: 'Catalog',
    area: 'storefront',
    phase: 'P2',
    status: 'planned',
  },
  {
    path: '/product/[slug]',
    label: 'Product detail',
    area: 'storefront',
    phase: 'P2',
    status: 'planned',
  },
  {
    path: '/product',
    label: 'Approved product',
    area: 'storefront',
    phase: 'P0',
    status: 'implemented',
  },
  {
    path: '/cart',
    label: 'Cart',
    area: 'storefront',
    phase: 'P3',
    status: 'planned',
  },
  {
    path: '/checkout',
    label: 'Checkout',
    area: 'storefront',
    phase: 'P4',
    status: 'planned',
  },
  {
    path: '/login',
    label: 'Login',
    area: 'storefront',
    phase: 'P5',
    status: 'planned',
  },
  {
    path: '/register',
    label: 'Register',
    area: 'storefront',
    phase: 'P5',
    status: 'planned',
  },
  {
    path: '/profile',
    label: 'Profile',
    area: 'storefront',
    phase: 'P6',
    status: 'planned',
  },
  {
    path: '/orders/[number]',
    label: 'Order detail',
    area: 'storefront',
    phase: 'P7',
    status: 'planned',
  },
  {
    path: '/blog',
    label: 'Blog',
    area: 'storefront',
    phase: 'P8',
    status: 'planned',
  },
  {
    path: '/faq',
    label: 'FAQ',
    area: 'storefront',
    phase: 'P8',
    status: 'planned',
  },
  {
    path: '/legal/delivery',
    label: 'Delivery',
    area: 'storefront',
    phase: 'P8',
    status: 'planned',
  },
  {
    path: '/legal/privacy',
    label: 'Privacy',
    area: 'storefront',
    phase: 'P8',
    status: 'planned',
  },
  {
    path: '/legal/refund',
    label: 'Refund',
    area: 'storefront',
    phase: 'P8',
    status: 'planned',
  },
  {
    path: '/legal/terms',
    label: 'Terms',
    area: 'storefront',
    phase: 'P8',
    status: 'planned',
  },
  {
    path: '/unsubscribe',
    label: 'Unsubscribe',
    area: 'storefront',
    phase: 'P8',
    status: 'planned',
  },
  {
    path: '/admin',
    label: 'Admin dashboard',
    area: 'admin',
    phase: 'P9',
    status: 'planned',
  },
  {
    path: '/admin/categories',
    label: 'Admin categories',
    area: 'admin',
    phase: 'P10',
    status: 'planned',
  },
  {
    path: '/admin/categories/new',
    label: 'New category',
    area: 'admin',
    phase: 'P11',
    status: 'planned',
  },
  {
    path: '/admin/categories/[slug]/edit',
    label: 'Edit category',
    area: 'admin',
    phase: 'P11',
    status: 'planned',
  },
  {
    path: '/admin/products',
    label: 'Admin products',
    area: 'admin',
    phase: 'P10',
    status: 'planned',
  },
  {
    path: '/admin/products/new',
    label: 'New product',
    area: 'admin',
    phase: 'P12',
    status: 'planned',
  },
  {
    path: '/admin/products/[slug]/edit',
    label: 'Edit product',
    area: 'admin',
    phase: 'P12',
    status: 'planned',
  },
  {
    path: '/admin/orders',
    label: 'Admin orders',
    area: 'admin',
    phase: 'P14',
    status: 'planned',
  },
  {
    path: '/admin/orders/[number]',
    label: 'Admin order detail',
    area: 'admin',
    phase: 'P14',
    status: 'planned',
  },
  {
    path: '/admin/customers',
    label: 'Admin customers',
    area: 'admin',
    phase: 'P15',
    status: 'planned',
  },
  {
    path: '/admin/customers/[id]',
    label: 'Admin customer detail',
    area: 'admin',
    phase: 'P15',
    status: 'planned',
  },
  {
    path: '/admin/coupons',
    label: 'Admin coupons',
    area: 'admin',
    phase: 'P16',
    status: 'planned',
  },
  {
    path: '/admin/coupons/new',
    label: 'New coupon',
    area: 'admin',
    phase: 'P16',
    status: 'planned',
  },
  {
    path: '/admin/coupons/[id]/edit',
    label: 'Edit coupon',
    area: 'admin',
    phase: 'P16',
    status: 'planned',
  },
] as const satisfies readonly PrototypeRoute[];

function normalizePath(pathname: string) {
  const path = pathname.trim().split('?')[0].split('#')[0];
  if (path === '/') return path;
  return path.replace(/\/+$/, '') || '/';
}

function matchesPattern(pattern: string, pathname: string) {
  const patternSegments = normalizePath(pattern).split('/');
  const pathSegments = normalizePath(pathname).split('/');
  if (patternSegments.length !== pathSegments.length) return false;
  return patternSegments.every(
    (segment, index) =>
      segment.startsWith('[') || segment === pathSegments[index],
  );
}

export function findPrototypeRoute(pathname: string) {
  return prototypeRoutes.find((route) => matchesPattern(route.path, pathname));
}
