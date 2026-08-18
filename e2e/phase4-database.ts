import { createHash } from 'node:crypto';

import { Prisma, PrismaClient } from '@prisma/client';

import { CHECKOUT_POLICY } from '@/constants/config';
import { hashPassword } from '@/lib/password';
import { resolveE2eDatabaseEnvironment } from './database-guard';
export { phase4Namespace } from './phase4-namespace';

const E2E_PASSWORD = 'Passw0rd!1';
const E2E_EMAIL_DOMAIN = 'phase4-e2e.invalid';
let database: PrismaClient | null = null;

function getPhase4Database(): PrismaClient {
  if (database) return database;
  const databaseEnvironment = resolveE2eDatabaseEnvironment(process.env);
  database = new PrismaClient({ datasources: { db: { url: databaseEnvironment.POSTGRES_URL } } });
  return database;
}

export type Phase4CheckoutFixture = {
  namespace: string;
  email: string;
  productId: string;
  productSlug: string;
  skuId: string;
  articleNumber: string;
  unitPrice: number;
  couponCode: string;
};

export type Phase4OrderProbe = {
  id: string;
  orderNumber: number;
  status: string;
  paymentMethod: string;
  totalAmount: number;
  itemsTotal: number;
  discountAmount: number;
  shippingAmount: number;
  couponCode: string | null;
  shippingMethod: string;
  deliveryZone: string | null;
  deliveryDate: string | null;
  deliveryWindow: string | null;
  pickupPointId: string | null;
  pickupPointName: string | null;
  pickupPointAddress: string | null;
  floor: number | null;
  liftType: string | null;
  intercom: string | null;
  serviceDetails: unknown;
  serviceAmount: number;
  paymentInitializationState: string | null;
  paymentInitializationClaimedAt: string | null;
  paymentEverDispatchedAt: string | null;
  paymentId: string | null;
  paymentStatus: string | null;
  createdAt: string;
  stock: number;
  skuId: string;
};

export type Phase4BlockedPaymentFixture = Phase4CheckoutFixture & {
  orderId: string;
  orderNumber: number;
  password: string;
  neverAttemptedProof: Phase4NeverAttemptedProviderProof;
};

export type Phase4ClaimablePaymentFixture = Phase4CheckoutFixture & {
  orderId: string;
  orderNumber: number;
  password: string;
};

export type Phase4NeverAttemptedProviderProof = {
  orderId: string;
  providerRequestIssued: false;
  kind: 'NOT_CREATED_BY_CONSTRUCTION';
};

export type Phase4CleanupResult =
  | { ok: true; namespace: string; deleted: boolean; orderNumbers: readonly number[] }
  | { ok: false; namespace: string; reason: 'PROVIDER_STATE_INDETERMINATE'; orderNumbers: readonly number[] };

type CleanupOrder = {
  id: string;
  orderNumber: number;
  status: string;
  paymentMethod: string;
  totalAmount: number;
  paymentReturnUrl: string | null;
  paymentInitializationState: string | null;
  paymentInitializationClaimedAt: Date | null;
  paymentEverDispatchedAt: Date | null;
  payment: { id: string; status: string; amount: number } | null;
  items: Array<{ skuId: string | null; quantity: number; productSlug: string | null }>;
};

type ProviderReconciliationBoundary = {
  getPaymentDetails: (paymentId: string) => Promise<{
    id: string;
    status: 'pending' | 'waiting_for_capture' | 'succeeded' | 'canceled';
    amountRub: number;
    orderNumber: string;
  } | null>;
  reconcilePaymentStatus: (input: {
    paymentId: string;
    remoteStatus: string;
    source: 'webhook';
  }) => Promise<{ kind: string; transition?: string }>;
};

async function providerReconciliation(): Promise<ProviderReconciliationBoundary> {
  const [{ getPaymentDetails }, { reconcilePaymentStatus }] = await Promise.all([
    import('@/lib/yookassa'),
    import('@/lib/payment-sync'),
  ]);
  return { getPaymentDetails, reconcilePaymentStatus };
}

function assertNamespace(namespace: string): void {
  if (!/^phase4-e2e-[a-z0-9-]{8,80}$/.test(namespace)) throw new Error('Invalid Phase 4 E2E namespace');
}

export function decidePhase4Cleanup(input: {
  namespace: string;
  orderNumbers: readonly number[];
  indeterminateOrderNumbers: readonly number[];
  hasOwnedResources?: boolean;
}): Phase4CleanupResult {
  assertNamespace(input.namespace);
  const orderNumbers = [...new Set(input.orderNumbers)].sort((left, right) => left - right);
  const indeterminateOrderNumbers = [...new Set(input.indeterminateOrderNumbers)].sort((left, right) => left - right);
  if (indeterminateOrderNumbers.length) {
    return {
      ok: false,
      namespace: input.namespace,
      reason: 'PROVIDER_STATE_INDETERMINATE',
      orderNumbers: indeterminateOrderNumbers,
    };
  }
  return {
    ok: true,
    namespace: input.namespace,
    deleted: input.hasOwnedResources ?? orderNumbers.length > 0,
    orderNumbers,
  };
}

function namespaceEmail(namespace: string): string {
  assertNamespace(namespace);
  return `${namespace}@${E2E_EMAIL_DOMAIN}`;
}

function namespaceCouponCode(namespace: string): string {
  const suffix = createHash('sha256').update(namespace).digest('hex').slice(0, 12);
  return `PHASE4-${safePart(namespace).slice(0, 20)}-${suffix}`.slice(0, 40);
}

function namespaceFromEmail(email: string): string {
  const namespace = email.split('@')[0] ?? '';
  assertNamespace(namespace);
  return namespace;
}

function safePart(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 32) || 'test'
  );
}

async function canonicalTemplate() {
  const template = await getPhase4Database().product.findFirst({
    where: { active: true, skus: { some: { active: true } } },
    include: {
      skus: { where: { active: true }, orderBy: { id: 'asc' }, take: 1 },
      rooms: { take: 1 },
      optionGroups: { include: { values: { include: { optionValue: true }, take: 1 } }, take: 1 },
      media: { where: { kind: 'IMAGE' }, take: 1 },
    },
  });
  if (!template?.skus[0]) throw new Error('Canonical furniture SKU unavailable for Phase 4 fixture template');
  return template;
}

export async function createPhase4CheckoutFixture(namespace: string): Promise<Phase4CheckoutFixture> {
  assertNamespace(namespace);
  const template = await canonicalTemplate();
  const templateSku = template.skus[0];
  const templateGroup = template.optionGroups[0];
  const templateValue = templateGroup?.values[0]?.optionValue;
  const productSlug = `${namespace}-fixture-product`;
  const articleNumber = `${namespace}-sku`.slice(0, 64);
  const couponCode = namespaceCouponCode(namespace);
  const email = namespaceEmail(namespace);

  const fixture = await getPhase4Database().$transaction(
    async (transaction) => {
      const product = await transaction.product.create({
        data: {
          name: `Phase 4 fixture ${namespace}`,
          slug: productSlug,
          brand: 'Evironn',
          gender: 'UNISEX',
          categoryId: template.categoryId,
          description: 'Phase 4 E2E owned fixture',
          active: true,
          minPrice: templateSku.price,
          sortOrder: 999,
          rooms: template.rooms[0] ? { create: { roomId: template.rooms[0].roomId } } : undefined,
        },
      });

      if (templateGroup && templateValue) {
        await transaction.productOptionGroup.create({
          data: { productId: product.id, optionGroupId: templateGroup.optionGroupId },
        });
        await transaction.productOptionValue.create({
          data: {
            productId: product.id,
            optionGroupId: templateGroup.optionGroupId,
            optionValueId: templateValue.id,
          },
        });
      }

      if (template.media[0]) {
        await transaction.productMedia.create({
          data: {
            productId: product.id,
            kind: 'IMAGE',
            url: template.media[0].url,
            alt: `Phase 4 fixture ${namespace}`,
          },
        });
      }

      const sku = await transaction.sku.create({
        data: {
          productId: product.id,
          combinationKey:
            templateGroup && templateValue ? `${templateGroup.optionGroupId}:${templateValue.id}` : namespace,
          articleNumber,
          price: templateSku.price,
          oldPrice: templateSku.oldPrice,
          stock: 20,
          active: true,
          selections:
            templateGroup && templateValue
              ? { create: { optionGroupId: templateGroup.optionGroupId, optionValueId: templateValue.id } }
              : undefined,
        },
      });

      const coupon = await transaction.coupon.create({ data: { code: couponCode, percent: 10, active: true } });
      return { product, sku, coupon };
    },
    { isolationLevel: 'Serializable' },
  );

  return {
    namespace,
    email,
    productId: fixture.product.id,
    productSlug,
    skuId: fixture.sku.id,
    articleNumber: fixture.sku.articleNumber,
    unitPrice: fixture.sku.price,
    couponCode: fixture.coupon.code,
  };
}

export async function seedOwnedCartLine(email: string, skuId: string, quantity = 1): Promise<void> {
  const namespace = namespaceFromEmail(email);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) throw new Error('Invalid Phase 4 cart quantity');
  await getPhase4Database().$transaction(
    async (transaction) => {
      const user = await transaction.user.findUnique({ where: { email } });
      if (!user?.emailVerified) throw new Error('Phase 4 cart owner must be verified');
      const sku = await transaction.sku.findUnique({ where: { id: skuId }, include: { product: true } });
      if (!sku || sku.product.slug !== `${namespace}-fixture-product`)
        throw new Error('Phase 4 SKU ownership mismatch');
      const cart =
        (await transaction.cart.findFirst({ where: { userId: user.id }, select: { id: true } })) ??
        (await transaction.cart.create({
          data: { token: `${namespace}-cart`, userId: user.id },
          select: { id: true },
        }));
      const existing = await transaction.cartItem.findFirst({ where: { cartId: cart.id, skuId } });
      if (existing) {
        await transaction.cartItem.update({ where: { id: existing.id }, data: { quantity } });
      } else {
        await transaction.cartItem.create({ data: { cartId: cart.id, skuId, quantity } });
      }
      const items = await transaction.cartItem.findMany({ where: { cartId: cart.id }, include: { sku: true } });
      await transaction.cart.update({
        where: { id: cart.id },
        data: { totalAmount: items.reduce((sum, item) => sum + (item.sku?.price ?? 0) * item.quantity, 0) },
      });
    },
    { isolationLevel: 'Serializable' },
  );
}

async function findOwnedOrder(email: string, orderNumber: number) {
  const namespace = namespaceFromEmail(email);
  return getPhase4Database().order.findFirst({
    where: {
      orderNumber,
      user: { email },
      items: { some: { canonicalSku: { product: { slug: `${namespace}-fixture-product` } } } },
    },
    include: { items: { include: { canonicalSku: true } }, payment: true },
  });
}

export async function markOwnedOrderDelivered(email: string, orderNumber: number): Promise<void> {
  const order = await findOwnedOrder(email, orderNumber);
  if (!order) throw new Error('Owned Phase 4 order not found');
  await getPhase4Database().order.updateMany({
    where: { id: order.id, user: { email } },
    data: { status: 'DELIVERED' },
  });
}

export async function markOwnedOrderAsLegacySnapshot(email: string, orderNumber: number): Promise<void> {
  const order = await findOwnedOrder(email, orderNumber);
  if (!order) throw new Error('Owned Phase 4 order not found');
  await getPhase4Database().order.updateMany({
    where: { id: order.id, user: { email } },
    data: {
      deliveryZone: null,
      deliveryDate: null,
      deliveryWindow: null,
      pickupPointId: null,
      pickupPointName: null,
      pickupPointAddress: null,
      floor: null,
      liftType: null,
      intercom: null,
      serviceDetails: Prisma.DbNull,
      serviceAmount: 0,
    },
  });
}

export async function readOwnedOrder(email: string, orderNumber: number): Promise<Phase4OrderProbe> {
  const order = await findOwnedOrder(email, orderNumber);
  const item = order?.items[0];
  if (!order || !item?.canonicalSku) throw new Error('Owned Phase 4 order probe not found');
  const sku = await getPhase4Database().sku.findUnique({
    where: { id: item.canonicalSku.id },
    select: { stock: true },
  });
  if (!sku) throw new Error('Owned Phase 4 SKU probe not found');
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentMethod: order.paymentMethod,
    totalAmount: order.totalAmount,
    itemsTotal: order.itemsTotal,
    discountAmount: order.discountAmount,
    shippingAmount: order.shippingAmount,
    couponCode: order.couponCode,
    shippingMethod: order.shippingMethod,
    deliveryZone: order.deliveryZone,
    deliveryDate: order.deliveryDate?.toISOString() ?? null,
    deliveryWindow: order.deliveryWindow,
    pickupPointId: order.pickupPointId,
    pickupPointName: order.pickupPointName,
    pickupPointAddress: order.pickupPointAddress,
    floor: order.floor,
    liftType: order.liftType,
    intercom: order.intercom,
    serviceDetails: order.serviceDetails,
    serviceAmount: order.serviceAmount,
    paymentInitializationState: order.paymentInitializationState,
    paymentInitializationClaimedAt: order.paymentInitializationClaimedAt?.toISOString() ?? null,
    paymentEverDispatchedAt: order.paymentEverDispatchedAt?.toISOString() ?? null,
    paymentId: order.payment?.id ?? null,
    paymentStatus: order.payment?.status ?? null,
    createdAt: order.createdAt.toISOString(),
    stock: sku.stock,
    skuId: item.canonicalSku.id,
  };
}

export async function readLatestOwnedOrder(email: string): Promise<Phase4OrderProbe> {
  const namespace = namespaceFromEmail(email);
  const latest = await getPhase4Database().order.findFirst({
    where: {
      user: { email },
      items: { some: { canonicalSku: { product: { slug: `${namespace}-fixture-product` } } } },
    },
    orderBy: { createdAt: 'desc' },
    select: { orderNumber: true },
  });
  if (!latest) throw new Error('Latest owned Phase 4 order not found');
  return readOwnedOrder(email, latest.orderNumber);
}

export function validatePhase4ClaimablePaymentProbe(
  order: Pick<
    Phase4OrderProbe,
    | 'status'
    | 'paymentMethod'
    | 'paymentInitializationState'
    | 'paymentInitializationClaimedAt'
    | 'paymentEverDispatchedAt'
    | 'paymentId'
  >,
): boolean {
  return (
    order.status === 'PENDING' &&
    order.paymentMethod === 'online' &&
    order.paymentInitializationState === 'READY' &&
    order.paymentInitializationClaimedAt === null &&
    order.paymentEverDispatchedAt === null &&
    order.paymentId === null
  );
}

export async function createPhase4ClaimablePaymentFixture(namespace: string): Promise<Phase4ClaimablePaymentFixture> {
  const fixture = await createPhase4CheckoutFixture(namespace);
  const passwordHash = await hashPassword(E2E_PASSWORD);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, '');
  if (!siteUrl) throw new Error('NEXT_PUBLIC_SITE_URL is required for a real Phase 4 payment fixture');
  const email = fixture.email;
  const order = await getPhase4Database().$transaction(
    async (transaction) => {
      const user = await transaction.user.create({
        data: { email, passwordHash, emailVerified: new Date(), name: `Phase 4 ${namespace}` },
      });
      const sku = await transaction.sku.update({ where: { id: fixture.skuId }, data: { stock: { decrement: 1 } } });
      const created = await transaction.order.create({
        data: {
          userId: user.id,
          contactName: user.name ?? 'Phase 4 User',
          contactPhone: '+79990000000',
          contactEmail: email,
          shippingMethod: 'courier',
          city: 'Москва',
          addressLine: 'Phase 4 fixture address',
          shippingAmount: CHECKOUT_POLICY.courier.moscow,
          itemsTotal: sku.price,
          totalAmount: sku.price + CHECKOUT_POLICY.courier.moscow,
          paymentMethod: 'online',
          paymentReturnUrl: `${siteUrl}/orders/pending-${namespace}`,
          paymentInitializationState: 'READY',
          items: {
            create: {
              skuId: sku.id,
              skuArticleNumber: sku.articleNumber,
              skuCombinationKey: sku.combinationKey,
              productName: `Phase 4 fixture ${namespace}`,
              productSlug: `${namespace}-fixture-product`,
              configuration: { namespace },
              imageUrl: null,
              unitPrice: sku.price,
              oldUnitPrice: sku.oldPrice,
              quantity: 1,
              lineTotal: sku.price,
            },
          },
        },
      });
      return transaction.order.update({
        where: { id: created.id },
        data: { paymentReturnUrl: `${siteUrl}/orders/${created.orderNumber}` },
      });
    },
    { isolationLevel: 'Serializable' },
  );
  return { ...fixture, orderId: order.id, orderNumber: order.orderNumber, password: E2E_PASSWORD };
}

export async function createPhase4BlockedPaymentFixture(namespace: string): Promise<Phase4BlockedPaymentFixture> {
  const fixture = await createPhase4CheckoutFixture(namespace);
  const passwordHash = await hashPassword(E2E_PASSWORD);
  const createdAt = new Date(Date.now() - 23 * 60 * 60 * 1000 - 30 * 60 * 1000);
  const email = fixture.email;
  const order = await getPhase4Database().$transaction(
    async (transaction) => {
      const user = await transaction.user.create({
        data: { email, passwordHash, emailVerified: new Date(), name: `Phase 4 ${namespace}` },
      });
      const sku = await transaction.sku.update({ where: { id: fixture.skuId }, data: { stock: { decrement: 1 } } });
      const created = await transaction.order.create({
        data: {
          userId: user.id,
          contactName: user.name ?? 'Phase 4 User',
          contactPhone: '+79990000000',
          contactEmail: email,
          shippingMethod: 'courier',
          city: 'Москва',
          addressLine: 'Phase 4 fixture address',
          itemsTotal: sku.price,
          shippingAmount: CHECKOUT_POLICY.courier.moscow,
          totalAmount: sku.price + CHECKOUT_POLICY.courier.moscow,
          paymentMethod: 'online',
          paymentReturnUrl: `/orders/phase4-${namespace}`,
          paymentInitializationState: 'READY',
          createdAt,
          items: {
            create: {
              skuId: sku.id,
              skuArticleNumber: sku.articleNumber,
              skuCombinationKey: sku.combinationKey,
              productName: `Phase 4 fixture ${namespace}`,
              productSlug: `${namespace}-fixture-product`,
              configuration: { namespace },
              imageUrl: null,
              unitPrice: sku.price,
              oldUnitPrice: sku.oldPrice,
              quantity: 1,
              lineTotal: sku.price,
            },
          },
        },
      });
      return created;
    },
    { isolationLevel: 'Serializable' },
  );
  return {
    ...fixture,
    orderId: order.id,
    orderNumber: order.orderNumber,
    password: E2E_PASSWORD,
    neverAttemptedProof: { orderId: order.id, providerRequestIssued: false, kind: 'NOT_CREATED_BY_CONSTRUCTION' },
  };
}

export function validatePhase4NeverAttemptedProof(
  order: CleanupOrder,
  namespace: string,
  proofs: readonly Phase4NeverAttemptedProviderProof[],
): boolean {
  return (
    proofs.some(
      (proof) =>
        proof.kind === 'NOT_CREATED_BY_CONSTRUCTION' &&
        proof.providerRequestIssued === false &&
        proof.orderId === order.id,
    ) &&
    order.paymentReturnUrl === `/orders/phase4-${namespace}` &&
    order.items.length > 0 &&
    order.items.every((item) => item.productSlug === `${namespace}-fixture-product`) &&
    order.paymentMethod === 'online' &&
    order.paymentInitializationState === 'READY' &&
    order.paymentInitializationClaimedAt === null &&
    order.paymentEverDispatchedAt === null &&
    order.payment === null
  );
}

async function reconcileAttemptedOnlinePayment(order: CleanupOrder): Promise<boolean> {
  if (!order.payment) return false;
  try {
    const boundary = await providerReconciliation();
    const remote = await boundary.getPaymentDetails(order.payment.id);
    if (
      !remote ||
      remote.id !== order.payment.id ||
      remote.amountRub !== order.totalAmount ||
      remote.orderNumber !== String(order.orderNumber) ||
      (remote.status !== 'succeeded' && remote.status !== 'canceled')
    ) {
      return false;
    }
    const reconciliation = await boundary.reconcilePaymentStatus({
      paymentId: order.payment.id,
      remoteStatus: remote.status,
      source: 'webhook',
    });
    if (reconciliation.kind === 'missing') return false;
    const local = await getPhase4Database().order.findUnique({
      where: { id: order.id },
      select: {
        status: true,
        payment: { select: { id: true, status: true, amount: true } },
      },
    });
    if (!local?.payment || local.payment.id !== remote.id || local.payment.amount !== remote.amountRub) return false;
    return remote.status === 'canceled'
      ? local.payment.status === 'canceled' && local.status === 'CANCELLED'
      : local.payment.status === 'succeeded' && ['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(local.status);
  } catch {
    return false;
  }
}

export async function cleanupPhase4Namespace(
  namespace: string,
  neverAttemptedProofs: readonly Phase4NeverAttemptedProviderProof[] = [],
): Promise<Phase4CleanupResult> {
  assertNamespace(namespace);
  const email = namespaceEmail(namespace);
  const roots = await getPhase4Database().user.findMany({
    where: { email },
    select: {
      id: true,
      email: true,
      carts: { select: { id: true } },
      wishlists: { select: { id: true } },
      orders: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentMethod: true,
          paymentInitializationState: true,
          paymentInitializationClaimedAt: true,
          paymentEverDispatchedAt: true,
          totalAmount: true,
          paymentReturnUrl: true,
          payment: { select: { id: true, status: true, amount: true } },
          items: {
            select: {
              skuId: true,
              quantity: true,
              canonicalSku: { select: { product: { select: { slug: true } } } },
            },
          },
        },
      },
      addresses: { select: { id: true } },
      accounts: { select: { id: true } },
    },
  });
  const products = await getPhase4Database().product.findMany({
    where: { slug: `${namespace}-fixture-product` },
    select: { id: true, skus: { select: { id: true } } },
  });
  const coupons = await getPhase4Database().coupon.findMany({
    where: { code: namespaceCouponCode(namespace) },
    select: { id: true },
  });
  const orderNumbers = roots.flatMap((user) => user.orders.map((order) => order.orderNumber));
  const indeterminate: number[] = [];
  for (const user of roots) {
    for (const order of user.orders) {
      const cleanupOrder: CleanupOrder = {
        ...order,
        items: order.items.map((item) => ({
          skuId: item.skuId,
          quantity: item.quantity,
          productSlug: item.canonicalSku?.product.slug ?? null,
        })),
      };
      if (
        order.paymentMethod === 'online' &&
        !validatePhase4NeverAttemptedProof(cleanupOrder, namespace, neverAttemptedProofs) &&
        !(await reconcileAttemptedOnlinePayment(cleanupOrder))
      ) {
        indeterminate.push(order.orderNumber);
      }
    }
  }
  const userIds = roots.map((user) => user.id);
  const cartIds = roots.flatMap((user) => user.carts.map((cart) => cart.id));
  const wishlistIds = roots.flatMap((user) => user.wishlists.map((wishlist) => wishlist.id));
  const orderIds = roots.flatMap((user) => user.orders.map((order) => order.id));
  const addressIds = roots.flatMap((user) => user.addresses.map((address) => address.id));
  const accountIds = roots.flatMap((user) => user.accounts.map((account) => account.id));
  const productIds = products.map((product) => product.id);
  const skuIds = products.flatMap((product) => product.skus.map((sku) => sku.id));
  const couponIds = coupons.map((coupon) => coupon.id);

  const cleanupDecision = decidePhase4Cleanup({
    namespace,
    orderNumbers,
    indeterminateOrderNumbers: indeterminate,
    hasOwnedResources: Boolean(userIds.length || productIds.length || couponIds.length),
  });
  if (!cleanupDecision.ok || !cleanupDecision.deleted) return cleanupDecision;

  await getPhase4Database().$transaction(
    async (transaction) => {
      for (const user of roots) {
        for (const order of user.orders) {
          if (order.status !== 'CANCELLED') {
            for (const item of order.items) {
              if (item.skuId && skuIds.includes(item.skuId)) {
                await transaction.sku.updateMany({
                  where: { id: item.skuId },
                  data: { stock: { increment: item.quantity } },
                });
              }
            }
          }
        }
      }
      await transaction.review.deleteMany({
        where: { OR: [{ userId: { in: userIds } }, { productId: { in: productIds } }] },
      });
      await transaction.payment.deleteMany({ where: { orderId: { in: orderIds } } });
      await transaction.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
      await transaction.order.deleteMany({ where: { id: { in: orderIds }, userId: { in: userIds } } });
      await transaction.cartItem.deleteMany({ where: { cartId: { in: cartIds } } });
      await transaction.cart.deleteMany({ where: { id: { in: cartIds }, userId: { in: userIds } } });
      await transaction.wishlistItem.deleteMany({ where: { wishlistId: { in: wishlistIds } } });
      await transaction.wishlist.deleteMany({ where: { id: { in: wishlistIds }, userId: { in: userIds } } });
      await transaction.address.deleteMany({ where: { id: { in: addressIds }, userId: { in: userIds } } });
      await transaction.account.deleteMany({ where: { id: { in: accountIds }, userId: { in: userIds } } });
      await transaction.emailVerificationCode.deleteMany({ where: { email } });
      await transaction.verificationToken.deleteMany({ where: { identifier: email } });
      await transaction.skuMedia.deleteMany({ where: { skuId: { in: skuIds } } });
      await transaction.skuOptionValue.deleteMany({ where: { skuId: { in: skuIds } } });
      await transaction.productMedia.deleteMany({ where: { productId: { in: productIds } } });
      await transaction.productOptionValue.deleteMany({ where: { productId: { in: productIds } } });
      await transaction.productOptionGroup.deleteMany({ where: { productId: { in: productIds } } });
      await transaction.productRoom.deleteMany({ where: { productId: { in: productIds } } });
      await transaction.sku.deleteMany({ where: { id: { in: skuIds }, productId: { in: productIds } } });
      await transaction.product.deleteMany({ where: { id: { in: productIds }, slug: `${namespace}-fixture-product` } });
      await transaction.coupon.deleteMany({ where: { id: { in: couponIds }, code: namespaceCouponCode(namespace) } });
      await transaction.user.deleteMany({ where: { id: { in: userIds }, email } });
    },
    { isolationLevel: 'Serializable' },
  );
  return cleanupDecision;
}

export async function disconnectPhase4Database(): Promise<void> {
  if (!database) return;
  await database.$disconnect();
  database = null;
}

export function getPhase4DatabaseForTests(): PrismaClient {
  return getPhase4Database();
}
