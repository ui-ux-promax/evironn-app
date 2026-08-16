import { CHECKOUT_POLICY } from '@/constants/config';
import type { CheckoutQuoteInput } from '@/services/dto/checkout.dto';

export type DeliverySlot = { id: string; date: string; windowId: string; windowLabel: string };
export function moscowDateOnly(now: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: CHECKOUT_POLICY.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}
export function toDeliveryDateSentinel(dateOnly: string): Date {
  return new Date(`${dateOnly}T00:00:00.000Z`);
}
export function fromDeliveryDateSentinel(value: Date): string {
  return value.toISOString().slice(0, 10);
}
export function buildDeliverySlots(now: Date, method: CheckoutQuoteInput['deliveryMethod']): DeliverySlot[] {
  const lead =
    method === 'courier'
      ? CHECKOUT_POLICY.courier.leadDays
      : CHECKOUT_POLICY.pickupPoints.find((point) => point.kind === method)?.leadDays;
  if (lead === undefined) throw new Error('Unsupported delivery method');
  const windowCount = CHECKOUT_POLICY.windows.length;
  const today = toDeliveryDateSentinel(moscowDateOnly(now));
  return Array.from({ length: CHECKOUT_POLICY.horizonDays * windowCount }, (_, index) => {
    const day = new Date(today);
    day.setUTCDate(day.getUTCDate() + lead + Math.floor(index / windowCount));
    const date = fromDeliveryDateSentinel(day);
    const window = CHECKOUT_POLICY.windows[index % windowCount];
    return { id: `${date}:${window.id}`, date, windowId: window.id, windowLabel: window.label };
  });
}
export function calculateServiceLines(input: Pick<CheckoutQuoteInput, 'deliveryMethod' | 'address' | 'services'>) {
  if (input.deliveryMethod !== 'courier') return [] as Array<{ id: string; amount: number }>;
  const lines: Array<{ id: string; amount: number }> = [];
  if (input.services.carrying && input.address?.liftType === 'none')
    lines.push({
      id: 'carrying',
      amount: Math.max(0, (input.address.floor ?? 1) - 1) * CHECKOUT_POLICY.services.carryingPerFloor,
    });
  if (input.services.assembly) lines.push({ id: 'assembly', amount: CHECKOUT_POLICY.services.assembly });
  if (input.services.removal) lines.push({ id: 'removal', amount: CHECKOUT_POLICY.services.removal });
  return lines;
}
export function calculateCheckoutTotals(input: {
  itemsTotal: number;
  couponDiscount: number;
  selection: Pick<CheckoutQuoteInput, 'deliveryMethod' | 'deliveryZone' | 'address' | 'services'>;
}) {
  const goods = Math.max(0, input.itemsTotal - input.couponDiscount);
  const shipping =
    input.selection.deliveryMethod === 'courier' && goods < CHECKOUT_POLICY.courier.freeFrom
      ? CHECKOUT_POLICY.courier[input.selection.deliveryZone ?? 'moscow']
      : 0;
  const serviceAmount = calculateServiceLines(input.selection).reduce((sum, line) => sum + line.amount, 0);
  return { shippingAmount: shipping, serviceAmount, totalAmount: goods + shipping + serviceAmount };
}
export function resolveDeliverySelection(
  input: CheckoutQuoteInput | { shippingMethod: 'pickup'; pickupPointId: string | null },
  now: Date,
) {
  if ('shippingMethod' in input) {
    if (!input.pickupPointId) return { deliveryMethod: 'legacy-pickup' as const };
    const legacyPoint = CHECKOUT_POLICY.pickupPoints.find((candidate) => candidate.id === input.pickupPointId);
    return legacyPoint
      ? { deliveryMethod: legacyPoint.kind, pickupPointId: legacyPoint.id }
      : { deliveryMethod: 'unknown-pickup' as const, pickupPointId: input.pickupPointId };
  }
  const slot = buildDeliverySlots(now, input.deliveryMethod).find((candidate) => candidate.id === input.deliverySlotId);
  if (!slot) throw new Error('Invalid delivery slot');
  const point = CHECKOUT_POLICY.pickupPoints.find((candidate) => candidate.id === input.pickupPointId);
  if (input.deliveryMethod !== 'courier' && (!point || point.kind !== input.deliveryMethod))
    throw new Error('Invalid pickup point');
  return {
    shippingMethod: input.deliveryMethod === 'courier' ? 'courier' : 'pickup',
    deliveryDate: slot.date,
    deliveryWindow: slot.windowId,
    pickupPointId: point?.id,
    pickupPointName: point?.name,
    pickupPointAddress: point?.address,
  };
}
export function toPersistedShippingMethod(method: CheckoutQuoteInput['deliveryMethod']): 'courier' | 'pickup' {
  return method === 'courier' ? 'courier' : 'pickup';
}
