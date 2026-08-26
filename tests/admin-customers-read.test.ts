import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma-client', () => ({
  prisma: {
    $queryRaw: vi.fn(),
    user: { findUnique: vi.fn(), count: vi.fn() },
    order: { count: vi.fn(), aggregate: vi.fn(), findMany: vi.fn() },
    review: { aggregate: vi.fn() },
    wishlistItem: { count: vi.fn() },
    cartItem: { count: vi.fn() },
    subscriber: { findUnique: vi.fn() },
  },
}));

import { prisma } from '@/lib/prisma-client';
import { getAdminCustomerDetail, listAdminCustomers } from '@/lib/admin/customers';

const p = prisma as unknown as {
  $queryRaw: ReturnType<typeof vi.fn>;
  user: Record<string, ReturnType<typeof vi.fn>>;
  order: Record<string, ReturnType<typeof vi.fn>>;
  review: Record<string, ReturnType<typeof vi.fn>>;
  wishlistItem: Record<string, ReturnType<typeof vi.fn>>;
  cartItem: Record<string, ReturnType<typeof vi.fn>>;
  subscriber: Record<string, ReturnType<typeof vi.fn>>;
};

const createdAt = new Date('2026-08-25T12:00:00.000Z');

beforeEach(() => {
  vi.clearAllMocks();
  p.user.count.mockResolvedValue(1);
  p.order.count.mockResolvedValue(2);
  p.order.aggregate.mockResolvedValue({ _sum: { totalAmount: 125000 } });
  p.review.aggregate.mockResolvedValue({ _count: { _all: 2 }, _avg: { rating: 4.5 } });
  p.wishlistItem.count.mockResolvedValue(3);
  p.cartItem.count.mockResolvedValue(1);
  p.subscriber.findUnique.mockResolvedValue({ unsubscribedAt: null });
});

describe('admin customer reads', () => {
  it('bounds pagination, escapes text search, filters roles, and uses whitelisted deterministic sorting', async () => {
    p.$queryRaw
      .mockResolvedValueOnce([
        {
          id: 'u1',
          name: 'Alice',
          email: 'alice@example.com',
          phone: '+7 900',
          role: 'CUSTOMER',
          order_count: 2,
          total_spent: 125000,
          created_at: createdAt,
        },
      ])
      .mockResolvedValueOnce([{ count: 401 }]);

    const result = await listAdminCustomers({
      page: 2,
      limit: 500,
      query: 'a%_\\',
      role: 'CUSTOMER',
      sort: 'spent',
    });

    expect(result.rows).toEqual([
      {
        id: 'u1',
        name: 'Alice',
        email: 'alice@example.com',
        phone: '+7 900',
        role: 'CUSTOMER',
        orderCount: 2,
        totalSpent: 125000,
        createdAt,
      },
    ]);
    expect(result.pagination).toEqual({
      page: 2,
      limit: 200,
      totalPages: 3,
      hasPrevious: true,
      hasNext: true,
    });

    const [listQuery] = p.$queryRaw.mock.calls[0];
    const values = (listQuery as { values: unknown[] }).values;
    expect(values).toContain('CUSTOMER');
    expect(values).toContain('%a\\%\\_\\\\%');
    expect(String(listQuery.sql ?? listQuery.text ?? listQuery)).toContain('total_spent DESC');
    expect(String(listQuery.sql ?? listQuery.text ?? listQuery)).toContain('u.id DESC');
    expect(values).toContain(200);
    expect(values).toContain(200);
  });

  it('returns recent history in deterministic order with stored snapshot lines only', async () => {
    p.user.findUnique.mockResolvedValue({
      id: 'u1',
      name: 'Alice',
      email: 'alice@example.com',
      emailVerified: createdAt,
      image: '/avatar.jpg',
      phone: '+7 900',
      birthdate: new Date('1990-01-01T00:00:00.000Z'),
      role: 'ADMIN',
      createdAt,
    });
    p.order.findMany.mockResolvedValue([
      {
        id: 'order-1',
        orderNumber: 1001,
        status: 'PENDING',
        totalAmount: 126900,
        createdAt,
        payment: { status: 'pending' },
        items: [
          {
            id: 'item-1',
            skuArticleNumber: 'EV-NOMA-OAK',
            productName: 'Noma Lounge Chair',
            imageUrl: '/snapshots/noma.webp',
            configuration: [{ groupName: 'Материал', valueName: 'Дуб' }],
            sku: 'stored-sku',
            colorwayName: null,
            size: null,
            unitPrice: 125000,
            quantity: 1,
            lineTotal: 125000,
          },
        ],
      },
    ]);

    const result = await getAdminCustomerDetail('u1', 'u1');

    expect(result).toMatchObject({
      id: 'u1',
      phone: '+7 900',
      orderCount: 2,
      totalSpent: 125000,
      reviewSummary: { count: 2, averageRating: 4.5 },
      wishlistCount: 3,
      cartCount: 1,
      newsletterActive: true,
      roleControl: { isSelf: true, isLastAdmin: true },
      orders: [
        {
          id: 'order-1',
          orderNumber: 1001,
          paymentStatus: 'pending',
          items: [
            expect.objectContaining({
              articleNumber: 'EV-NOMA-OAK',
              productName: 'Noma Lounge Chair',
              combinationLabel: 'Материал: Дуб',
              imageUrl: '/snapshots/noma.webp',
              lineTotal: 125000,
            }),
          ],
        },
      ],
    });
    expect(p.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 50,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      }),
    );

    const orderSelect = p.order.findMany.mock.calls[0][0].select;
    expect(orderSelect.items.select).not.toHaveProperty('canonicalSku');
    expect(orderSelect.items.select).not.toHaveProperty('product');
    expect(orderSelect.items.select).toEqual(
      expect.objectContaining({ productName: true, configuration: true, imageUrl: true, lineTotal: true }),
    );
  });

  it('returns null for missing customers without running secondary reads', async () => {
    p.user.findUnique.mockResolvedValue(null);

    await expect(getAdminCustomerDetail('missing', 'admin1')).resolves.toBeNull();
    expect(p.order.findMany).not.toHaveBeenCalled();
    expect(p.review.aggregate).not.toHaveBeenCalled();
  });
});
