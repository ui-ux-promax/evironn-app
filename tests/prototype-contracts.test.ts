import { expect, test } from 'vitest';
import { mockCategories, mockProducts } from '../src/prototypes/data/fixtures';
import { findPrototypeRoute, prototypeRoutes } from '../src/prototypes/routes';

test('route registry contains approved storefront and admin inventory', () => {
  const paths = prototypeRoutes.map((route) => route.path);
  expect(paths).toContain('/catalog');
  expect(paths).toContain('/checkout');
  expect(paths).toContain('/admin');
  expect(paths).toContain('/admin/products/[slug]/edit');
  expect(paths).not.toContain('/demo-admin');
  expect(findPrototypeRoute('/demo-admin')).toBeUndefined();
  expect(findPrototypeRoute('/product/noma-chair')?.path).toBe(
    '/product/[slug]',
  );
  expect(findPrototypeRoute('/admin/orders/EV-1001')?.path).toBe(
    '/admin/orders/[number]',
  );
  expect(findPrototypeRoute('/product//')).toBeUndefined();
  expect(findPrototypeRoute('/product/%20')).toBeUndefined();
});

test('fixtures satisfy furniture domain contract', () => {
  expect(mockCategories.length).toBeGreaterThan(0);
  expect(mockProducts[0].optionGroups[0].values[0]).toMatchObject({
    id: expect.any(String),
    value: expect.any(String),
    order: expect.any(Number),
  });
  expect(mockProducts[0].variants[0]).toMatchObject({
    id: expect.any(String),
    sku: expect.any(String),
    price: expect.any(Number),
    stock: expect.any(Number),
  });
  expect(mockProducts[0].media[0].src).toMatch(/^\/assets\//);
  expect(mockProducts[0].turntable?.webmSrc).toMatch(/^\/assets\//);
  expect(mockProducts[0].variants[0].mediaId).toBe(mockProducts[0].media[0].id);
  expect(mockProducts[0].media[0].src).toContain('graphite');
});
