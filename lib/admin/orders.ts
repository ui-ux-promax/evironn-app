import type { OrderStatus, PaymentInitializationState, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma-client';
import { buildPaginationMeta, parsePaginationParams } from '@/lib/admin/pagination';
import { formatOrderItemConfiguration } from '@/lib/order';
import { canAdminCancel, nextOrderStatus, ORDER_STATUS_VALUES, type AdminCancelBlockReason } from '@/lib/order-admin';

export type AdminOrderListInput = {
  page: number;
  limit: number;
  query: string;
  status?: OrderStatus;
  payment?: 'none' | 'pending' | 'waiting_for_capture' | 'succeeded' | 'canceled';
};

export type AdminOrderRow = {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  paymentStatus: string | null;
  paymentMethod: string;
  contactName: string;
  contactEmail: string;
  itemCount: number;
  totalAmount: number;
  coverImage: string | null;
  createdAt: Date;
};

export type AdminOrderListResult = {
  rows: AdminOrderRow[];
  total: number;
  pagination: { page: number; limit: number; totalPages: number; hasPrevious: boolean; hasNext: boolean };
  statusCounts: Record<OrderStatus, number>;
  filteredRevenue: number;
};

export type AdminOrderItemSnapshot = {
  id: string;
  articleNumber: string | null;
  combinationLabel: string;
  productName: string;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type AdminOrderDetail = {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  createdAt: Date;
  contact: { name: string; email: string; phone: string };
  delivery: { method: string; address: string; date: Date | null; window: string | null };
  totals: { items: number; discount: number; shipping: number; services: number; total: number };
  items: AdminOrderItemSnapshot[];
  payment: {
    method: string;
    status: string | null;
    initializationState: PaymentInitializationState | null;
    claimEvidencePresent: boolean;
    dispatchEvidencePresent: boolean;
  };
  nextStatus: OrderStatus | null;
  cancelDecision: { ok: true } | { ok: false; reason: AdminCancelBlockReason };
};

const adminOrderSelect = {
  id: true,
  orderNumber: true,
  status: true,
  totalAmount: true,
  paymentMethod: true,
  contactName: true,
  contactEmail: true,
  createdAt: true,
  payment: { select: { status: true } },
  items: { select: { imageUrl: true, quantity: true } },
} satisfies Prisma.OrderSelect;

const adminOrderDetailSelect = {
  id: true,
  orderNumber: true,
  status: true,
  createdAt: true,
  contactName: true,
  contactEmail: true,
  contactPhone: true,
  shippingMethod: true,
  city: true,
  addressLine: true,
  deliveryDate: true,
  deliveryWindow: true,
  itemsTotal: true,
  discountAmount: true,
  shippingAmount: true,
  serviceAmount: true,
  totalAmount: true,
  paymentMethod: true,
  paymentInitializationState: true,
  paymentInitializationClaimedAt: true,
  paymentEverDispatchedAt: true,
  payment: { select: { status: true } },
  items: {
    select: {
      id: true,
      skuArticleNumber: true,
      productName: true,
      imageUrl: true,
      configuration: true,
      sku: true,
      colorwayName: true,
      size: true,
      unitPrice: true,
      quantity: true,
      lineTotal: true,
    },
  },
} satisfies Prisma.OrderSelect;

export const SHIPPING_METHOD_LABEL: Record<string, string> = { courier: 'Курьер', pickup: 'Самовывоз' };
const PAYMENT_METHOD_LABEL: Record<string, string> = { online: 'Онлайн', cod: 'При получении' };

export function shippingMethodView(method?: string | null): string {
  return SHIPPING_METHOD_LABEL[method ?? ''] ?? method ?? '—';
}

function buildSearchWhere(query: string): Prisma.OrderWhereInput {
  if (!query) return {};

  const orderNumber = /^\d+$/.test(query) ? Number(query) : undefined;
  if (orderNumber !== undefined && Number.isSafeInteger(orderNumber) && orderNumber <= 2_147_483_647) {
    return { OR: [{ orderNumber }] };
  }

  return {
    OR: [
      { contactName: { contains: query, mode: 'insensitive' } },
      { contactPhone: { contains: query, mode: 'insensitive' } },
      { contactEmail: { contains: query, mode: 'insensitive' } },
    ],
  };
}

function buildOrderWhere(input: AdminOrderListInput): Prisma.OrderWhereInput {
  const searchWhere = buildSearchWhere(input.query.trim());
  return {
    ...(input.status ? { status: input.status } : {}),
    ...(input.payment === 'none'
      ? { payment: { is: null } }
      : input.payment
        ? { payment: { is: { status: input.payment } } }
        : {}),
    ...searchWhere,
  };
}

function createStatusCounts(groups: Array<{ status: OrderStatus; _count: { _all: number } }>) {
  const counts = Object.fromEntries(ORDER_STATUS_VALUES.map((status) => [status, 0])) as Record<OrderStatus, number>;
  for (const group of groups) counts[group.status] = group._count._all;
  return counts;
}

export async function listAdminOrders(input: AdminOrderListInput): Promise<AdminOrderListResult> {
  const { page, limit, skip } = parsePaginationParams(
    { page: input.page.toString(), limit: input.limit.toString() },
    { limit: 10 },
  );
  const where = buildOrderWhere(input);

  const [total, orders, statusGroups, revenueAgg] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip,
      take: limit,
      select: adminOrderSelect,
    }),
    prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.order.aggregate({ _sum: { totalAmount: true }, where }),
  ]);

  const meta = buildPaginationMeta({ page, limit }, total);
  return {
    rows: orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.payment?.status ?? null,
      paymentMethod: order.paymentMethod,
      contactName: order.contactName,
      contactEmail: order.contactEmail,
      itemCount: order.items.reduce((count, item) => count + item.quantity, 0),
      totalAmount: order.totalAmount,
      coverImage: order.items.find((item) => item.imageUrl)?.imageUrl ?? null,
      createdAt: order.createdAt,
    })),
    total,
    pagination: {
      page: meta.page,
      limit: meta.limit,
      totalPages: meta.totalPages,
      hasPrevious: meta.page > 1,
      hasNext: meta.page < meta.totalPages,
    },
    statusCounts: createStatusCounts(statusGroups),
    filteredRevenue: revenueAgg._sum.totalAmount ?? 0,
  };
}

export async function getAdminOrderDetail(orderId: string): Promise<AdminOrderDetail | null> {
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: adminOrderDetailSelect });
  if (!order) return null;

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    createdAt: order.createdAt,
    contact: { name: order.contactName, email: order.contactEmail, phone: order.contactPhone },
    delivery: {
      method: SHIPPING_METHOD_LABEL[order.shippingMethod] ?? order.shippingMethod,
      address: [order.city, order.addressLine].filter(Boolean).join(', '),
      date: order.deliveryDate,
      window: order.deliveryWindow,
    },
    totals: {
      items: order.itemsTotal,
      discount: order.discountAmount,
      shipping: order.shippingAmount,
      services: order.serviceAmount,
      total: order.totalAmount,
    },
    items: order.items.map((item) => ({
      id: item.id,
      articleNumber: item.skuArticleNumber,
      combinationLabel: formatOrderItemConfiguration(item),
      productName: item.productName,
      imageUrl: item.imageUrl,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
    })),
    payment: {
      method: PAYMENT_METHOD_LABEL[order.paymentMethod] ?? order.paymentMethod,
      status: order.payment?.status ?? null,
      initializationState: order.paymentInitializationState,
      claimEvidencePresent: order.paymentInitializationClaimedAt !== null,
      dispatchEvidencePresent: order.paymentEverDispatchedAt !== null,
    },
    nextStatus: nextOrderStatus(order.status),
    cancelDecision: canAdminCancel({
      status: order.status,
      paymentInitializationState: order.paymentInitializationState,
      paymentInitializationClaimedAt: order.paymentInitializationClaimedAt,
      paymentEverDispatchedAt: order.paymentEverDispatchedAt,
      payment: order.payment,
    }),
  };
}
