import { prisma } from '@/lib/prisma-client';
import { formatOrderItemConfiguration } from '@/lib/order';
import { getReviewEligibility } from '@/lib/review';
import { recoverPaymentCorrelation, reconcilePaymentStatus } from '@/lib/payment-sync';
import { getPaymentDetails } from '@/lib/yookassa';
import { PAYMENT_CREATE_RETRY_WINDOW_MS } from '@/lib/payment-initialization';
import { logger } from '@/lib/logger';
import {
  buildBlockedOrderPaymentInitialization,
  type OrderPageDto,
  type OrderStage,
} from '@/services/dto/order-page.dto';

export function formatOrderDateOnly(value: string): string {
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Moscow',
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
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

export function buildOrderPageDto(order: OrderInput): OrderPageDto {
  const mapped = mapOrderStatus(order.status);
  const date = order.deliveryDate ? order.deliveryDate.toISOString().slice(0, 10) : null;
  const details = Array.isArray(order.serviceDetails)
    ? order.serviceDetails.filter((v): v is { id: string; label: string; amount: number } =>
        Boolean(v && typeof v === 'object' && 'id' in v && 'label' in v && 'amount' in v),
      )
    : [];
  const retryWindowClosed = order.createdAt.getTime() + PAYMENT_CREATE_RETRY_WINDOW_MS <= Date.now();
  const safelyCorrelated =
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
          initialization: retryWindowClosed
            ? buildBlockedOrderPaymentInitialization(order.orderNumber, safelyCorrelated)
            : order.payment?.confirmationUrl
              ? {
                  status: 'READY' as const,
                  continuePaymentUrl: order.payment.confirmationUrl,
                  canRetryCreate: false as const,
                  allowedActions: [] as const,
                }
              : {
                  status: 'PENDING' as const,
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
    contact: { name: order.contactName, phone: order.contactPhone, email: order.contactEmail },
    delivery: {
      method: order.shippingMethod === 'pickup' ? (order.pickupPointId ? 'Пункт выдачи' : 'Самовывоз') : 'Курьер',
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
      services: order.serviceAmount,
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

export async function getOrderPageDto({
  userId,
  orderNumber,
}: {
  userId: string;
  orderNumber: number;
}): Promise<OrderPageDto | null> {
  const include = {
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
  let order = await prisma.order.findFirst({ where: { userId, orderNumber }, include });
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
        const result = await reconcilePaymentStatus({
          paymentId: order.payment.id,
          remoteStatus: details.status,
          source: 'order-page',
        });
        if (result.kind === 'applied' || result.kind === 'repaired')
          order = await prisma.order.findFirst({ where: { userId, orderNumber }, include });
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
  return buildOrderPageDto({
    ...order,
    items: order.items.map((item) => ({
      ...item,
      productSlug: (item.canonicalSku?.product ?? item.productVariant?.colorway.product)?.slug ?? null,
    })),
    reviewTargets: reviewTargets.filter(Boolean) as OrderInput['reviewTargets'],
  });
}

export {
  buildBlockedOrderPaymentInitialization,
  PAYMENT_CREATE_RETRY_WINDOW_MS,
  recoverPaymentCorrelation,
  reconcilePaymentStatus,
  getPaymentDetails,
};
