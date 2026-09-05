import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/prisma-client', () => ({
  prisma: {
    wishlist: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    wishlistItem: { findMany: vi.fn(), count: vi.fn(), upsert: vi.fn() },
  },
}));

import { resolveOwnerWishlist, getWishlistProductIds, getWishlistCount, getWishlistItems } from '@/lib/wishlist';
import { mergeGuestWishlist } from '@/lib/wishlist-merge';
import { prisma } from '@/lib/prisma-client';
import { furnitureProductCardInclude } from '@/lib/furniture-product-summary';

const wlFindFirst = prisma.wishlist.findFirst as unknown as ReturnType<typeof vi.fn>;
const wlCreate = prisma.wishlist.create as unknown as ReturnType<typeof vi.fn>;
const wlUpdate = prisma.wishlist.update as unknown as ReturnType<typeof vi.fn>;
const wlDelete = prisma.wishlist.delete as unknown as ReturnType<typeof vi.fn>;
const itemFindMany = prisma.wishlistItem.findMany as unknown as ReturnType<typeof vi.fn>;
const itemCount = prisma.wishlistItem.count as unknown as ReturnType<typeof vi.fn>;
const itemUpsert = prisma.wishlistItem.upsert as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => vi.clearAllMocks());

describe('resolveOwnerWishlist', () => {
  it('залогинен → ищет по userId', async () => {
    wlFindFirst.mockResolvedValue({ id: 'w1', userId: 'u1', token: 't' });
    const w = await resolveOwnerWishlist({ user: { id: 'u1' } } as never, 'guest-tok', { create: false });
    expect(w).toEqual({ id: 'w1', userId: 'u1', token: 't' });
    expect(wlFindFirst).toHaveBeenCalledWith({ where: { userId: 'u1' } });
  });
  it('гость → ищет по token', async () => {
    wlFindFirst.mockResolvedValue({ id: 'w2', userId: null, token: 'tok' });
    const w = await resolveOwnerWishlist(null, 'tok', { create: false });
    expect(w?.id).toBe('w2');
    expect(wlFindFirst).toHaveBeenCalledWith({ where: { token: 'tok' } });
  });
  it('нет владельца и create:false → null, без create', async () => {
    wlFindFirst.mockResolvedValue(null);
    const w = await resolveOwnerWishlist(null, 'tok', { create: false });
    expect(w).toBeNull();
    expect(wlCreate).not.toHaveBeenCalled();
  });
  it('гость без записи и create:true → создаёт по token', async () => {
    wlFindFirst.mockResolvedValue(null);
    wlCreate.mockResolvedValue({ id: 'w3', userId: null, token: 'tok' });
    const w = await resolveOwnerWishlist(null, 'tok', { create: true });
    expect(w?.id).toBe('w3');
    expect(wlCreate).toHaveBeenCalledWith({ data: { token: 'tok', userId: undefined } });
  });
  it('гость при гонке создания → перечитывает уже созданный wishlist после P2002', async () => {
    const existing = { id: 'w4', userId: null, token: 'tok' };
    wlFindFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(existing);
    wlCreate.mockRejectedValueOnce({ code: 'P2002' });

    await expect(resolveOwnerWishlist(null, 'tok', { create: true })).resolves.toEqual(existing);
    expect(wlFindFirst).toHaveBeenNthCalledWith(2, { where: { token: 'tok' } });
  });
  it('гость без token и create:false → null, без запроса', async () => {
    const w = await resolveOwnerWishlist(null, undefined, { create: false });
    expect(w).toBeNull();
    expect(wlFindFirst).not.toHaveBeenCalled();
  });
});

describe('getWishlistProductIds', () => {
  it('нет владельца → пустой Set, без запроса items', async () => {
    wlFindFirst.mockResolvedValue(null);
    const ids = await getWishlistProductIds(null, undefined);
    expect(ids.size).toBe(0);
    expect(itemFindMany).not.toHaveBeenCalled();
  });
  it('есть владелец → Set productId', async () => {
    wlFindFirst.mockResolvedValue({ id: 'w1', userId: 'u1', token: 't' });
    itemFindMany.mockResolvedValue([{ productId: 'p1' }, { productId: 'p2' }]);
    const ids = await getWishlistProductIds({ user: { id: 'u1' } } as never, 't');
    expect([...ids].sort()).toEqual(['p1', 'p2']);
  });
});

describe('getWishlistItems', () => {
  it('uses the canonical furniture projection and filters inactive products', async () => {
    wlFindFirst.mockResolvedValue({ id: 'w1', userId: 'u1', token: 't' });
    itemFindMany.mockResolvedValue([]);

    expect(await getWishlistItems({ user: { id: 'u1' } } as never, 't')).toEqual([]);
    expect(itemFindMany).toHaveBeenCalledWith({
      where: { wishlistId: 'w1', product: { active: true } },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { product: { include: furnitureProductCardInclude } },
    });
  });
});

describe('getWishlistCount', () => {
  it('нет владельца → 0', async () => {
    wlFindFirst.mockResolvedValue(null);
    expect(await getWishlistCount(null, undefined)).toBe(0);
    expect(itemCount).not.toHaveBeenCalled();
  });
  it('есть владелец → count', async () => {
    wlFindFirst.mockResolvedValue({ id: 'w1', userId: 'u1', token: 't' });
    itemCount.mockResolvedValue(3);
    expect(await getWishlistCount({ user: { id: 'u1' } } as never, 't')).toBe(3);
    expect(itemCount).toHaveBeenCalledWith({ where: { wishlistId: 'w1', product: { active: true } } });
  });
});

describe('mergeGuestWishlist', () => {
  it('нет гостевого token → ничего', async () => {
    await mergeGuestWishlist(undefined, 'u1');
    expect(wlFindFirst).not.toHaveBeenCalled();
  });
  it('нет гостевой записи → ничего', async () => {
    wlFindFirst.mockResolvedValueOnce(null);
    await mergeGuestWishlist('tok', 'u1');
    expect(itemUpsert).not.toHaveBeenCalled();
  });
  it('у юзера нет wishlist → привязать гостевой к userId', async () => {
    wlFindFirst.mockResolvedValueOnce({ id: 'g1', token: 'tok', userId: null }).mockResolvedValueOnce(null);
    await mergeGuestWishlist('tok', 'u1');
    expect(wlUpdate).toHaveBeenCalledWith({ where: { id: 'g1' }, data: { userId: 'u1' } });
    expect(itemUpsert).not.toHaveBeenCalled();
  });
  it('у юзера есть wishlist → перенести items upsert + удалить гостевой', async () => {
    wlFindFirst
      .mockResolvedValueOnce({ id: 'g1', token: 'tok', userId: null })
      .mockResolvedValueOnce({ id: 'w1', token: 'ut', userId: 'u1' });
    itemFindMany.mockResolvedValueOnce([{ productId: 'p1' }, { productId: 'p2' }]);
    await mergeGuestWishlist('tok', 'u1');
    expect(itemUpsert).toHaveBeenCalledTimes(2);
    expect(itemUpsert).toHaveBeenCalledWith({
      where: { wishlistId_productId: { wishlistId: 'w1', productId: 'p1' } },
      create: { wishlistId: 'w1', productId: 'p1' },
      update: {},
    });
    expect(wlDelete).toHaveBeenCalledWith({ where: { id: 'g1' } });
  });
  it('гостевой wishlist уже принадлежит userId → no-op привязки', async () => {
    wlFindFirst.mockResolvedValueOnce({ id: 'g1', token: 'tok', userId: 'u1' });
    await mergeGuestWishlist('tok', 'u1');
    expect(wlUpdate).not.toHaveBeenCalled();
    expect(itemUpsert).not.toHaveBeenCalled();
  });
  it('анти-кража: токен принадлежит ДРУГОМУ userId → no-op (чужое избранное не перепривязываем)', async () => {
    wlFindFirst.mockResolvedValueOnce({ id: 'g1', token: 'tok', userId: 'other' });
    await mergeGuestWishlist('tok', 'u1');
    expect(wlUpdate).not.toHaveBeenCalled();
    expect(itemUpsert).not.toHaveBeenCalled();
    expect(wlDelete).not.toHaveBeenCalled();
  });
});
