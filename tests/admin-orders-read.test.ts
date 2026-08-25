import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma-client', () => ({
  prisma: {
    order: {
      aggregate: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma-client';
import { listAdminOrders } from '@/lib/admin/orders';

const p = prisma as unknown as {
  order: Record<string, ReturnType<typeof vi.fn>>;
};

const createdAt = new Date('2026-08-25T12:00:00.000Z');

function makeOrder(over: Record<string, unknown> = {}) {
  return {
    id: 'order-1',
    orderNumber: 1001,
    status: 'PENDING',
    payment: { status: 'pending' },
    paymentMethod: 'online',
    contactName: 'Alice Example',
    contactEmail: 'alice@example.com',
    items: [
      { imageUrl: null, quantity: 2 },
      { imageUrl: 'https://cdn.example.com/stored-cover.jpg', quantity: 1 },
    ],
    totalAmount: 125000,
    createdAt,
    ...over,
  };
}

function primeReads({ total = 1, orders = [makeOrder()] } = {}) {
  p.order.count.mockResolvedValue(total);
  p.order.findMany.mockResolvedValue(orders);
  p.order.groupBy.mockResolvedValue([
    { status: 'PENDING', _count: { _all: 2 } },
    { status: 'PROCESSING', _count: { _all: 1 } },
    { status: 'DELIVERED', _count: { _all: 4 } },
  ]);
  p.order.aggregate.mockResolvedValue({ _sum: { totalAmount: 125000 } });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('bounded admin order reads', () => {
  it('searches numeric queries by exact order number only', async () => {
    primeReads();

    await listAdminOrders({ page: 1, limit: 10, query: '1001' });

    expect(p.order.count).toHaveBeenCalledWith({ where: { OR: [{ orderNumber: 1001 }] } });
    expect(p.order.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { OR: [{ orderNumber: 1001 }] } }));
  });

  it('searches text queries across stored contact fields', async () => {
    primeReads();

    await listAdminOrders({ page: 1, limit: 10, query: 'Alice' });

    expect(p.order.count).toHaveBeenCalledWith({
      where: {
        OR: [
          { contactName: { contains: 'Alice', mode: 'insensitive' } },
          { contactPhone: { contains: 'Alice', mode: 'insensitive' } },
          { contactEmail: { contains: 'Alice', mode: 'insensitive' } },
        ],
      },
    });
  });

  it('composes status and payment filters, including waiting_for_capture', async () => {
    primeReads();

    await listAdminOrders({
      page: 1,
      limit: 10,
      query: '',
      status: 'PROCESSING',
      payment: 'waiting_for_capture',
    });

    expect(p.order.count).toHaveBeenCalledWith({
      where: {
        status: 'PROCESSING',
        payment: { is: { status: 'waiting_for_capture' } },
      },
    });
  });

  it('clamps pagination, uses bounded reads, and orders deterministically', async () => {
    primeReads({ total: 401 });

    const result = await listAdminOrders({ page: 0, limit: 999, query: '' });

    expect(p.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 200,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      }),
    );
    expect(result.pagination).toEqual({
      page: 1,
      limit: 200,
      totalPages: 3,
      hasPrevious: false,
      hasNext: true,
    });
  });

  it('projects stored image covers, item quantities, revenue, and global status counts', async () => {
    primeReads({
      total: 1,
      orders: [makeOrder({ payment: null, status: 'CANCELLED' })],
    });

    const result = await listAdminOrders({ page: 1, limit: 10, query: '' });

    expect(result.rows).toEqual([
      {
        id: 'order-1',
        orderNumber: 1001,
        status: 'CANCELLED',
        paymentStatus: null,
        paymentMethod: 'online',
        contactName: 'Alice Example',
        contactEmail: 'alice@example.com',
        itemCount: 3,
        totalAmount: 125000,
        coverImage: 'https://cdn.example.com/stored-cover.jpg',
        createdAt,
      },
    ]);
    expect(result.statusCounts).toEqual({
      PENDING: 2,
      PROCESSING: 1,
      SHIPPED: 0,
      DELIVERED: 4,
      CANCELLED: 0,
    });
    expect(result.filteredRevenue).toBe(125000);
  });
});
