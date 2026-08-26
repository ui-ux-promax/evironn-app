import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/prisma-client', () => ({
  prisma: {
    room: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    productRoom: { count: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma-client';
import { deleteRoom, reorderRooms, saveRoom } from '@/app/actions/admin/rooms';

const authMock = auth as unknown as ReturnType<typeof vi.fn>;
const revalidateMock = revalidatePath as unknown as ReturnType<typeof vi.fn>;
const p = prisma as unknown as {
  room: Record<string, ReturnType<typeof vi.fn>>;
  productRoom: Record<string, ReturnType<typeof vi.fn>>;
  $transaction: ReturnType<typeof vi.fn>;
};

const roomInput = { name: 'Гостиная', slug: 'living-room', sortOrder: 4 };

beforeEach(() => {
  vi.clearAllMocks();
  authMock.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
  p.room.findFirst.mockResolvedValue(null);
  p.room.findUnique.mockResolvedValue({ id: 'room-1' });
  p.room.findMany.mockResolvedValue([{ id: 'room-1' }, { id: 'room-2' }]);
  p.room.upsert.mockResolvedValue({ id: 'room-1' });
  p.room.update.mockResolvedValue({ id: 'room-1' });
  p.room.delete.mockResolvedValue({ id: 'room-1' });
  p.productRoom.count.mockResolvedValue(0);
  p.$transaction.mockImplementation(async (callback: (tx: typeof p) => unknown) => callback(p));
});

describe('room admin actions', () => {
  it('returns before Prisma for a non-admin', async () => {
    authMock.mockResolvedValue({ user: { id: 'customer-1', role: 'CUSTOMER' } });

    const result = await saveRoom(roomInput);

    expect(result).toMatchObject({ ok: false, error: 'Доступ запрещён' });
    expect(p.room.findFirst).not.toHaveBeenCalled();
    expect(p.$transaction).not.toHaveBeenCalled();
  });

  it('parses before slug uniqueness reads and writes', async () => {
    const result = await saveRoom({ ...roomInput, slug: 'living room' });

    expect(result).toMatchObject({ ok: false, code: 'VALIDATION_ERROR' });
    expect(p.room.findFirst).not.toHaveBeenCalled();
    expect(p.$transaction).not.toHaveBeenCalled();
  });

  it('refuses a duplicate slug before the transaction', async () => {
    p.room.findFirst.mockResolvedValue({ id: 'other-room' });

    const result = await saveRoom(roomInput);

    expect(result).toMatchObject({ ok: false, code: 'SLUG_TAKEN' });
    expect(p.$transaction).not.toHaveBeenCalled();
  });

  it('upserts and normalizes contiguous ordering, then revalidates rooms and products', async () => {
    p.room.findMany.mockResolvedValue([{ id: 'room-2' }, { id: 'room-1' }, { id: 'room-3' }]);

    const result = await saveRoom(roomInput);

    expect(result).toEqual({ ok: true, data: { id: 'room-1' } });
    expect(p.room.upsert).toHaveBeenCalledWith({
      where: { id: '' },
      create: { name: 'Гостиная', slug: 'living-room', sortOrder: 4 },
      update: { name: 'Гостиная', slug: 'living-room', sortOrder: 4 },
      select: { id: true },
    });
    expect(p.room.update).toHaveBeenCalledTimes(3);
    expect(p.room.update).toHaveBeenNthCalledWith(1, { where: { id: 'room-2' }, data: { sortOrder: 0 } });
    expect(p.room.update).toHaveBeenNthCalledWith(2, { where: { id: 'room-1' }, data: { sortOrder: 1 } });
    expect(p.room.update).toHaveBeenNthCalledWith(3, { where: { id: 'room-3' }, data: { sortOrder: 2 } });
    expect(revalidateMock).toHaveBeenNthCalledWith(1, '/admin/catalog/rooms');
    expect(revalidateMock).toHaveBeenNthCalledWith(2, '/admin/catalog/products');
  });

  it('refuses deleting a room with products and reports the count without writing', async () => {
    p.productRoom.count.mockResolvedValue(3);

    const result = await deleteRoom({ id: 'room-1' });

    expect(result).toEqual({
      ok: false,
      code: 'ROOM_HAS_PRODUCTS',
      message: 'Комната используется товарами',
      error: 'Комната используется товарами',
      details: { productCount: 3 },
    });
    expect(p.room.delete).not.toHaveBeenCalled();
    expect(p.$transaction).not.toHaveBeenCalled();
  });

  it('deletes an unreferenced room transactionally and revalidates both catalog routes', async () => {
    const result = await deleteRoom({ id: 'room-1' });

    expect(result).toEqual({ ok: true, data: null });
    expect(p.room.delete).toHaveBeenCalledWith({ where: { id: 'room-1' } });
    expect(revalidateMock).toHaveBeenCalledWith('/admin/catalog/rooms');
    expect(revalidateMock).toHaveBeenCalledWith('/admin/catalog/products');
  });

  it('reorders every room to contiguous sortOrder values', async () => {
    p.room.findMany.mockResolvedValue([{ id: 'room-1' }, { id: 'room-2' }]);

    const result = await reorderRooms({ ids: ['room-2', 'room-1'] });

    expect(result).toEqual({ ok: true, data: null });
    expect(p.room.update).toHaveBeenNthCalledWith(1, { where: { id: 'room-2' }, data: { sortOrder: 0 } });
    expect(p.room.update).toHaveBeenNthCalledWith(2, { where: { id: 'room-1' }, data: { sortOrder: 1 } });
    expect(revalidateMock).toHaveBeenCalledWith('/admin/catalog/rooms');
    expect(revalidateMock).toHaveBeenCalledWith('/admin/catalog/products');
  });
});
