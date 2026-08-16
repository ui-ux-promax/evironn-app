import { describe, expect, it } from 'vitest';
import { CHECKOUT_POLICY } from '@/constants/config';
import {
  buildDeliverySlots,
  calculateCheckoutTotals,
  calculateServiceLines,
  fromDeliveryDateSentinel,
  moscowDateOnly,
  resolveDeliverySelection,
  toDeliveryDateSentinel,
  toPersistedShippingMethod,
} from '@/lib/checkout-domain';

const courier = {
  deliveryMethod: 'courier' as const,
  deliveryZone: 'moscow' as const,
  deliverySlotId: '2026-08-19:10-14',
  address: { city: 'Moscow', addressLine: 'Tverskaya 1', floor: 5, liftType: 'none' as const },
  services: { carrying: true, assembly: true, removal: true },
};

describe('ADR-016 checkout policy', () => {
  it('pins rates, pickup identities, lead times, windows, and horizon', () => {
    expect(CHECKOUT_POLICY.courier).toMatchObject({ moscow: 1900, 'moscow-region': 1900, freeFrom: 150000 });
    expect(CHECKOUT_POLICY.services).toMatchObject({ carryingPerFloor: 350, assembly: 3900, removal: 2400 });
    expect(CHECKOUT_POLICY.horizonDays).toBe(4);
    expect(CHECKOUT_POLICY.windows.map((window) => window.id)).toEqual(['10-14', '14-18', '18-22']);
    expect(CHECKOUT_POLICY.pickupPoints).toHaveLength(3);
    expect(CHECKOUT_POLICY.pickupPoints[0]).toMatchObject({ id: 'pt-dizavod', kind: 'showroom', leadDays: 1 });
    expect(
      CHECKOUT_POLICY.pickupPoints.slice(1).every((point) => point.kind === 'pickup-point' && point.leadDays === 2),
    ).toBe(true);
  });

  it('uses Moscow civil dates and UTC-midnight sentinels', () => {
    expect(moscowDateOnly(new Date('2026-08-16T20:59:59Z'))).toBe('2026-08-16');
    expect(moscowDateOnly(new Date('2026-08-16T21:00:00Z'))).toBe('2026-08-17');
    const sentinel = toDeliveryDateSentinel('2026-08-19');
    expect(sentinel.toISOString()).toBe('2026-08-19T00:00:00.000Z');
    expect(fromDeliveryDateSentinel(sentinel)).toBe('2026-08-19');
  });

  it('builds stable server-owned slots', () => {
    const slots = buildDeliverySlots(new Date('2026-08-16T21:00:00Z'), 'courier');
    expect(slots).toHaveLength(12);
    expect(slots[0]).toMatchObject({ id: '2026-08-19:10-14', date: '2026-08-19', windowId: '10-14' });
  });

  it('calculates services and totals from discounted goods', () => {
    expect(calculateServiceLines(courier)).toEqual([
      expect.objectContaining({ id: 'carrying', amount: 1400 }),
      expect.objectContaining({ id: 'assembly', amount: 3900 }),
      expect.objectContaining({ id: 'removal', amount: 2400 }),
    ]);
    expect(calculateCheckoutTotals({ itemsTotal: 160000, couponDiscount: 20000, selection: courier })).toMatchObject({
      shippingAmount: 1900,
      serviceAmount: 7700,
      totalAmount: 149600,
    });
  });

  it('resolves exact pickup snapshots and legacy compatibility', () => {
    expect(resolveDeliverySelection(courier, new Date('2026-08-16T21:00:00Z'))).toMatchObject({
      shippingMethod: 'courier',
      deliveryDate: '2026-08-19',
      deliveryWindow: '10-14',
    });
    expect(toPersistedShippingMethod('showroom')).toBe('pickup');
    expect(toPersistedShippingMethod('pickup-point')).toBe('pickup');
    expect(toPersistedShippingMethod('courier')).toBe('courier');
    expect(resolveDeliverySelection({ shippingMethod: 'pickup', pickupPointId: null }, new Date())).toEqual({
      deliveryMethod: 'legacy-pickup',
    });
  });
});
