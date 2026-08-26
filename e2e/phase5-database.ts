import { createHash, randomUUID } from 'node:crypto';

import { PrismaClient } from '@prisma/client';
import type { TestInfo } from '@playwright/test';

import { hashPassword } from '@/lib/password';
import { loadE2eEnvironment } from './load-env';

loadE2eEnvironment();

const E2E_PASSWORD = 'Passw0rd!1';
const E2E_EMAIL_DOMAIN = 'phase5d-e2e.invalid';
const FIXTURE_STOCK = [12, 13] as const;
let database: PrismaClient | null = null;

export type Phase5Fixture = {
  namespace: string;
  adminUserId: string;
  adminEmail: string;
  customerUserId: string;
  customerEmail: string;
  categoryId: string;
  roomId: string;
  optionGroupId: string;
  optionValueIds: readonly [string, string];
  productId: string;
  skuIds: readonly [string, string];
  cartId: string;
  couponId: string;
};

export type Phase5OrderProbe = {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  stockBySkuId: Readonly<Record<string, number>>;
  snapshotLines: readonly { productName: string; articleNumber: string; quantity: number; unitPrice: number }[];
  paymentCount: number;
  paymentInitializationState: string | null;
  paymentInitializationClaimedAt: string | null;
  paymentEverDispatchedAt: string | null;
};

export type Phase5CleanupProbe = {
  remainingOwnedRows: Readonly<Record<string, number>>;
  allZero: boolean;
};

function getPhase5Database(): PrismaClient {
  if (database) return database;
  const databaseUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
  if (!databaseUrl) throw new Error('POSTGRES_URL or POSTGRES_URL_NON_POOLING is required for Phase 5 E2E');
  database = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  return database;
}

function assertNamespace(namespace: string): void {
  if (!/^phase5d-e2e-[a-z0-9-]{8,80}$/.test(namespace)) throw new Error('Invalid Phase 5 E2E namespace');
}

function safePart(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 36) || 'test'
  );
}

export function phase5Namespace(testInfo: TestInfo): string {
  const suffix = createHash('sha256')
    .update(`${testInfo.title}:${Date.now()}:${randomUUID()}`)
    .digest('hex')
    .slice(0, 20);
  const namespace = `phase5d-e2e-${safePart(testInfo.title)}-${suffix}`.slice(0, 80);
  assertNamespace(namespace);
  return namespace;
}

function adminEmail(namespace: string): string {
  assertNamespace(namespace);
  return `${namespace}-admin@${E2E_EMAIL_DOMAIN}`;
}

function customerEmail(namespace: string): string {
  assertNamespace(namespace);
  return `${namespace}-customer@${E2E_EMAIL_DOMAIN}`;
}

function productSlug(namespace: string): string {
  assertNamespace(namespace);
  return `${namespace}-product`;
}

function couponCode(namespace: string): string {
  assertNamespace(namespace);
  return `PHASE5D-${namespace}`.toUpperCase();
}

function articleNumbers(namespace: string): readonly [string, string] {
  assertNamespace(namespace);
  return [`${namespace}-sku-a`, `${namespace}-sku-b`];
}

function assertFixtureShape(fixture: Phase5Fixture): void {
  assertNamespace(fixture.namespace);
  if (fixture.adminEmail !== adminEmail(fixture.namespace)) throw new Error('Phase 5 admin identity mismatch');
  if (fixture.customerEmail !== customerEmail(fixture.namespace)) throw new Error('Phase 5 customer identity mismatch');
  if (fixture.optionValueIds.length !== 2 || fixture.skuIds.length !== 2) {
    throw new Error('Phase 5 fixture requires two option values and two SKUs');
  }
  const ids = [
    fixture.adminUserId,
    fixture.customerUserId,
    fixture.categoryId,
    fixture.roomId,
    fixture.optionGroupId,
    ...fixture.optionValueIds,
    fixture.productId,
    ...fixture.skuIds,
    fixture.cartId,
    fixture.couponId,
  ];
  if (ids.some((id) => !id) || new Set(ids).size !== ids.length) throw new Error('Phase 5 fixture IDs must be unique');
}

export async function createPhase5Fixture(namespace: string): Promise<Phase5Fixture> {
  assertNamespace(namespace);
  const passwordHash = await hashPassword(E2E_PASSWORD);
  const articles = articleNumbers(namespace);

  const created = await getPhase5Database().$transaction(
    async (transaction) => {
      const admin = await transaction.user.create({
        data: {
          email: adminEmail(namespace),
          passwordHash,
          emailVerified: new Date(),
          name: `Phase 5 Admin ${namespace}`,
          role: 'ADMIN',
          isPortfolioFixture: true,
        },
      });
      const customer = await transaction.user.create({
        data: {
          email: customerEmail(namespace),
          passwordHash,
          emailVerified: new Date(),
          name: `Phase 5 Customer ${namespace}`,
          role: 'CUSTOMER',
          isPortfolioFixture: true,
        },
      });
      const category = await transaction.category.create({
        data: { name: `Phase 5 Category ${namespace}`, slug: `${namespace}-category`, sortOrder: 9000 },
      });
      const room = await transaction.room.create({
        data: { name: `Phase 5 Room ${namespace}`, slug: `${namespace}-room`, sortOrder: 9000 },
      });
      const optionGroup = await transaction.optionGroup.create({
        data: { name: `Phase 5 Option ${namespace}`, slug: `${namespace}-option`, sortOrder: 9000 },
      });
      const optionValueA = await transaction.optionValue.create({
        data: {
          optionGroupId: optionGroup.id,
          name: `Phase 5 Sand ${namespace}`,
          slug: `${namespace}-sand`,
          sortOrder: 0,
        },
      });
      const optionValueB = await transaction.optionValue.create({
        data: {
          optionGroupId: optionGroup.id,
          name: `Phase 5 Graphite ${namespace}`,
          slug: `${namespace}-graphite`,
          sortOrder: 1,
        },
      });
      const product = await transaction.product.create({
        data: {
          name: `Phase 5D Product ${namespace}`,
          slug: productSlug(namespace),
          brand: 'Evironn',
          gender: 'UNISEX',
          categoryId: category.id,
          description: `Owned Phase 5 furniture fixture ${namespace}`,
          active: true,
          sortOrder: 9000,
          minPrice: 45900,
          rooms: { create: { roomId: room.id } },
          optionGroups: { create: { optionGroupId: optionGroup.id } },
          optionValues: {
            create: [
              { optionGroupId: optionGroup.id, optionValueId: optionValueA.id },
              { optionGroupId: optionGroup.id, optionValueId: optionValueB.id },
            ],
          },
        },
      });
      const skuA = await transaction.sku.create({
        data: {
          productId: product.id,
          combinationKey: `${optionGroup.id}:${optionValueA.id}`,
          articleNumber: articles[0],
          price: 45900,
          oldPrice: 49900,
          stock: FIXTURE_STOCK[0],
          active: true,
          selections: { create: { optionGroupId: optionGroup.id, optionValueId: optionValueA.id } },
        },
      });
      const skuB = await transaction.sku.create({
        data: {
          productId: product.id,
          combinationKey: `${optionGroup.id}:${optionValueB.id}`,
          articleNumber: articles[1],
          price: 47900,
          oldPrice: null,
          stock: FIXTURE_STOCK[1],
          active: true,
          selections: { create: { optionGroupId: optionGroup.id, optionValueId: optionValueB.id } },
        },
      });
      const cart = await transaction.cart.create({
        data: {
          token: `${namespace}-cart`,
          userId: customer.id,
          totalAmount: skuA.price,
          items: { create: { skuId: skuA.id, quantity: 1 } },
        },
      });
      const coupon = await transaction.coupon.create({
        data: { code: couponCode(namespace), percent: 20, active: true },
      });
      return {
        admin,
        customer,
        category,
        room,
        optionGroup,
        optionValueA,
        optionValueB,
        product,
        skuA,
        skuB,
        cart,
        coupon,
      };
    },
    { isolationLevel: 'Serializable', maxWait: 10_000, timeout: 30_000 },
  );

  const fixture: Phase5Fixture = {
    namespace,
    adminUserId: created.admin.id,
    adminEmail: created.admin.email,
    customerUserId: created.customer.id,
    customerEmail: created.customer.email,
    categoryId: created.category.id,
    roomId: created.room.id,
    optionGroupId: created.optionGroup.id,
    optionValueIds: [created.optionValueA.id, created.optionValueB.id],
    productId: created.product.id,
    skuIds: [created.skuA.id, created.skuB.id],
    cartId: created.cart.id,
    couponId: created.coupon.id,
  };
  assertFixtureShape(fixture);
  return fixture;
}

async function assertFixtureOwnership(fixture: Phase5Fixture): Promise<void> {
  assertFixtureShape(fixture);
  const client = getPhase5Database();
  const [admin, customer, category, room, optionGroup, optionValues, product, skus, cart, coupon] = await Promise.all([
    client.user.findUnique({ where: { id: fixture.adminUserId }, select: { id: true, email: true, role: true } }),
    client.user.findUnique({ where: { id: fixture.customerUserId }, select: { id: true, email: true } }),
    client.category.findUnique({ where: { id: fixture.categoryId }, select: { id: true, slug: true } }),
    client.room.findUnique({ where: { id: fixture.roomId }, select: { id: true, slug: true } }),
    client.optionGroup.findUnique({ where: { id: fixture.optionGroupId }, select: { id: true, slug: true } }),
    client.optionValue.findMany({
      where: { id: { in: [...fixture.optionValueIds] } },
      select: { id: true, optionGroupId: true, slug: true },
    }),
    client.product.findUnique({ where: { id: fixture.productId }, select: { id: true, slug: true, categoryId: true } }),
    client.sku.findMany({
      where: { id: { in: [...fixture.skuIds] } },
      select: { id: true, productId: true, articleNumber: true },
    }),
    client.cart.findUnique({ where: { id: fixture.cartId }, select: { id: true, token: true, userId: true } }),
    client.coupon.findUnique({ where: { id: fixture.couponId }, select: { id: true, code: true } }),
  ]);

  if (!admin || admin.email !== fixture.adminEmail || admin.role !== 'ADMIN')
    throw new Error('Phase 5 admin ownership mismatch');
  if (!customer || customer.email !== fixture.customerEmail) throw new Error('Phase 5 customer ownership mismatch');
  if (!category || category.slug !== `${fixture.namespace}-category`)
    throw new Error('Phase 5 category ownership mismatch');
  if (!room || room.slug !== `${fixture.namespace}-room`) throw new Error('Phase 5 room ownership mismatch');
  if (!optionGroup || optionGroup.slug !== `${fixture.namespace}-option`)
    throw new Error('Phase 5 option group ownership mismatch');
  if (
    optionValues.length !== 2 ||
    optionValues.some((value) => value.optionGroupId !== fixture.optionGroupId) ||
    new Set(optionValues.map((value) => value.id)).size !== 2
  )
    throw new Error('Phase 5 option value ownership mismatch');
  if (!product || product.slug !== productSlug(fixture.namespace) || product.categoryId !== fixture.categoryId) {
    throw new Error('Phase 5 product ownership mismatch');
  }
  if (skus.length !== 2 || skus.some((sku) => sku.productId !== fixture.productId))
    throw new Error('Phase 5 SKU ownership mismatch');
  if (!cart || cart.token !== `${fixture.namespace}-cart` || cart.userId !== fixture.customerUserId) {
    throw new Error('Phase 5 cart ownership mismatch');
  }
  if (!coupon || coupon.code !== couponCode(fixture.namespace)) throw new Error('Phase 5 coupon ownership mismatch');
}

async function findOwnedOrder(namespace: string, orderId: string) {
  assertNamespace(namespace);
  const client = getPhase5Database();
  const numericOrderNumber = /^\d+$/.test(orderId) ? Number(orderId) : null;
  return numericOrderNumber !== null
    ? client.order.findUnique({
        where: { orderNumber: numericOrderNumber },
        include: { user: true, items: { include: { canonicalSku: { include: { product: true } } } }, payment: true },
      })
    : client.order.findUnique({
        where: { id: orderId },
        include: { user: true, items: { include: { canonicalSku: { include: { product: true } } } }, payment: true },
      });
}

function assertOrderOwnership(
  namespace: string,
  order: Awaited<ReturnType<typeof findOwnedOrder>>,
): asserts order is NonNullable<Awaited<ReturnType<typeof findOwnedOrder>>> {
  const articles = articleNumbers(namespace);
  if (!order || order.user.email !== customerEmail(namespace) || order.items.length === 0) {
    throw new Error('Phase 5 order ownership mismatch');
  }
  if (
    order.items.some(
      (item) =>
        item.productSlug !== productSlug(namespace) ||
        !item.canonicalSku ||
        item.canonicalSku.product.slug !== productSlug(namespace) ||
        !item.skuArticleNumber ||
        !articles.includes(item.skuArticleNumber as (typeof articles)[number]),
    )
  )
    throw new Error('Phase 5 order snapshot ownership mismatch');
}

export async function readPhase5OrderProbe(namespace: string, orderId: string): Promise<Phase5OrderProbe> {
  const order = await findOwnedOrder(namespace, orderId);
  assertOrderOwnership(namespace, order);
  const client = getPhase5Database();
  const skus = await client.sku.findMany({
    where: { product: { slug: productSlug(namespace) } },
    select: { id: true, stock: true },
  });
  const status = order.status;
  if (!['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].includes(status)) {
    throw new Error('Unexpected Phase 5 order status');
  }
  return {
    id: order.id,
    status: status as Phase5OrderProbe['status'],
    stockBySkuId: Object.fromEntries(skus.map((sku) => [sku.id, sku.stock])),
    snapshotLines: order.items.map((item) => ({
      productName: item.productName,
      articleNumber: item.skuArticleNumber as string,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
    paymentCount: await client.payment.count({ where: { orderId: order.id } }),
    paymentInitializationState: order.paymentInitializationState,
    paymentInitializationClaimedAt: order.paymentInitializationClaimedAt?.toISOString() ?? null,
    paymentEverDispatchedAt: order.paymentEverDispatchedAt?.toISOString() ?? null,
  };
}

async function ownedRows(fixture: Phase5Fixture, orderIds: readonly string[]): Promise<Record<string, number>> {
  const client = getPhase5Database();
  const userIds = [fixture.adminUserId, fixture.customerUserId];
  const productIds = [fixture.productId];
  const skuIds = [...fixture.skuIds];
  const orderIdFilter = { in: orderIds.length ? [...orderIds] : ['__no_phase5_orders__'] };
  const orderWhere = { id: orderIdFilter };
  const counts = await Promise.all([
    client.user.count({ where: { id: { in: userIds }, email: { in: [fixture.adminEmail, fixture.customerEmail] } } }),
    client.category.count({ where: { id: fixture.categoryId, slug: `${fixture.namespace}-category` } }),
    client.room.count({ where: { id: fixture.roomId, slug: `${fixture.namespace}-room` } }),
    client.optionGroup.count({ where: { id: fixture.optionGroupId, slug: `${fixture.namespace}-option` } }),
    client.optionValue.count({
      where: { id: { in: [...fixture.optionValueIds] }, optionGroupId: fixture.optionGroupId },
    }),
    client.product.count({ where: { id: fixture.productId, slug: productSlug(fixture.namespace) } }),
    client.sku.count({ where: { id: { in: skuIds }, productId: fixture.productId } }),
    client.cart.count({ where: { id: fixture.cartId, userId: fixture.customerUserId } }),
    client.coupon.count({ where: { id: fixture.couponId, code: couponCode(fixture.namespace) } }),
    client.order.count({ where: orderWhere }),
    client.orderItem.count({ where: { orderId: orderWhere.id } }),
    client.payment.count({ where: { orderId: orderWhere.id } }),
    client.cartItem.count({ where: { cartId: fixture.cartId } }),
    client.productRoom.count({ where: { productId: fixture.productId, roomId: fixture.roomId } }),
    client.productOptionGroup.count({ where: { productId: fixture.productId, optionGroupId: fixture.optionGroupId } }),
    client.productOptionValue.count({
      where: {
        productId: fixture.productId,
        optionGroupId: fixture.optionGroupId,
        optionValueId: { in: [...fixture.optionValueIds] },
      },
    }),
    client.skuOptionValue.count({
      where: {
        skuId: { in: skuIds },
        optionGroupId: fixture.optionGroupId,
        optionValueId: { in: [...fixture.optionValueIds] },
      },
    }),
    client.productMedia.count({ where: { productId: { in: productIds } } }),
    client.skuMedia.count({ where: { skuId: { in: skuIds } } }),
    client.review.count({ where: { OR: [{ userId: { in: userIds } }, { productId: { in: productIds } }] } }),
    client.address.count({ where: { userId: { in: userIds } } }),
    client.account.count({ where: { userId: { in: userIds } } }),
    client.wishlist.count({ where: { userId: { in: userIds } } }),
    client.wishlistItem.count({ where: { productId: { in: productIds } } }),
    client.emailVerificationCode.count({ where: { email: { in: [fixture.adminEmail, fixture.customerEmail] } } }),
    client.verificationToken.count({ where: { identifier: { in: [fixture.adminEmail, fixture.customerEmail] } } }),
  ]);
  return Object.fromEntries(
    [
      'users',
      'categories',
      'rooms',
      'optionGroups',
      'optionValues',
      'products',
      'skus',
      'carts',
      'coupons',
      'orders',
      'orderItems',
      'payments',
      'cartItems',
      'productRooms',
      'productOptionGroups',
      'productOptionValues',
      'skuOptionValues',
      'productMedia',
      'skuMedia',
      'reviews',
      'addresses',
      'accounts',
      'wishlists',
      'wishlistItems',
      'emailVerificationCodes',
      'verificationTokens',
    ].map((key, index) => [key, counts[index]]),
  );
}

export async function cleanupPhase5Fixture(
  fixture: Phase5Fixture,
  ownedOrderIds: readonly string[],
): Promise<Phase5CleanupProbe> {
  await assertFixtureOwnership(fixture);
  const orderIds = [...new Set(ownedOrderIds)];
  if (orderIds.some((orderId) => !orderId)) throw new Error('Phase 5 cleanup requires non-empty owned order IDs');
  const client = getPhase5Database();
  const orders = orderIds.length
    ? await client.order.findMany({
        where: { id: { in: orderIds } },
        select: {
          id: true,
          userId: true,
          status: true,
          items: { select: { skuId: true, quantity: true, canonicalSku: { select: { productId: true } } } },
        },
      })
    : [];
  if (
    orders.length !== orderIds.length ||
    orders.some(
      (order) =>
        order.userId !== fixture.customerUserId ||
        order.items.length === 0 ||
        order.items.some(
          (item) =>
            !item.skuId ||
            !fixture.skuIds.includes(item.skuId as (typeof fixture.skuIds)[number]) ||
            item.canonicalSku?.productId !== fixture.productId,
        ),
    )
  )
    throw new Error('Phase 5 cleanup rejected an order not owned by the fixture');

  await client.$transaction(
    async (transaction) => {
      for (const order of orders) {
        if (order.status !== 'CANCELLED') {
          for (const item of order.items) {
            if (item.skuId) {
              await transaction.sku.update({
                where: { id: item.skuId },
                data: { stock: { increment: item.quantity } },
              });
            }
          }
        }
      }
      const userIds = [fixture.adminUserId, fixture.customerUserId];
      const addresses = await transaction.address.findMany({
        where: { userId: { in: userIds } },
        select: { id: true },
      });
      const accounts = await transaction.account.findMany({ where: { userId: { in: userIds } }, select: { id: true } });
      const wishlists = await transaction.wishlist.findMany({
        where: { userId: { in: userIds } },
        select: { id: true },
      });
      const wishlistIds = wishlists.map((wishlist) => wishlist.id);

      await transaction.review.deleteMany({
        where: { OR: [{ userId: { in: userIds } }, { productId: fixture.productId }] },
      });
      await transaction.payment.deleteMany({ where: { orderId: { in: orderIds } } });
      await transaction.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
      await transaction.order.deleteMany({ where: { id: { in: orderIds }, userId: fixture.customerUserId } });
      await transaction.cartItem.deleteMany({ where: { cartId: fixture.cartId } });
      await transaction.cart.deleteMany({ where: { id: fixture.cartId, userId: fixture.customerUserId } });
      await transaction.wishlistItem.deleteMany({ where: { wishlistId: { in: wishlistIds } } });
      await transaction.wishlistItem.deleteMany({ where: { productId: fixture.productId } });
      await transaction.wishlist.deleteMany({ where: { id: { in: wishlistIds }, userId: { in: userIds } } });
      await transaction.address.deleteMany({ where: { id: { in: addresses.map((address) => address.id) } } });
      await transaction.account.deleteMany({ where: { id: { in: accounts.map((account) => account.id) } } });
      await transaction.emailVerificationCode.deleteMany({
        where: { email: { in: [fixture.adminEmail, fixture.customerEmail] } },
      });
      await transaction.verificationToken.deleteMany({
        where: { identifier: { in: [fixture.adminEmail, fixture.customerEmail] } },
      });
      await transaction.skuMedia.deleteMany({ where: { skuId: { in: [...fixture.skuIds] } } });
      await transaction.skuOptionValue.deleteMany({ where: { skuId: { in: [...fixture.skuIds] } } });
      await transaction.productMedia.deleteMany({ where: { productId: fixture.productId } });
      await transaction.productOptionValue.deleteMany({
        where: { productId: fixture.productId, optionGroupId: fixture.optionGroupId },
      });
      await transaction.productOptionGroup.deleteMany({
        where: { productId: fixture.productId, optionGroupId: fixture.optionGroupId },
      });
      await transaction.productRoom.deleteMany({ where: { productId: fixture.productId, roomId: fixture.roomId } });
      await transaction.sku.deleteMany({ where: { id: { in: [...fixture.skuIds] }, productId: fixture.productId } });
      await transaction.product.deleteMany({ where: { id: fixture.productId, slug: productSlug(fixture.namespace) } });
      await transaction.coupon.deleteMany({ where: { id: fixture.couponId, code: couponCode(fixture.namespace) } });
      await transaction.optionValue.deleteMany({
        where: { id: { in: [...fixture.optionValueIds] }, optionGroupId: fixture.optionGroupId },
      });
      await transaction.optionGroup.deleteMany({
        where: { id: fixture.optionGroupId, slug: `${fixture.namespace}-option` },
      });
      await transaction.room.deleteMany({ where: { id: fixture.roomId, slug: `${fixture.namespace}-room` } });
      await transaction.category.deleteMany({
        where: { id: fixture.categoryId, slug: `${fixture.namespace}-category` },
      });
      await transaction.user.deleteMany({
        where: { id: { in: userIds }, email: { in: [fixture.adminEmail, fixture.customerEmail] } },
      });
    },
    { isolationLevel: 'Serializable', maxWait: 10_000, timeout: 30_000 },
  );

  const remainingOwnedRows = await ownedRows(fixture, orderIds);
  return { remainingOwnedRows, allZero: Object.values(remainingOwnedRows).every((count) => count === 0) };
}

export async function disconnectPhase5Database(): Promise<void> {
  if (!database) return;
  await database.$disconnect();
  database = null;
}
