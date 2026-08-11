type ProfileOrderPaymentInput = {
  orderNumber: number;
  status: string;
  paymentMethod: string;
  paymentStatus?: string | null;
};

export function getOrderDetailHref(orderNumber: number): string {
  return `/orders/${orderNumber}`;
}

export function getProfileOrderPaymentHref(order: ProfileOrderPaymentInput): string | null {
  if (order.status !== 'PENDING') return null;
  if (order.paymentMethod !== 'online') return null;
  if (order.paymentStatus !== 'pending') return null;
  return getOrderDetailHref(order.orderNumber);
}
