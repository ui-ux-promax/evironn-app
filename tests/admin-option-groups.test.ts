import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/prisma-client', () => ({
  prisma: {
    optionGroup: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    optionValue: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), deleteMany: vi.fn() },
    productOptionGroup: { count: vi.fn() },
    productOptionValue: { count: vi.fn() },
    skuOptionValue: { count: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma-client';
import { deleteOptionGroup, reorderOptionGroups, saveOptionGroup } from '@/app/actions/admin/option-groups';

const authMock = auth as unknown as ReturnType<typeof vi.fn>;
const revalidateMock = revalidatePath as unknown as ReturnType<typeof vi.fn>;
const p = prisma as unknown as {
  optionGroup: Record<string, ReturnType<typeof vi.fn>>;
  optionValue: Record<string, ReturnType<typeof vi.fn>>;
  productOptionGroup: Record<string, ReturnType<typeof vi.fn>>;
  productOptionValue: Record<string, ReturnType<typeof vi.fn>>;
  skuOptionValue: Record<string, ReturnType<typeof vi.fn>>;
  $transaction: ReturnType<typeof vi.fn>;
};

const groupInput = {
  name: 'Отделка',
  slug: 'finish',
  sortOrder: 0,
  values: [{ name: 'Дуб', slug: 'oak', swatchHex: '#AA7733', sortOrder: 0 }],
};

beforeEach(() => {
  vi.clearAllMocks();
  authMock.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
  p.optionGroup.findFirst.mockResolvedValue(null);
  p.optionGroup.findUnique.mockResolvedValue(null);
  p.optionValue.findFirst.mockResolvedValue(null);
  p.optionValue.findMany.mockResolvedValue([]);
  p.productOptionGroup.count.mockResolvedValue(0);
  p.productOptionValue.count.mockResolvedValue(0);
  p.skuOptionValue.count.mockResolvedValue(0);
  p.$transaction.mockImplementation(async (callback: (tx: typeof p) => unknown) => callback(p));
  p.optionGroup.create.mockResolvedValue({ id: 'group-1' });
  p.optionGroup.update.mockResolvedValue({ id: 'group-1' });
  p.optionValue.create.mockResolvedValue({ id: 'value-1' });
  p.optionValue.update.mockResolvedValue({ id: 'value-1' });
  p.optionValue.deleteMany.mockResolvedValue({ count: 0 });
});

describe('option-group admin actions', () => {
  it('returns before Prisma for a non-admin', async () => {
    authMock.mockResolvedValue({ user: { id: 'customer-1', role: 'CUSTOMER' } });

    const result = await saveOptionGroup(groupInput);

    expect(result).toMatchObject({ ok: false, error: 'Доступ запрещён' });
    expect(p.optionGroup.findFirst).not.toHaveBeenCalled();
    expect(p.$transaction).not.toHaveBeenCalled();
  });

  it('parses before uniqueness reads and writes', async () => {
    const result = await saveOptionGroup({ ...groupInput, slug: 'not kebab' });

    expect(result).toMatchObject({ ok: false, code: 'VALIDATION_ERROR' });
    expect(p.optionGroup.findFirst).not.toHaveBeenCalled();
    expect(p.$transaction).not.toHaveBeenCalled();
  });

  it('creates a group and values transactionally, then revalidates both catalog routes', async () => {
    const result = await saveOptionGroup(groupInput);

    expect(result).toEqual({ ok: true, data: { id: 'group-1' } });
    expect(p.optionGroup.create).toHaveBeenCalledWith({
      data: { name: 'Отделка', slug: 'finish', sortOrder: 0 },
    });
    expect(p.optionValue.create).toHaveBeenCalledWith({
      data: { optionGroupId: 'group-1', name: 'Дуб', slug: 'oak', swatchHex: '#AA7733', sortOrder: 0 },
    });
    expect(revalidateMock).toHaveBeenNthCalledWith(1, '/admin/catalog/options');
    expect(revalidateMock).toHaveBeenNthCalledWith(2, '/admin/catalog/products');
  });

  it('refuses a referenced group with typed reference counts and performs no writes', async () => {
    p.optionGroup.findUnique.mockResolvedValue({ id: 'group-1', _count: { products: 2 } });
    p.productOptionGroup.count.mockResolvedValue(2);
    p.skuOptionValue.count.mockResolvedValue(3);

    const result = await deleteOptionGroup({ id: 'group-1' });

    expect(result).toEqual({
      ok: false,
      code: 'OPTION_GROUP_IN_USE',
      error: 'Группа используется',
      message: 'Группа используется',
      details: { referencedBy: ['products:2', 'skuSelections:3'] },
    });
    expect(p.optionGroup.delete).not.toHaveBeenCalled();
    expect(p.$transaction).not.toHaveBeenCalled();
  });

  it('refuses a referenced value during group save, preserving strict global deletion semantics', async () => {
    p.optionGroup.findUnique.mockResolvedValue({ id: 'group-1' });
    p.optionValue.findMany.mockResolvedValue([
      { id: 'value-old', slug: 'old', name: 'Old', swatchHex: null, sortOrder: 0 },
    ]);
    p.productOptionValue.count.mockResolvedValue(1);

    const result = await saveOptionGroup({ ...groupInput, id: 'group-1' });

    expect(result).toMatchObject({ ok: false, code: 'OPTION_VALUE_IN_USE' });
    expect(p.$transaction).not.toHaveBeenCalled();
  });

  it('reorders groups in a transaction and revalidates both catalog routes', async () => {
    p.optionGroup.findMany.mockResolvedValue([{ id: 'group-1' }, { id: 'group-2' }]);

    const result = await reorderOptionGroups({ ids: ['group-2', 'group-1'] });

    expect(result).toEqual({ ok: true, data: null });
    expect(p.optionGroup.update).toHaveBeenCalledTimes(2);
    expect(p.optionGroup.update).toHaveBeenNthCalledWith(1, { where: { id: 'group-2' }, data: { sortOrder: 0 } });
    expect(p.optionGroup.update).toHaveBeenNthCalledWith(2, { where: { id: 'group-1' }, data: { sortOrder: 1 } });
    expect(revalidateMock).toHaveBeenCalledWith('/admin/catalog/options');
    expect(revalidateMock).toHaveBeenCalledWith('/admin/catalog/products');
  });
});
