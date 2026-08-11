import { coupons, furnitureProducts } from '../../prisma/seed-data';

export const CANONICAL_INVENTORY = furnitureProducts.flatMap((product) =>
  product.skus.map((sku) => ({
    sku: sku.articleNumber,
    stock: sku.stock,
    price: sku.price,
    oldPrice: sku.oldPrice,
    compareAtPrice: sku.oldPrice,
    active: sku.active,
  })),
);

export const CANONICAL_COUPONS = coupons;

export const PORTFOLIO_FIXTURE_EMAILS = [
  'review-demo-1@seed.invalid',
  'review-demo-2@seed.invalid',
  'dashboard-demo-1@test.ritm.invalid',
  'dashboard-demo-2@test.ritm.invalid',
  'dashboard-demo-3@test.ritm.invalid',
  'dashboard-demo-4@test.ritm.invalid',
  'dashboard-demo-5@test.ritm.invalid',
  'dashboard-demo-6@test.ritm.invalid',
] as const;
