import { describe, expect, it } from 'vitest';
import { createDashboardReferenceModel } from '@/app/(admin)/admin/_components/create-dashboard-reference-model';

describe('createDashboardReferenceModel', () => {
  it('maps persisted commerce projections into the accepted dashboard model', () => {
    const model = createDashboardReferenceModel({
      period: 30,
      kpis: {
        revenue: { value: 485420, trend: { pct: 12.6, dir: 'up' } },
        orders: { value: 1745, trend: { pct: 8.4, dir: 'up' } },
        avgOrder: { value: 388, trend: { pct: 5.2, dir: 'up' } },
        newCustomers: { value: 0, trend: { pct: 0, dir: 'flat' } },
        unitsSold: { value: 0, trend: { pct: 0, dir: 'flat' } },
      },
      kpiSeries: [
        { label: '01.08', revenue: 12000, orders: 4, avgOrder: 3000 },
        { label: '02.08', revenue: 24000, orders: 8, avgOrder: 3000 },
      ],
      funnel: {
        carts: 3896,
        orders: 1745,
        paid: 1248,
        shipped: 1156,
        completed: 1100,
        conversion: 44.8,
        conversionDelta: 0.8,
      },
      bestSellers: [
        {
          productId: 'sofa',
          name: 'Льняной диван с очень длинным названием',
          brand: 'Evironn',
          imageUrl: 'https://images.example/sofa.jpg',
          units: 42,
          revenue: 234000,
          availableStock: 28,
        },
      ],
      categoryDistribution: [
        { categoryId: 'sofas', name: 'Диваны', value: 700, sharePct: 70 },
        { categoryId: 'other', name: 'Другое', value: 300, sharePct: 30 },
      ],
      recentOrders: [
        {
          id: 'order-1',
          orderNumber: 12548,
          status: 'PENDING',
          paymentStatus: 'pending',
          totalAmount: 142900,
          createdAt: new Date('2026-08-26T12:00:00.000Z'),
          contactName: 'Иван Петров',
          email: null,
          itemCount: 2,
          productName: 'Льняной диван',
          imageUrl: 'https://images.example/sofa.jpg',
          shippingMethod: 'courier',
          deliveryDate: null,
        },
      ],
    });

    expect(model.revenue).toEqual({ label: 'Выручка', value: '485 420 ₽', trend: '+12,6%' });
    expect(model.kpis.map(({ id, value, trend }) => ({ id, value, trend }))).toEqual([
      { id: 'orders', value: '1 745', trend: '+8,4%' },
      { id: 'average', value: '388 ₽', trend: '+5,2%' },
      { id: 'conversion', value: '44,8%', trend: '+0,8%' },
    ]);
    expect(model.funnel.stages.map(({ id, label, value }) => ({ id, label, value }))).toEqual([
      { id: 'carts', label: 'Добавлено в корзину', value: '3 896' },
      { id: 'checkout', label: 'Оформлено', value: '1 745' },
      { id: 'paid', label: 'Оплачено', value: '1 248' },
      { id: 'shipped', label: 'В пути', value: '1 156' },
      { id: 'completed', label: 'Выполненные', value: '1 100' },
    ]);
    expect(model.inventory).toEqual([
      {
        id: 'sofa',
        name: 'Льняной диван с очень длинным названием',
        imageUrl: 'https://images.example/sofa.jpg',
        availability: 'В наличии',
        stock: '28',
        href: '/admin/catalog/products/sofa',
      },
    ]);
    expect(model.categories).toEqual([{ id: 'sofas', name: 'Диваны', icon: 'weekend', share: 70 }]);
    expect(model.categoryOther).toEqual({ label: 'Другое', share: 30 });
    expect(model.orders[0]).toMatchObject({
      href: '/admin/orders/order-1',
      number: '№12548',
      date: '26.08.2026',
      customer: 'Иван Петров',
      overflowCount: 1,
      total: '142 900 ₽',
      orderStatus: { label: 'Ожидает оплаты', tone: 'warning' },
      paymentStatus: { label: 'Ожидает оплаты', tone: 'warning' },
      fulfillmentStatus: { label: '—', tone: 'neutral' },
    });
  });

  it('keeps missing analytics and empty persisted collections honest', () => {
    const model = createDashboardReferenceModel({
      period: 7,
      kpis: {
        revenue: { value: 0, trend: { pct: 0, dir: 'flat' } },
        orders: { value: 0, trend: { pct: 0, dir: 'flat' } },
        avgOrder: { value: 0, trend: { pct: 0, dir: 'flat' } },
        newCustomers: { value: 0, trend: { pct: 0, dir: 'flat' } },
        unitsSold: { value: 0, trend: { pct: 0, dir: 'flat' } },
      },
      kpiSeries: [],
      funnel: null,
      bestSellers: [],
      categoryDistribution: [],
      recentOrders: [
        {
          id: 'order-2',
          orderNumber: 12549,
          status: 'CANCELLED',
          paymentStatus: 'canceled',
          totalAmount: 0,
          createdAt: new Date('2026-08-26T12:00:00.000Z'),
          contactName: 'Мария',
          email: null,
          itemCount: 0,
          productName: null,
          imageUrl: null,
          shippingMethod: null,
          deliveryDate: null,
        },
      ],
    });

    expect(model.funnel.stages.map((stage) => stage.value)).toEqual(['—', '—', '—', '—', '—']);
    expect(model.funnel.footerValue).toBe('—');
    expect(model.funnel.footerTrend).toBeNull();
    expect(model.inventory).toEqual([]);
    expect(model.categories).toEqual([]);
    expect(model.categoryOther).toBeNull();
    expect(model.orders[0]).toMatchObject({
      products: [{ name: '—', imageUrl: null }],
      overflowCount: 0,
      orderStatus: { label: 'Отменён', tone: 'danger' },
      paymentStatus: { label: 'Отменён', tone: 'danger' },
      fulfillmentStatus: { label: 'Отменён', tone: 'danger' },
    });
  });
});
