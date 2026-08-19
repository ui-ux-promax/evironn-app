import { describe, expect, it } from 'vitest';
import { buildOrderPageDto, formatOrderDateOnly, mapOrderStatus } from '@/lib/order-page';
import { CHECKOUT_POLICY } from '@/constants/config';

const now = new Date('2026-08-18T12:00:00.000Z');

function onlineOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: 'online-1',
    orderNumber: 51,
    status: 'PENDING',
    paymentMethod: 'online',
    contactName: 'A',
    contactPhone: '+7',
    contactEmail: 'a@example.com',
    city: 'Москва',
    addressLine: 'Адрес',
    addressComment: null,
    shippingMethod: 'courier',
    deliveryDate: null,
    deliveryWindow: null,
    pickupPointId: null,
    pickupPointName: null,
    pickupPointAddress: null,
    deliveryZone: 'moscow',
    floor: null,
    liftType: null,
    serviceDetails: [],
    itemsTotal: 1000,
    discountAmount: 0,
    shippingAmount: 0,
    serviceAmount: 0,
    totalAmount: 1000,
    couponCode: null,
    paymentReturnUrl: null,
    createdAt: new Date('2026-08-18T10:00:00.000Z'),
    paymentInitializationState: 'CORRELATED',
    paymentEverDispatchedAt: new Date('2026-08-18T10:01:00.000Z'),
    payment: {
      id: 'pay-1',
      status: 'pending',
      confirmationUrl: 'https://pay.test/continue',
      amount: 1000,
      paidAt: null,
    },
    items: [],
    reviewTargets: [],
    ...overrides,
  };
}

describe('order page DTO', () => {
  it('maps status and date-only delivery without timezone drift', () => {
    expect(mapOrderStatus('SHIPPED')).toEqual({ stage: 'on-way', label: 'В пути' });
    expect(formatOrderDateOnly('2026-08-18')).toBe('18 августа 2026 г.');
  });

  it('marks a pending online order as awaiting payment', () => {
    const dto = buildOrderPageDto(onlineOrder(), { now });
    expect(dto.statusLabel).toBe('Ожидает оплаты');
    expect(dto.payment).toMatchObject({ kind: 'online', status: 'pending', label: 'Ожидает оплаты' });
  });

  it.each([
    {
      createdAt: new Date('2026-08-17T20:59:59.999Z'),
      deliveryDate: new Date('2026-08-18T00:00:00.000Z'),
      createdAtLabel: '17 августа 2026 г.',
      deliveryDateLabel: '18 августа 2026 г.',
    },
    {
      createdAt: new Date('2026-08-17T21:00:00.000Z'),
      deliveryDate: new Date('2026-08-17T00:00:00.000Z'),
      createdAtLabel: '18 августа 2026 г.',
      deliveryDateLabel: '17 августа 2026 г.',
    },
  ])('keeps stored dates stable at UTC/Moscow midnight boundary', (fixture) => {
    const dto = buildOrderPageDto(
      onlineOrder({
        payment: null,
        paymentMethod: 'cod',
        createdAt: fixture.createdAt,
        deliveryDate: fixture.deliveryDate,
        deliveryWindow: '10:00-14:00',
      }),
      { now },
    );
    expect(dto.createdAtLabel).toBe(fixture.createdAtLabel);
    expect(dto.delivery.date).toBe(fixture.deliveryDate.toISOString().slice(0, 10));
    expect(dto.delivery.dateLabel).toBe(fixture.deliveryDateLabel);
  });

  it('renders immutable snapshots and service totals', () => {
    const dto = buildOrderPageDto(
      {
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
      },
      { now },
    );
    expect(dto.items[0].href).toBe('/catalog');
    expect(dto.totals.total).toBe(
      dto.totals.itemsSubtotal - dto.totals.discount + dto.totals.delivery + dto.totals.services,
    );
    expect(dto.payment.kind).toBe('cod');
    expect(dto.createdAtLabel).toBe('17 августа 2026 г.');
  });

  it.each([null, [{ id: 'assembly', label: 'Сборка', amount: '3900' }]])(
    'drops legacy invalid service totals',
    (serviceDetails) => {
      const dto = buildOrderPageDto(
        onlineOrder({ paymentMethod: 'cod', payment: null, serviceDetails, serviceAmount: 3900 }),
        { now },
      );
      expect(dto.totals.serviceLines).toEqual([]);
      expect(dto.totals.services).toBe(0);
    },
  );

  it.each(['PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'])(
    'never exposes initialization on final %s orders',
    (status) => {
      const dto = buildOrderPageDto(onlineOrder({ status }), { now, providerProof: true });
      if (dto.payment.kind === 'online') expect(dto.payment.initialization).toBeNull();
      expect(dto.canCancel).toBe(false);
    },
  );

  it.each(['succeeded', 'canceled'])('never exposes initialization for %s online payment', (status) => {
    const base = onlineOrder();
    const dto = buildOrderPageDto(onlineOrder({ payment: { ...base.payment, status } }), { now, providerProof: true });
    if (dto.payment.kind === 'online') expect(dto.payment.initialization).toBeNull();
    expect(dto.canCancel).toBe(false);
  });

  it('requires fresh verified provider proof for continue and cancel', () => {
    const stale = buildOrderPageDto(onlineOrder(), { now, providerProof: false });
    const verified = buildOrderPageDto(onlineOrder(), { now, providerProof: true });
    if (stale.payment.kind === 'online')
      expect(stale.payment.initialization?.status).toBe('PAYMENT_INITIALIZATION_PENDING');
    expect(stale.canCancel).toBe(false);
    if (verified.payment.kind === 'online')
      expect(verified.payment.initialization?.status).toBe('PAYMENT_INITIALIZATION_READY');
    expect(verified.canCancel).toBe(true);
  });

  it('maps only exact policy showroom snapshot as showroom', () => {
    const showroom = CHECKOUT_POLICY.pickupPoints.find((point) => point.kind === 'showroom')!;
    const exact = buildOrderPageDto(
      onlineOrder({
        paymentMethod: 'cod',
        payment: null,
        shippingMethod: 'pickup',
        pickupPointId: showroom.id,
        pickupPointName: showroom.name,
        pickupPointAddress: showroom.address,
      }),
      { now },
    );
    const forged = buildOrderPageDto(
      onlineOrder({
        paymentMethod: 'cod',
        payment: null,
        shippingMethod: 'pickup',
        pickupPointId: showroom.id,
        pickupPointName: 'Другое имя',
        pickupPointAddress: showroom.address,
      }),
      { now },
    );
    expect(exact.delivery.method).toBe('Самовывоз из шоурума');
    expect(forged.delivery.method).toBe('Пункт выдачи');
  });

  it.each([
    ['legacy null id', { pickupPointId: null, pickupPointName: null, pickupPointAddress: null }, 'Самовывоз'],
    [
      'incomplete snapshot',
      { pickupPointId: 'pt-dizavod', pickupPointName: null, pickupPointAddress: null },
      'Пункт выдачи',
    ],
    [
      'unknown snapshot',
      { pickupPointId: 'unknown', pickupPointName: 'Неизвестный пункт', pickupPointAddress: 'Сохранённый адрес' },
      'Пункт выдачи',
    ],
  ])('keeps %s pickup neutral', (_case, pickup, method) => {
    const dto = buildOrderPageDto(
      onlineOrder({ paymentMethod: 'cod', payment: null, shippingMethod: 'pickup', ...pickup }),
      { now },
    );
    expect(dto.delivery.method).toBe(method);
  });
});
