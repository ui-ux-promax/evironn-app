import { describe, expect, it } from 'vitest';
import { checkoutQuoteInputSchema, placeOrderSchema } from '@/services/dto/checkout.dto';

const courier = {
  deliveryMethod: 'courier',
  deliveryZone: 'moscow',
  deliverySlotId: '2026-08-19:10-14',
  address: { city: 'Moscow', addressLine: 'Tverskaya 1', floor: 5, liftType: 'none' },
  services: { carrying: true, assembly: false, removal: false },
};

describe('checkout DTOs', () => {
  it('accepts strict cart-only courier input', () => {
    expect(checkoutQuoteInputSchema.parse(courier)).toEqual(courier);
  });

  it.each([
    [{ ...courier, buyNowSkuId: 'sku' }],
    [{ ...courier, buyNowVariantId: 'variant' }],
    [{ ...courier, deliveryZone: 'other' }],
    [{ ...courier, address: undefined }],
    [{ ...courier, deliverySlotId: '' }],
    [{ ...courier, address: { ...courier.address, floor: 61 } }],
    [
      {
        deliveryMethod: 'showroom',
        deliverySlotId: '2026-08-18:10-14',
        pickupPointId: 'pt-danilov',
        services: { carrying: false, assembly: false, removal: false },
      },
    ],
    [
      {
        deliveryMethod: 'pickup-point',
        deliverySlotId: '2026-08-19:10-14',
        services: { carrying: false, assembly: false, removal: false },
      },
    ],
    [
      {
        deliveryMethod: 'pickup-point',
        deliverySlotId: '2026-08-19:10-14',
        pickupPointId: 'pt-danilov',
        address: courier.address,
        services: { carrying: false, assembly: false, removal: false },
      },
    ],
  ])('rejects invalid quote input %#', (input) => {
    expect(checkoutQuoteInputSchema.safeParse(input).success).toBe(false);
  });

  it('normalizes contact fields and rejects unsupported payment methods', () => {
    const valid = {
      ...courier,
      contactName: '  Ivan Ivanov ',
      contactPhone: '8 (999) 123-45-67',
      contactEmail: ' IVAN@example.com ',
      paymentMethod: 'online',
    };
    expect(placeOrderSchema.parse(valid)).toMatchObject({
      contactName: 'Ivan Ivanov',
      contactPhone: '+79991234567',
      contactEmail: 'IVAN@example.com',
    });
    expect(placeOrderSchema.safeParse({ ...valid, paymentMethod: 'card' }).success).toBe(false);
  });
});
