import { CHECKOUT_POLICY } from '@/constants/config';
import { fromDeliveryDateSentinel } from '@/lib/checkout-domain';
import { prisma } from '@/lib/prisma-client';
import { formatOrderItemConfiguration } from '@/lib/order';
import { getReviewEligibility } from '@/lib/review';
import { reconcilePaymentStatus } from '@/lib/payment-sync';
import { getPaymentDetails } from '@/lib/yookassa';
import {
  ensureOnlinePayment,
  PAYMENT_CREATE_RETRY_WINDOW_MS,
  type PaymentInitializationClient,
  type PaymentInitializationResult,
} from '@/lib/payment-initialization';
import { logger } from '@/lib/logger';
import {
  buildBlockedOrderPaymentInitialization,
  type OrderPageDto,
  type OrderStage,
} from '@/services/dto/order-page.dto';

export function formatOrderDateOnly(value: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: CHECKOUT_POLICY.timezone,
  }).format(new Date(`${value}T12:00:00.000Z`));
}

export function formatOrderCreatedAt(value: Date): string {
  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'long',
    timeZone: CHECKOUT_POLICY.timezone,
  }).format(value);
}

export function mapOrderStatus(status: string): { stage: OrderStage; label: string } {
  const map: Record<string, { stage: OrderStage; label: string }> = {
    PENDING: { stage: 'placed', label: 'Оформлен' },
    PROCESSING: { stage: 'collecting', label: 'Собирается' },
    SHIPPED: { stage: 'on-way', label: 'В пути' },
    DELIVERED: { stage: 'delivered', label: 'Доставлен' },
    CANCELLED: { stage: 'cancelled', label: 'Отменён' },
  };
  return map[status] ?? map.PENDING;
}

type OrderInput = {
  id: string;
  orderNumber: number;
  status: string;
  paymentMethod: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  city: string;
  addressLine: string;
  addressComment: string | null;
  shippingMethod: string;
  deliveryDate: Date | null;
  deliveryWindow: string | null;
  pickupPointId: string | null;
  pickupPointName: string | null;
  pickupPointAddress: string | null;
  deliveryZone: string | null;
  floor: number | null;
  liftType: string | null;
  intercom?: string | null;
  serviceDetails: unknown;
  itemsTotal: number;
  discountAmount: number;
  shippingAmount: number;
  serviceAmount: number;
  totalAmount: number;
  couponCode: string | null;
  paymentReturnUrl: string | null;
  createdAt: Date;
  payment: { id: string; status: string; confirmationUrl: string | null; amount: number; paidAt: Date | null } | null;
  paymentInitializationState?: string | null;
  paymentEverDispatchedAt?: Date | null;
  items: Array<{
    id: string;
    productName: string;
    productSlug: string | null;
    imageUrl: string | null;
    configuration: unknown;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }>;
  reviewTargets: Array<{ productId: string; name: string; slug: string | null; reviewed: boolean; eligible: boolean }>;
};

type BuildContext = {
  now: Date;
  providerProof?: boolean;
  paymentInitializationOutcome?: PaymentInitializationResult['outcome'];
};

function pickupMethod(order: OrderInput): string {
  if (order.shippingMethod !== 'pickup') return 'Курьер';
  if (!order.pickupPointId) return 'Самовывоз';
  const point = CHECKOUT_POLICY.pickupPoints.find((candidate) => candidate.id === order.pickupPointId);
  if (point?.kind === 'showroom' && point.name === order.pickupPointName && point.address === order.pickupPointAddress)
    return 'Самовывоз из шоурума';
  return 'Пункт выдачи';
}

export function buildOrderPageDto(
  order: OrderInput,
  { now, providerProof = false, paymentInitializationOutcome }: BuildContext = { now: new Date() },
): OrderPageDto {
  const mapped = mapOrderStatus(order.status);
  const date = order.deliveryDate ? fromDeliveryDateSentinel(order.deliveryDate) : null;
  const validServiceDetails =
    Array.isArray(order.serviceDetails) &&
    order.serviceDetails.every(
      (value) =>
        Boolean(value && typeof value === 'object') &&
        typeof (value as { id?: unknown }).id === 'string' &&
        typeof (value as { label?: unknown }).label === 'string' &&
        typeof (value as { amount?: unknown }).amount === 'number' &&
        Number.isFinite((value as { amount: number }).amount),
    );
  const details = validServiceDetails
    ? (order.serviceDetails as Array<{ id: string; label: string; amount: number }>)
    : [];
  const paymentFinal = order.payment?.status === 'succeeded' || order.payment?.status === 'canceled';
  const pendingOnline = order.status === 'PENDING' && order.paymentMethod === 'online' && !paymentFinal;
  const retryWindowClosed =
    order.createdAt.getTime() + PAYMENT_CREATE_RETRY_WINDOW_MS <= now.getTime() ||
    paymentInitializationOutcome === 'BLOCKED_AFTER_RETRY_WINDOW';
  const safelyCorrelated =
    providerProof &&
    order.payment?.status === 'pending' &&
    order.payment.amount === order.totalAmount &&
    order.paymentInitializationState === 'CORRELATED';
  const payment =
    order.paymentMethod === 'cod'
      ? { kind: 'cod' as const, label: 'Оплата при получении', initialization: null }
      : {
          kind: 'online' as const,
          status: (order.payment?.status === 'succeeded' || order.payment?.status === 'canceled'
            ? order.payment.status
            : 'pending') as 'pending' | 'succeeded' | 'canceled',
          label:
            order.payment?.status === 'succeeded'
              ? 'Оплата прошла'
              : order.payment?.status === 'canceled'
                ? 'Оплата отменена'
                : 'Ожидает оплаты',
          confirmationUrl: order.payment?.confirmationUrl ?? null,
          initialization: !pendingOnline
            ? null
            : retryWindowClosed
              ? buildBlockedOrderPaymentInitialization(order.orderNumber, safelyCorrelated)
              : safelyCorrelated && order.payment?.confirmationUrl
                ? {
                    status: 'PAYMENT_INITIALIZATION_READY' as const,
                    continuePaymentUrl: order.payment.confirmationUrl,
                    canRetryCreate: false as const,
                    allowedActions: [] as const,
                  }
                : {
                    status: 'PAYMENT_INITIALIZATION_PENDING' as const,
                    continuePaymentUrl: null,
                    canRetryCreate: false as const,
                    allowedActions: ['RESYNC_PAYMENT'] as const,
                  },
        };
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    stage: mapped.stage,
    statusLabel: mapped.label,
    createdAt: order.createdAt.toISOString(),
    createdAtLabel: formatOrderCreatedAt(order.createdAt),
    contact: { name: order.contactName, phone: order.contactPhone, email: order.contactEmail },
    delivery: {
      method: pickupMethod(order),
      address: [order.city, order.addressLine].filter(Boolean).join(', '),
      date,
      dateLabel: date ? formatOrderDateOnly(date) : null,
      window: order.deliveryWindow ?? 'Срок согласует менеджер',
      comment: order.addressComment,
      city: order.city,
      pickupPoint: order.pickupPointName ?? order.pickupPointAddress,
      floor: order.floor,
      liftType: order.liftType,
    },
    items: order.items.map((item) => ({
      id: item.id,
      name: item.productName,
      href: item.productSlug ? `/product/${item.productSlug}` : '/catalog',
      imageUrl: item.imageUrl,
      configuration: formatOrderItemConfiguration(item),
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
    })),
    totals: {
      itemsSubtotal: order.itemsTotal,
      discount: order.discountAmount,
      delivery: order.shippingAmount,
      services: validServiceDetails ? order.serviceAmount : 0,
      total: order.totalAmount,
      couponCode: order.couponCode,
      serviceLines: details,
    },
    payment,
    reviewTargets: order.reviewTargets.map((target) => ({
      productId: target.productId,
      name: target.name,
      href: target.slug ? `/product/${target.slug}` : '/catalog',
      eligible: target.eligible,
      reviewed: target.reviewed,
    })),
    canCancel: order.status === 'PENDING' && (order.paymentMethod === 'cod' || safelyCorrelated),
  };
}

const orderInclude = {
  items: {
    include: {
      canonicalSku: { select: { product: { select: { id: true, slug: true, name: true } } } },
      productVariant: {
        select: { colorway: { select: { product: { select: { id: true, slug: true, name: true } } } } },
      },
    },
  },
  payment: true,
} as const;

export async function getOrderPageDto({
  userId,
  orderNumber,
  now = new Date(),
  clock = () => new Date(),
}: {
  userId: string;
  orderNumber: number;
  now?: Date;
  clock?: () => Date;
}): Promise<OrderPageDto | null> {
  let order = await prisma.order.findFirst({ where: { userId, orderNumber }, include: orderInclude });
  if (!order) return null;
  let providerProof = false;
  let paymentInitializationOutcome: PaymentInitializationResult['outcome'] | undefined;
  if (
    order.status === 'PENDING' &&
    order.paymentMethod === 'online' &&
    !order.payment &&
    now.getTime() < order.createdAt.getTime() + PAYMENT_CREATE_RETRY_WINDOW_MS
  ) {
    try {
      paymentInitializationOutcome = (
        await ensureOnlinePayment({
          orderId: order.id,
          now,
          clock,
          client: prisma as unknown as PaymentInitializationClient,
        })
      ).outcome;
      order = await prisma.order.findFirst({ where: { userId, orderNumber }, include: orderInclude });
    } catch (error) {
      logger.error('order_page_payment_initialization_failed', error, { orderNumber });
    }
  }
  if (!order) return null;
  if (order.status === 'PENDING' && order.paymentMethod === 'online' && order.payment?.id) {
    try {
      const details = await getPaymentDetails(order.payment.id);
      if (
        details &&
        details.id === order.payment.id &&
        details.amountRub === order.totalAmount &&
        details.orderNumber === String(order.orderNumber)
      ) {
        providerProof = details.status === 'pending';
        const result = await reconcilePaymentStatus({
          paymentId: order.payment.id,
          remoteStatus: details.status,
          source: 'order-page',
        });
        if (result.kind === 'applied' || result.kind === 'repaired')
          order = await prisma.order.findFirst({ where: { userId, orderNumber }, include: orderInclude });
      }
    } catch (error) {
      logger.error('order_page_payment_reconciliation_failed', error, { orderNumber });
    }
  }
  if (!order) return null;
  const products = [
    ...new Map(
      order.items.flatMap((item) => {
        const product = item.canonicalSku?.product ?? item.productVariant?.colorway.product;
        return product ? [[product.id, product] as const] : [];
      }),
    ).values(),
  ];
  const reviewTargets = await Promise.all(
    products.map(async (product) => {
      const eligibility = await getReviewEligibility(userId, product.id);
      return {
        productId: product.id,
        name: product.name,
        slug: product.slug,
        eligible: eligibility === 'eligible',
        reviewed: eligibility === 'already-reviewed',
      };
    }),
  );
  return buildOrderPageDto(
    {
      ...order,
      items: order.items.map((item) => ({
        ...item,
        productSlug: (item.canonicalSku?.product ?? item.productVariant?.colorway.product)?.slug ?? null,
      })),
      reviewTargets: reviewTargets.filter(Boolean) as OrderInput['reviewTargets'],
    },
    { now, providerProof, paymentInitializationOutcome },
  );
}

export {
  buildBlockedOrderPaymentInitialization,
  PAYMENT_CREATE_RETRY_WINDOW_MS,
  reconcilePaymentStatus,
  getPaymentDetails,
};
