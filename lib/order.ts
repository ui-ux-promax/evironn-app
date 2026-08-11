import type { CartWithItems } from '@/lib/cart-details';
import { calcLineTotal } from '@/lib/cart-details';
import { normalizeSize } from '@/lib/format';
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
        imageUrl: i.sku.media[0]?.url ?? null,
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
