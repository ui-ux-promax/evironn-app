import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/prisma-client', () => ({
  prisma: {
    sku: {
      updateMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma-client';
import { setSkuStock } from '@/app/actions/admin/stock';

const authMock = auth as unknown as ReturnType<typeof vi.fn>;
const revalidateMock = revalidatePath as unknown as ReturnType<typeof vi.fn>;
const skuUpdateManyMock = prisma.sku.updateMany as unknown as ReturnType<typeof vi.fn>;
const skuFindUniqueMock = prisma.sku.findUnique as unknown as ReturnType<typeof vi.fn>;

const validInput = { skuId: 'sku-1', expectedStock: 4, nextStock: 7 };

beforeEach(() => {
  vi.clearAllMocks();
  authMock.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
  skuUpdateManyMock.mockResolvedValue({ count: 1 });
  skuFindUniqueMock.mockResolvedValue({ stock: 4 });
});

describe('setSkuStock', () => {
  it.each([
    ['anonymous', null],
    ['customer', { user: { id: 'customer-1', role: 'CUSTOMER' } }],
  ])('refuses %s before any stock read or write', async (_label, session) => {
    authMock.mockResolvedValue(session);

    const result = await setSkuStock(validInput);

    expect(result).toMatchObject({ ok: false });
    expect(skuUpdateManyMock).not.toHaveBeenCalled();
    expect(skuFindUniqueMock).not.toHaveBeenCalled();
    expect(revalidateMock).not.toHaveBeenCalled();
  });

  it.each([
    ['missing skuId', { expectedStock: 4, nextStock: 7 }],
    ['empty skuId', { skuId: '  ', expectedStock: 4, nextStock: 7 }],
    ['fractional expectedStock', { skuId: 'sku-1', expectedStock: 1.5, nextStock: 7 }],
    ['negative expectedStock', { skuId: 'sku-1', expectedStock: -1, nextStock: 7 }],
    ['fractional nextStock', { skuId: 'sku-1', expectedStock: 4, nextStock: 1.5 }],
    ['negative nextStock', { skuId: 'sku-1', expectedStock: 4, nextStock: -1 }],
    ['unknown field', { ...validInput, extra: true }],
  ])('refuses malformed DTO: %s before any stock read or write', async (_label, input) => {
    const result = await setSkuStock(input);

    expect(result).toMatchObject({ ok: false, code: 'VALIDATION_ERROR' });
    expect(skuUpdateManyMock).not.toHaveBeenCalled();
    expect(skuFindUniqueMock).not.toHaveBeenCalled();
    expect(revalidateMock).not.toHaveBeenCalled();
  });

  it('updates only the expected current stock and revalidates stock and product catalog', async () => {
    const result = await setSkuStock(validInput);

    expect(result).toEqual({ ok: true, data: { skuId: 'sku-1', stock: 7 } });
    expect(skuUpdateManyMock).toHaveBeenCalledWith({
      where: { id: 'sku-1', stock: 4 },
      data: { stock: 7 },
    });
    expect(skuFindUniqueMock).not.toHaveBeenCalled();
    expect(revalidateMock).toHaveBeenNthCalledWith(1, '/admin/catalog/stock');
    expect(revalidateMock).toHaveBeenNthCalledWith(2, '/admin/catalog/products');
  });

  it('returns STALE_VALUE with current stock when expected stock no longer matches', async () => {
    skuUpdateManyMock.mockResolvedValue({ count: 0 });
    skuFindUniqueMock.mockResolvedValue({ stock: 2 });

    const result = await setSkuStock(validInput);

    expect(result).toMatchObject({ ok: false, code: 'STALE_VALUE', details: { currentStock: 2 } });
    expect(skuFindUniqueMock).toHaveBeenCalledWith({ where: { id: 'sku-1' }, select: { stock: true } });
    expect(revalidateMock).not.toHaveBeenCalled();
  });

  it('returns NOT_FOUND when guarded update loses because SKU is absent', async () => {
    skuUpdateManyMock.mockResolvedValue({ count: 0 });
    skuFindUniqueMock.mockResolvedValue(null);

    const result = await setSkuStock(validInput);

    expect(result).toMatchObject({ ok: false, code: 'NOT_FOUND' });
    expect(revalidateMock).not.toHaveBeenCalled();
  });
});
