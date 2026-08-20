import type { CartWithItems } from '@/lib/cart-details';
import { calcLineTotal } from '@/lib/cart-details';
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FLAT } from '@/constants/config';

export type ShippingMethod = 'courier' | 'pickup';

export function calcShipping(itemsTotal: number, method: ShippingMethod): number {
  if (method === 'pickup') return 0;
  return itemsTotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
}

export interface OrderItemSnapshot {
  skuId?: string;
  skuArticleNumber?: string;
  skuCombinationKey?: string;
  productVariantId?: string;
  sku?: string;
  productName: string;
  productSlug?: string;
  configuration?: Array<{ groupSlug: string; groupName: string; valueSlug: string; valueName: string }>;
  colorwayName?: string;
  size?: string;
  imageUrl: string | null;
  unitPrice: number;
  oldUnitPrice?: number | null;
  quantity: number;
  lineTotal: number;
}

export interface OrderSnapshot {
  items: OrderItemSnapshot[];
  itemsTotal: number;
}

export function serializeServiceDetails(
  lines: ReadonlyArray<{ id: string; label: string; amount: number }>,
): Array<{ id: string; label: string; amount: number }> {
  return lines.map(({ id, label, amount }) => ({ id, label, amount }));
}

export function resolveDeliverySnapshot(input: {
  method: 'courier' | 'showroom' | 'pickup-point';
  zone: 'moscow' | 'moscow-region' | null;
  slot: { date: string; windowLabel: string };
  pickupPoint: { id: string; name: string; address: string } | null;
}) {
  return {
    shippingMethod: input.method === 'courier' ? 'courier' : 'pickup',
    deliveryZone: input.zone,
    deliveryDate: new Date(`${input.slot.date}T00:00:00.000Z`),
    deliveryWindow: input.slot.windowLabel,
    pickupPointId: input.pickupPoint?.id ?? null,
    pickupPointName: input.pickupPoint?.name ?? null,
    pickupPointAddress: input.pickupPoint?.address ?? null,
  };
}

export interface SerializableTransactionClient<TTransaction = unknown> {
  $transaction<T>(
    operation: (transaction: TTransaction) => Promise<T>,
    options: { isolationLevel: 'Serializable' },
  ): Promise<T>;
}

export class OrderTransactionConflictError extends Error {
  readonly code = 'ORDER_TRANSACTION_CONFLICT';

  constructor() {
    super('Заказ не оформлен из-за одновременного изменения корзины. Повторите попытку.');
  }
}

function isSerializableConflict(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === 'P2034');
}

export async function runSerializableOrderTransaction<TTransaction, TResult>(
  client: SerializableTransactionClient<TTransaction>,
  operation: (transaction: TTransaction) => Promise<TResult>,
): Promise<TResult> {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await client.$transaction(operation, { isolationLevel: 'Serializable' });
    } catch (error) {
      if (!isSerializableConflict(error)) throw error;
      if (attempt === 3) throw new OrderTransactionConflictError();
    }
  }
  throw new OrderTransactionConflictError();
}

export function formatOrderItemConfiguration(item: {
  configuration?: unknown;
  colorwayName?: string | null;
  size?: string | null;
}): string {
  if (Array.isArray(item.configuration)) {
    const labels = item.configuration.flatMap((entry) => {
      if (!entry || typeof entry !== 'object') return [];
      const groupName = 'groupName' in entry ? entry.groupName : null;
      const valueName = 'valueName' in entry ? entry.valueName : null;
      return typeof groupName === 'string' && typeof valueName === 'string' ? [`${groupName}: ${valueName}`] : [];
    });
    if (labels.length > 0) return labels.join(' · ');
  }

  return [item.colorwayName, item.size ? `Размер ${item.size}` : null].filter(Boolean).join(' · ') || 'Конфигурация';
}

export function buildOrderSnapshot(cart: CartWithItems): OrderSnapshot {
  const items: OrderItemSnapshot[] = cart.items.map((i) => {
    if (i.sku) {
      const configuration = i.sku.selections.map((selection) => ({
        groupSlug: selection.optionGroup.slug,
        groupName: selection.optionGroup.name,
        valueSlug: selection.optionValue.slug,
        valueName: selection.optionValue.name,
      }));
      return {
        skuId: i.sku.id,
        skuArticleNumber: i.sku.articleNumber,
        skuCombinationKey: i.sku.combinationKey,
        productName: i.sku.product.name,
        productSlug: i.sku.product.slug,
        configuration,
        imageUrl:
          i.sku.media[0]?.url ??
          (i.sku.product as typeof i.sku.product & { media?: Array<{ url: string }> }).media?.[0]?.url ??
          null,
        unitPrice: i.sku.price,
        oldUnitPrice: i.sku.oldPrice,
        quantity: i.quantity,
        lineTotal: calcLineTotal(i.sku.price, i.quantity),
      };
    }
    const v = i.productVariant;
    if (!v) throw new Error('Cart item is missing legacy product variant');
    const unitPrice = v.price;
    return {
      productVariantId: v.id,
      sku: v.sku,
      productName: v.colorway.product.name,
      colorwayName: v.colorway.name,
      size: v.size,
      imageUrl: v.colorway.images[0]?.url ?? null,
      unitPrice,
      quantity: i.quantity,
      lineTotal: calcLineTotal(unitPrice, i.quantity),
    };
  });
  const itemsTotal = items.reduce((acc, it) => acc + it.lineTotal, 0);
  return { items, itemsTotal };
}

export const ORDER_STATUS_META: Record<
  'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED',
  { label: string; badge: string }
> = {
  PENDING: { label: 'Оформлен', badge: 'badge badge-info' },
  PROCESSING: { label: 'Обрабатывается', badge: 'badge badge-warning' },
  SHIPPED: { label: 'В пути', badge: 'badge badge-info' },
  DELIVERED: { label: 'Доставлен', badge: 'badge badge-success' },
  CANCELLED: { label: 'Отменён', badge: 'badge badge-danger' },
};

// Онлайн-заказ ждёт оплаты (PENDING + платёж pending) — показываем «Ожидает оплаты»,
// а не «Оформлен» (последнее путает с реально оформленным COD-заказом).
export function orderStatusView(
  status: keyof typeof ORDER_STATUS_META,
  paymentStatus?: string | null,
): { label: string; badge: string } {
  if (status === 'PENDING' && paymentStatus === 'pending') {
    return { label: 'Ожидает оплаты', badge: 'badge badge-warning' };
  }
  return ORDER_STATUS_META[status];
}
