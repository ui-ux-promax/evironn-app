import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma-client', () => ({
  prisma: {
    address: {
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma-client';
import { addAddress, deleteAddress, setDefaultAddress } from '@/app/actions/address';

const authMock = auth as unknown as ReturnType<typeof vi.fn>;
const address = prisma.address as unknown as Record<string, ReturnType<typeof vi.fn>>;
const transaction = prisma.$transaction as unknown as ReturnType<typeof vi.fn>;

const addressRow = (id: string, createdAt: string, isDefault: boolean) => ({
  id,
  userId: 'u1',
  label: id,
  city: 'Москва',
  street: id,
  comment: null,
  isDefault,
  createdAt: new Date(createdAt),
});

beforeEach(() => {
  vi.clearAllMocks();
  authMock.mockResolvedValue({ user: { id: 'u1' } });
  address.findMany.mockResolvedValue([]);
  address.create.mockResolvedValue({ id: 'new-address' });
  address.delete.mockResolvedValue({ id: 'address-1' });
  address.update.mockResolvedValue({ id: 'address-1' });
  address.updateMany.mockResolvedValue({ count: 1 });
  transaction.mockImplementation(async (callback: (tx: unknown) => unknown) => callback({ address }));
});

describe('address actions', () => {
  it('rejects unauthenticated mutations', async () => {
    authMock.mockResolvedValue(null);

    await expect(addAddress({ city: 'Москва', street: 'Ленина, 1' })).resolves.toEqual({
      ok: false,
      error: 'Не авторизован',
    });
    await expect(deleteAddress('address-1')).resolves.toEqual({ ok: false, error: 'Не авторизован' });
    await expect(setDefaultAddress('address-1')).resolves.toEqual({ ok: false, error: 'Не авторизован' });
    expect(transaction).not.toHaveBeenCalled();
  });

  it('makes the first owned address the default inside a serializable transaction', async () => {
    const result = await addAddress({ label: ' Дом ', city: ' Москва ', street: ' Ленина, 1 ' });

    expect(result).toEqual({ ok: true, id: 'new-address' });
    expect(transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: 'Serializable' });
    expect(address.create).toHaveBeenCalledWith({
      data: { userId: 'u1', label: 'Дом', city: 'Москва', street: 'Ленина, 1', comment: null, isDefault: true },
      select: { id: true },
    });
  });

  it('clears other owned defaults atomically when setting a default', async () => {
    address.findMany.mockResolvedValue([
      addressRow('address-1', '2026-01-01T00:00:00.000Z', false),
      addressRow('address-2', '2026-02-01T00:00:00.000Z', true),
    ]);

    await expect(setDefaultAddress('address-1')).resolves.toEqual({ ok: true });
    expect(address.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'u1' } }));
    expect(address.updateMany).toHaveBeenCalledWith({
      where: { userId: 'u1', isDefault: true },
      data: { isDefault: false },
    });
    expect(address.update).toHaveBeenCalledWith({ where: { id: 'address-1' }, data: { isDefault: true } });
  });

  it('rejects a foreign address and never mutates it', async () => {
    address.findMany.mockResolvedValue([addressRow('owned', '2026-01-01T00:00:00.000Z', true)]);

    await expect(setDefaultAddress('foreign')).resolves.toEqual({ ok: false, error: 'Адрес не найден' });
    expect(address.update).not.toHaveBeenCalled();
    expect(address.updateMany).not.toHaveBeenCalled();
  });

  it('deletes the default and promotes the oldest remaining owned address', async () => {
    address.findMany.mockResolvedValue([
      addressRow('oldest', '2026-01-01T00:00:00.000Z', false),
      addressRow('default', '2026-02-01T00:00:00.000Z', true),
      addressRow('newest', '2026-03-01T00:00:00.000Z', false),
    ]);

    await expect(deleteAddress('default')).resolves.toEqual({ ok: true });
    expect(address.delete).toHaveBeenCalledWith({ where: { id: 'default' } });
    expect(address.update).toHaveBeenCalledWith({ where: { id: 'oldest' }, data: { isDefault: true } });
  });

  it('rereads owned addresses on bounded P2034 retry and returns stable conflict after exhaustion', async () => {
    address.findMany.mockResolvedValue([addressRow('address-1', '2026-01-01T00:00:00.000Z', false)]);
    transaction.mockImplementation(async (callback: (tx: unknown) => unknown) => {
      await callback({ address });
      throw { code: 'P2034' };
    });

    await expect(setDefaultAddress('address-1')).resolves.toEqual({ ok: false, error: 'Не удалось обновить адреса' });
    expect(transaction).toHaveBeenCalledTimes(3);
    expect(address.findMany).toHaveBeenCalledTimes(3);
  });
});
