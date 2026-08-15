import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma-client', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    wishlistItem: { findMany: vi.fn() },
  },
}));

import { getProfilePageDto } from '@/lib/profile-page';
import { prisma } from '@/lib/prisma-client';

const findUser = prisma.user.findUnique as unknown as ReturnType<typeof vi.fn>;
const findFavorites = prisma.wishlistItem.findMany as unknown as ReturnType<typeof vi.fn>;

const createdAt = new Date('2026-08-01T10:00:00.000Z');

function favoriteProduct() {
  return {
    id: 'product-1',
    name: 'Noma',
    slug: 'noma',
    brand: 'Evironn',
    active: true,
    createdAt,
    isBestseller: true,
    category: { name: 'Кресла', slug: 'chairs' },
    media: [{ url: '/product.jpg', alt: 'Noma', sortOrder: 0 }],
    skus: [
      {
        id: 'sku-1',
        price: 90000,
        oldPrice: 100000,
        stock: 2,
        active: true,
        media: [],
        selections: [],
      },
    ],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  findUser.mockResolvedValue({
    id: 'u1',
    name: 'Анна Иванова',
    email: 'anna@example.com',
    phone: ' +7 999 ',
    birthdate: new Date('1990-05-01T00:00:00.000Z'),
    createdAt,
    role: 'CUSTOMER',
    orders: [
      {
        id: 'order-1',
        orderNumber: 42,
        status: 'DELIVERED',
        createdAt,
        shippingMethod: 'courier',
        city: 'Москва',
        addressLine: 'ул. Ленина, 1',
        itemsTotal: 100000,
        discountAmount: 0,
        shippingAmount: 0,
        totalAmount: 100000,
        items: [
          {
            id: 'line-1',
            productName: 'Снимок Noma',
            configuration: [
              { groupName: 'Отделка', valueName: 'Дуб' },
              { groupName: 'Обивка', valueName: 'Кремовая букле' },
            ],
            imageUrl: '/snapshot.jpg',
            unitPrice: 100000,
            quantity: 1,
            lineTotal: 100000,
            colorwayName: null,
            size: null,
            canonicalSku: { id: 'sku-1', product: { name: 'Live changed Noma' } },
            productVariant: null,
          },
          {
            id: 'line-2',
            productName: 'Legacy snapshot',
            configuration: null,
            imageUrl: null,
            unitPrice: 12000,
            quantity: 2,
            lineTotal: 24000,
            colorwayName: 'Black',
            size: 'M',
            canonicalSku: null,
            productVariant: { id: 'legacy-1' },
          },
        ],
      },
    ],
    addresses: [
      {
        id: 'address-old',
        label: 'Старая',
        city: 'Москва',
        street: 'Старая, 1',
        comment: null,
        isDefault: false,
        createdAt: new Date('2026-07-01T00:00:00.000Z'),
      },
      {
        id: 'address-default',
        label: 'Дом',
        city: 'Москва',
        street: 'Новая, 2',
        comment: 'Позвонить',
        isDefault: true,
        createdAt: new Date('2026-08-01T00:00:00.000Z'),
      },
    ],
  });
  findFavorites.mockResolvedValue([{ product: favoriteProduct() }]);
});

describe('getProfilePageDto', () => {
  it('reads only the requested owner through bounded selects and returns serializable profile data', async () => {
    const dto = await getProfilePageDto('u1');

    expect(findUser).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'u1' }, select: expect.any(Object) }));
    const select = findUser.mock.calls[0][0].select;
    expect(select).toMatchObject({
      id: true,
      email: true,
      name: true,
      phone: true,
      birthdate: true,
      createdAt: true,
      orders: expect.any(Object),
      addresses: expect.any(Object),
    });
    expect(JSON.stringify(select)).not.toMatch(/passwordHash|role|payment|bonus|notification/i);
    expect(findFavorites).toHaveBeenCalledWith(
      expect.objectContaining({ where: { wishlist: { userId: 'u1' }, product: { active: true } } }),
    );
    expect(dto.user).toMatchObject({
      name: 'Анна Иванова',
      email: 'anna@example.com',
      phone: ' +7 999 ',
      birthdate: '1990-05-01T00:00:00.000Z',
      createdAt: '2026-08-01T10:00:00.000Z',
      initials: 'АИ',
    });
    expect(dto.stats).toEqual({ orders: 1, favorites: 1, addresses: 2 });
    expect(dto.addresses.map((address) => address.id)).toEqual(['address-default', 'address-old']);
    expect(dto.orders[0].createdAt).toBe('2026-08-01T10:00:00.000Z');
    expect(dto.orders[0].items[0]).toMatchObject({
      id: 'line-1',
      name: 'Снимок Noma',
      configuration: 'Отделка: Дуб · Обивка: Кремовая букле',
      imageUrl: '/snapshot.jpg',
      unitPrice: 100000,
      quantity: 1,
      lineTotal: 100000,
    });
    expect(dto.orders[0].items[1].configuration).toBe('Black · Размер M');
    expect(dto.favorites[0]).toMatchObject({ id: 'product-1', primarySkuId: 'sku-1', href: expect.any(String) });
    expect(JSON.stringify(dto)).not.toMatch(/payment|bonus|notification/i);
  });

  it('does not let a live SKU or legacy variant replace immutable order snapshots', async () => {
    const dto = await getProfilePageDto('u1');

    expect(dto.orders[0].items[0].name).toBe('Снимок Noma');
    expect(dto.orders[0].items[1].name).toBe('Legacy snapshot');
    expect(dto.orders[0].items[1].imageUrl).toBeNull();
  });

  it('rejects an empty owner id without reading another user', async () => {
    await expect(getProfilePageDto('')).rejects.toThrow('Не авторизован');
    expect(findUser).not.toHaveBeenCalled();
    expect(findFavorites).not.toHaveBeenCalled();
  });
});
