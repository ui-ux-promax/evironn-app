import type { Prisma } from '@prisma/client';
import { buildCatalogBCard, type CatalogBCard } from '@/components/evironn/catalog/catalog-variant-b-adapter';
import { buildFurnitureProductCardData, type FurnitureProductForCard } from '@/lib/furniture-product-summary';
import { formatOrderItemConfiguration } from '@/lib/order';
import { prisma } from '@/lib/prisma-client';
import { LOW_STOCK_THRESHOLD, NEW_PRODUCT_WINDOW_DAYS } from '@/constants/config';
import type { ProfilePageDto } from '@/services/dto/profile-page.dto';

const profileUserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  birthdate: true,
  createdAt: true,
  orders: {
    orderBy: [{ createdAt: 'desc' as const }, { id: 'asc' as const }],
    select: {
      id: true,
      orderNumber: true,
      status: true,
      createdAt: true,
      shippingMethod: true,
      city: true,
      addressLine: true,
      itemsTotal: true,
      discountAmount: true,
      shippingAmount: true,
      totalAmount: true,
      items: {
        orderBy: { id: 'asc' as const },
        select: {
          id: true,
          productName: true,
          configuration: true,
          imageUrl: true,
          unitPrice: true,
          quantity: true,
          lineTotal: true,
          colorwayName: true,
          size: true,
          canonicalSku: { select: { id: true, product: { select: { name: true } } } },
          productVariant: {
            select: { id: true, colorway: { select: { name: true, product: { select: { name: true } } } } },
          },
        },
      },
    },
  },
  addresses: {
    orderBy: [{ isDefault: 'desc' as const }, { createdAt: 'asc' as const }, { id: 'asc' as const }],
    select: { id: true, label: true, city: true, street: true, comment: true, isDefault: true, createdAt: true },
  },
} satisfies Prisma.UserSelect;

const favoriteProductSelect = {
  id: true,
  name: true,
  slug: true,
  brand: true,
  active: true,
  createdAt: true,
  isBestseller: true,
  category: { select: { name: true, slug: true } },
  media: {
    where: { kind: 'IMAGE' },
    orderBy: [{ sortOrder: 'asc' as const }, { id: 'asc' as const }],
    select: { id: true, url: true, alt: true, sortOrder: true },
  },
  skus: {
    where: { active: true },
    orderBy: [{ price: 'asc' as const }, { id: 'asc' as const }],
    select: {
      id: true,
      price: true,
      oldPrice: true,
      stock: true,
      active: true,
      media: {
        where: { kind: 'IMAGE' },
        orderBy: [{ sortOrder: 'asc' as const }, { id: 'asc' as const }],
        select: { id: true, url: true, alt: true, sortOrder: true },
      },
      selections: {
        orderBy: { optionGroup: { sortOrder: 'asc' as const } },
        select: {
          optionGroup: { select: { name: true, slug: true, sortOrder: true } },
          optionValue: { select: { name: true, slug: true, swatchHex: true, sortOrder: true } },
        },
      },
    },
  },
} satisfies Prisma.ProductSelect;

type ProfileUser = Prisma.UserGetPayload<{ select: typeof profileUserSelect }>;
type FavoriteProduct = Prisma.ProductGetPayload<{ select: typeof favoriteProductSelect }>;

function initials(name: string | null, email: string): string {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
  const source = words[0] ?? email.split('@')[0] ?? '';
  return source.slice(0, 2).toUpperCase();
}

function sortAddresses(addresses: ProfileUser['addresses']): ProfileUser['addresses'] {
  return [...addresses].sort(
    (left, right) =>
      Number(right.isDefault) - Number(left.isDefault) ||
      left.createdAt.getTime() - right.createdAt.getTime() ||
      left.id.localeCompare(right.id),
  );
}

function buildFavoriteCard(product: FavoriteProduct): CatalogBCard {
  const card = buildFurnitureProductCardData(product as unknown as FurnitureProductForCard, new Date(), {
    newWindowDays: NEW_PRODUCT_WINDOW_DAYS,
    lowStock: LOW_STOCK_THRESHOLD,
  });
  return buildCatalogBCard(card);
}

export async function getProfilePageDto(userId: string): Promise<ProfilePageDto> {
  if (!userId.trim()) throw new Error('Не авторизован');

  const [user, favoriteRows] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: profileUserSelect }),
    prisma.wishlistItem.findMany({
      where: { wishlist: { userId }, product: { active: true } },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      take: 100,
      select: { product: { select: favoriteProductSelect } },
    }),
  ]);

  if (!user) throw new Error('Профиль не найден');

  const orders = user.orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    shippingMethod: order.shippingMethod,
    city: order.city,
    addressLine: order.addressLine,
    itemsTotal: order.itemsTotal,
    discountAmount: order.discountAmount,
    shippingAmount: order.shippingAmount,
    totalAmount: order.totalAmount,
    items: order.items.map((item) => ({
      id: item.id,
      name: item.productName,
      configuration: formatOrderItemConfiguration(item),
      imageUrl: item.imageUrl,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
    })),
  }));
  const addresses = sortAddresses(user.addresses).map(({ id, label, city, street, comment, isDefault }) => ({
    id,
    label,
    city,
    street,
    comment,
    isDefault,
  }));
  const favorites = favoriteRows.map(({ product }) => buildFavoriteCard(product));

  return {
    user: {
      name: user.name ?? '',
      email: user.email,
      phone: user.phone ?? '',
      birthdate: user.birthdate?.toISOString() ?? '',
      createdAt: user.createdAt.toISOString(),
      initials: initials(user.name, user.email),
    },
    stats: { orders: orders.length, favorites: favorites.length, addresses: addresses.length },
    orders,
    favorites,
    addresses,
  };
}
