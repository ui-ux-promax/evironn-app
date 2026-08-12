export const PUBLIC_ROUTES = {
  home: '/',
  catalog: '/catalog',
  cart: '/cart',
  login: '/login',
  profile: '/profile',
} as const;

export const SHOWCASE_PRODUCT_PATH = '/product/noma-woven-lounge' as const;

function catalogPath(key: 'category' | 'room', slug: string): string {
  if (!slug) {
    throw new TypeError(`${key} slug must not be empty`);
  }

  return `/catalog?${key}=${encodeURIComponent(slug)}`;
}

export const catalogCategoryPath = (slug: string) => catalogPath('category', slug);
export const catalogRoomPath = (slug: string) => catalogPath('room', slug);
