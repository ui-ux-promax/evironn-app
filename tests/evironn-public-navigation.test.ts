import { describe, expect, it } from 'vitest';

import {
  PUBLIC_ROUTES,
  SHOWCASE_DEFAULT_PRODUCT_PATH,
  SHOWCASE_PRODUCT_PATH,
  catalogCategoryPath,
  catalogRoomPath,
} from '@/components/evironn/public-routes';

describe('Evironn public navigation', () => {
  it('exposes the canonical public route constants', () => {
    expect(PUBLIC_ROUTES).toEqual({
      home: '/',
      catalog: '/catalog',
      cart: '/cart',
      login: '/login',
      profile: '/profile',
    });
    expect(SHOWCASE_PRODUCT_PATH).toBe('/product/noma-woven-lounge');
    expect(SHOWCASE_DEFAULT_PRODUCT_PATH).toBe(
      '/product/noma-woven-lounge?option=finish%3Awalnut%2Cupholstery%3Aivory-boucle',
    );
  });

  it('builds encoded canonical catalog links', () => {
    expect(catalogCategoryPath('armchairs')).toBe('/catalog?category=armchairs');
    expect(catalogRoomPath('living')).toBe('/catalog?room=living');
    expect(catalogCategoryPath('bar stools')).toBe('/catalog?category=bar%20stools');
  });

  it('rejects empty catalog slugs', () => {
    expect(() => catalogCategoryPath('')).toThrowError(TypeError);
    expect(() => catalogRoomPath('')).toThrowError(TypeError);
  });
});
