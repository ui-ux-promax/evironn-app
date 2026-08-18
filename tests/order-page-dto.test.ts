import { describe, expect, it } from 'vitest';
import { buildOrderPageDto, formatOrderDateOnly, mapOrderStatus } from '@/lib/order-page';

describe('order page DTO', () => {
  it('maps status and date-only delivery without timezone drift', () => {
    expect(mapOrderStatus('SHIPPED')).toEqual({ stage: 'on-way', label: 'В пути' });
    expect(formatOrderDateOnly('2026-08-18')).toBe('18 августа 2026 г.');
  });

  it('renders immutable snapshots and service totals', () => {
    const dto = buildOrderPageDto({
      id: 'o1',
      orderNumber: 42,
      status: 'PENDING',
      paymentMethod: 'cod',
      contactName: 'A',
      contactPhone: '+7',
      contactEmail: 'a@example.com',
      city: 'Москва',
      addressLine: 'ул. Тестовая, 1',
      addressComment: null,
      shippingMethod: 'courier',
      deliveryDate: new Date('2026-08-18T00:00:00Z'),
      deliveryWindow: '10:00-14:00',
      pickupPointId: null,
      pickupPointName: null,
      pickupPointAddress: null,
      deliveryZone: 'moscow',
      floor: 2,
      liftType: 'none',
      intercom: null,
      serviceDetails: [{ id: 'assembly', label: 'Сборка', amount: 3900 }],
      itemsTotal: 100000,
      discountAmount: 10000,
      shippingAmount: 1900,
      serviceAmount: 3900,
      totalAmount: 95800,
      couponCode: 'TEST',
      paymentReturnUrl: null,
      createdAt: new Date('2026-08-17T12:00:00Z'),
      items: [
        {
          id: 'i1',
          productName: 'Chair',
          productSlug: null,
          imageUrl: '/chair.jpg',
          configuration: null,
          unitPrice: 100000,
          quantity: 1,
          lineTotal: 100000,
        },
      ],
      payment: null,
      reviewTargets: [],
    });
    expect(dto.items[0].href).toBe('/catalog');
    expect(dto.totals.total).toBe(
      dto.totals.itemsSubtotal - dto.totals.discount + dto.totals.delivery + dto.totals.services,
    );
    expect(dto.payment.kind).toBe('cod');
  });
});
