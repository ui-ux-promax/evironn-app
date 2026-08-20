import { CANONICAL_COUPONS, CANONICAL_INVENTORY, PORTFOLIO_FIXTURE_EMAILS } from './canonical';
import { assertDemoEnvironment, type DemoDataInvariants } from './contracts';

type CountDelegate = { count(args?: unknown): Promise<number> };
type DeleteManyDelegate = { deleteMany(args?: unknown): Promise<unknown> };
type UpdateManyDelegate = { updateMany(args?: unknown): Promise<unknown> };
type UpdateDelegate = { update(args: unknown): Promise<unknown> };
type UpsertDelegate = { upsert(args: unknown): Promise<unknown> };

export interface DemoResetDb {
  payment: DeleteManyDelegate;
  orderItem: DeleteManyDelegate;
  order: DeleteManyDelegate;
  cartItem: DeleteManyDelegate;
  cart: DeleteManyDelegate & CountDelegate;
  wishlistItem: DeleteManyDelegate;
  wishlist: DeleteManyDelegate;
  subscriber: DeleteManyDelegate & CountDelegate;
  emailVerificationCode: DeleteManyDelegate;
  verificationToken: DeleteManyDelegate;
  user: UpdateManyDelegate & DeleteManyDelegate & CountDelegate;
  productVariant: UpdateDelegate & CountDelegate;
  coupon: UpsertDelegate;
  category: CountDelegate;
  product: CountDelegate;
}

export async function resetDemoData(deps: {
  db: DemoResetDb;
  env: Record<string, string | undefined>;
}): Promise<DemoDataInvariants> {
  const { db } = deps;
  assertDemoEnvironment(deps.env);

  await db.user.updateMany({
    where: { email: { in: [...PORTFOLIO_FIXTURE_EMAILS] } },
    data: { isPortfolioFixture: true },
  });

  const visitor = { user: { is: { role: 'CUSTOMER', isPortfolioFixture: false } } };
  await db.payment.deleteMany({ where: { order: { is: visitor } } });
  await db.orderItem.deleteMany({ where: { order: { is: visitor } } });
  await db.order.deleteMany({ where: visitor });
  await db.cartItem.deleteMany({});
  await db.cart.deleteMany({});
  await db.wishlistItem.deleteMany({});
  await db.wishlist.deleteMany({});
  await db.subscriber.deleteMany({});
  await db.emailVerificationCode.deleteMany({});
  await db.verificationToken.deleteMany({});
  await db.user.deleteMany({ where: { role: 'CUSTOMER', isPortfolioFixture: false } });

  for (const row of CANONICAL_INVENTORY) {
    await db.productVariant.update({ where: { sku: row.sku }, data: row });
  }

  for (const coupon of CANONICAL_COUPONS) {
    await db.coupon.upsert({ where: { code: coupon.code }, create: coupon, update: coupon });
  }

  const [categories, products, variants, fixtureUsers, visitorUsers, carts, subscribers] = await Promise.all([
    db.category.count(),
    db.product.count(),
    db.productVariant.count(),
    db.user.count({ where: { role: 'CUSTOMER', isPortfolioFixture: true } }),
    db.user.count({ where: { role: 'CUSTOMER', isPortfolioFixture: false } }),
    db.cart.count(),
    db.subscriber.count(),
  ]);

  return { categories, products, variants, fixtureUsers, visitorUsers, carts, subscribers };
}
