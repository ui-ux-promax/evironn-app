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
    expect(CHECKOUT_POLICY.windows).toEqual([
      { id: '10-14', label: '10:00 – 14:00' },
      { id: '14-18', label: '14:00 – 18:00' },
      { id: '18-22', label: '18:00 – 22:00' },
    ]);
    expect(CHECKOUT_POLICY.pickupPoints).toEqual([
      {
        id: 'pt-dizavod',
        kind: 'showroom',
        name: 'Шоурум Evironn',
        address: 'Большая Новодмитровская, 36',
        hours: '11:00 – 21:00',
        metro: 'Дмитровская',
        leadDays: 1,
      },
      {
        id: 'pt-danilov',
        kind: 'pickup-point',
        name: 'Пункт «Даниловский»',
        address: 'Дубининская, 71',
        hours: '10:00 – 22:00',
        metro: 'Тульская',
        leadDays: 2,
      },
      {
        id: 'pt-vdnh',
        kind: 'pickup-point',
        name: 'Пункт «ВДНХ»',
        address: 'Проспект Мира, 119',
        hours: '09:00 – 21:00',
        metro: 'ВДНХ',
        leadDays: 2,
      },
    ]);
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
    expect(() =>
      calculateServiceLines({ ...courier, address: { city: 'Moscow', addressLine: 'Tverskaya 1', floor: 5 } }),
    ).toThrow('Lift type required for carrying');
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
    expect(resolveDeliverySelection({ shippingMethod: 'pickup', pickupPointId: 'pt-dizavod' }, new Date())).toEqual({
      deliveryMethod: 'showroom',
      pickupPointId: 'pt-dizavod',
    });
    expect(resolveDeliverySelection({ shippingMethod: 'pickup', pickupPointId: 'pt-danilov' }, new Date())).toEqual({
      deliveryMethod: 'pickup-point',
      pickupPointId: 'pt-danilov',
    });
    expect(resolveDeliverySelection({ shippingMethod: 'pickup', pickupPointId: 'unknown' }, new Date())).toEqual({
      deliveryMethod: 'unknown-pickup',
      pickupPointId: 'unknown',
    });
  });

  it('rejects forged or policy-stale delivery slot ids explicitly', () => {
    expect(() =>
      resolveDeliverySelection({ ...courier, deliverySlotId: '2026-08-22:10-14' }, new Date('2026-08-16T20:59:59Z')),
    ).toThrow('Invalid delivery slot');
    expect(() =>
      resolveDeliverySelection({ ...courier, deliverySlotId: 'forged-slot' }, new Date('2026-08-16T21:00:00Z')),
    ).toThrow('Invalid delivery slot');
  });
});
