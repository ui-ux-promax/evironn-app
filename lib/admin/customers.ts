import { Prisma, type OrderStatus, type UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma-client';
import { buildPaginationMeta, parsePaginationParams } from '@/lib/admin/pagination';
import { formatOrderItemConfiguration } from '@/lib/order';
import { buildCustomerOrderByClause, escapeLike, type CustomerSort, ROLE_FILTER_VALUES } from '@/lib/customer-admin';
import type { AdminOrderItemSnapshot } from '@/lib/admin/orders';

export type AdminCustomerListInput = {
  page: number;
  limit: number;
  query: string;
  role?: UserRole;
  sort?: CustomerSort;
};

export type AdminCustomerRow = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: UserRole;
  orderCount: number;
  totalSpent: number;
  createdAt: Date;
};

export type AdminCustomerListResult = {
  rows: AdminCustomerRow[];
  total: number;
  pagination: { page: number; limit: number; totalPages: number; hasPrevious: boolean; hasNext: boolean };
};

export type AdminCustomerDetail = AdminCustomerRow & {
  emailVerified: Date | null;
  image: string | null;
  birthdate: Date | null;
  reviewSummary: { count: number; averageRating: number | null };
  wishlistCount: number;
  cartCount: number;
  newsletterActive: boolean;
  roleControl: { isSelf: boolean; isLastAdmin: boolean };
  orders: Array<{
    id: string;
    orderNumber: number;
    status: OrderStatus;
    createdAt: Date;
    totalAmount: number;
    paymentStatus: string | null;
    items: AdminOrderItemSnapshot[];
  }>;
};

type CustomerListRaw = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: UserRole;
  order_count: number;
  total_spent: number;
  created_at: Date;
};

const customerUserSelect = {
  id: true,
  name: true,
  email: true,
  emailVerified: true,
  image: true,
  phone: true,
  birthdate: true,
  role: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

const customerHistorySelect = {
  id: true,
  orderNumber: true,
  status: true,
  totalAmount: true,
  createdAt: true,
  payment: { select: { status: true } },
  items: {
    select: {
      id: true,
      skuArticleNumber: true,
      productName: true,
      imageUrl: true,
      configuration: true,
      sku: true,
      colorwayName: true,
      size: true,
      unitPrice: true,
      quantity: true,
      lineTotal: true,
    },
  },
} satisfies Prisma.OrderSelect;

function isRoleFilter(role: UserRole | undefined): role is (typeof ROLE_FILTER_VALUES)[number] {
  return role !== undefined && ROLE_FILTER_VALUES.includes(role as (typeof ROLE_FILTER_VALUES)[number]);
}

export async function listAdminCustomers(input: AdminCustomerListInput): Promise<AdminCustomerListResult> {
  const { page, limit, skip } = parsePaginationParams(
    { page: input.page.toString(), limit: input.limit.toString() },
    { limit: 20 },
  );
  const query = input.query.trim();
  const roleCond = isRoleFilter(input.role) ? Prisma.sql`AND u.role::text = ${input.role}` : Prisma.empty;
  const searchCond = query
    ? Prisma.sql`AND (u.name ILIKE ${`%${escapeLike(query)}%`} OR u.email ILIKE ${`%${escapeLike(query)}%`} OR u.phone ILIKE ${`%${escapeLike(query)}%`})`
    : Prisma.empty;
  const orderBy = Prisma.raw(`${buildCustomerOrderByClause(input.sort)}, u.id DESC`);

  const [rowsRaw, totalRows] = await Promise.all([
    prisma.$queryRaw<CustomerListRaw[]>(Prisma.sql`
      SELECT u.id, u.name, u.email, u.phone, u.role,
             COUNT(o.id)::int AS order_count,
             COALESCE(SUM(o."totalAmount") FILTER (WHERE o.status::text <> 'CANCELLED'), 0)::int AS total_spent,
             u."createdAt" AS created_at
      FROM "User" u
      LEFT JOIN "Order" o ON o."userId" = u.id
      WHERE 1=1 ${roleCond} ${searchCond}
      GROUP BY u.id
      ORDER BY ${orderBy}
      LIMIT ${limit} OFFSET ${skip}
    `),
    prisma.$queryRaw<{ count: number }[]>(Prisma.sql`
      SELECT COUNT(*)::int AS count FROM "User" u WHERE 1=1 ${roleCond} ${searchCond}
    `),
  ]);

  const total = totalRows[0]?.count ?? 0;
  const meta = buildPaginationMeta({ page, limit }, total);
  return {
    rows: rowsRaw.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      role: row.role,
      orderCount: row.order_count,
      totalSpent: row.total_spent,
      createdAt: row.created_at,
    })),
    total,
    pagination: {
      page: meta.page,
      limit: meta.limit,
      totalPages: meta.totalPages,
      hasPrevious: meta.page > 1,
      hasNext: meta.page < meta.totalPages,
    },
  };
}

export async function getAdminCustomerDetail(
  userId: string,
  actingAdminId: string,
): Promise<AdminCustomerDetail | null> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: customerUserSelect });
  if (!user) return null;

  const [orderCount, spentAgg, reviewAgg, wishlistCount, cartCount, subscriber, adminCount, orders] = await Promise.all(
    [
      prisma.order.count({ where: { userId } }),
      prisma.order.aggregate({ where: { userId, status: { not: 'CANCELLED' } }, _sum: { totalAmount: true } }),
      prisma.review.aggregate({ where: { userId }, _count: { _all: true }, _avg: { rating: true } }),
      prisma.wishlistItem.count({ where: { wishlist: { userId } } }),
      prisma.cartItem.count({ where: { cart: { userId } } }),
      prisma.subscriber.findUnique({ where: { email: user.email }, select: { unsubscribedAt: true } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.order.findMany({
        where: { userId },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 50,
        select: customerHistorySelect,
      }),
    ],
  );

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    orderCount,
    totalSpent: spentAgg._sum.totalAmount ?? 0,
    createdAt: user.createdAt,
    emailVerified: user.emailVerified,
    image: user.image,
    birthdate: user.birthdate,
    reviewSummary: { count: reviewAgg._count._all, averageRating: reviewAgg._avg.rating },
    wishlistCount,
    cartCount,
    newsletterActive: subscriber?.unsubscribedAt === null,
    roleControl: { isSelf: user.id === actingAdminId, isLastAdmin: user.role === 'ADMIN' && adminCount <= 1 },
    orders: orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      createdAt: order.createdAt,
      totalAmount: order.totalAmount,
      paymentStatus: order.payment?.status ?? null,
      items: order.items.map((item) => ({
        id: item.id,
        articleNumber: item.skuArticleNumber,
        combinationLabel: formatOrderItemConfiguration(item),
        productName: item.productName,
        imageUrl: item.imageUrl,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        lineTotal: item.lineTotal,
      })),
    })),
  };
}
