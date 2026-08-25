import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/cloudinary/server', () => ({ deleteAsset: vi.fn() }));
vi.mock('@/lib/prisma-client', () => ({
  prisma: {
    category: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    product: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { setCategoryTurntable } from '@/app/actions/admin/categories';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma-client';

const authMock = auth as unknown as ReturnType<typeof vi.fn>;
const categoryFindUnique = prisma.category.findUnique as unknown as ReturnType<typeof vi.fn>;
const categoryUpdate = prisma.category.update as unknown as ReturnType<typeof vi.fn>;
const productFindUnique = prisma.product.findUnique as unknown as ReturnType<typeof vi.fn>;
const transaction = prisma.$transaction as unknown as ReturnType<typeof vi.fn>;
const revalidatePathMock = revalidatePath as unknown as ReturnType<typeof vi.fn>;

const turntableMedia = [{ kind: 'TURN_TABLE_VIDEO' }, { kind: 'TURN_TABLE_POSTER' }, { kind: 'TURN_TABLE_FALLBACK' }];

function mockCategory(
  category: Record<string, unknown> | null = { id: 'c1', name: 'Living room', slug: 'living-room' },
) {
  categoryFindUnique.mockResolvedValueOnce(category);
}

function mockProduct(media: { kind: string }[] = turntableMedia) {
  productFindUnique.mockResolvedValueOnce({ id: 'p1', media });
}

function mockTransaction() {
  transaction.mockImplementation(async (operations: unknown) => operations);
}

beforeEach(() => {
  vi.clearAllMocks();
  authMock.mockResolvedValue({ user: { role: 'ADMIN' } });
  categoryUpdate.mockResolvedValue({ id: 'c1' });
  mockTransaction();
});

describe('setCategoryTurntable', () => {
  it('binds a product with exactly one video, poster and fallback', async () => {
    mockCategory();
    mockProduct();
    categoryFindUnique.mockResolvedValueOnce(null);

    const result = await setCategoryTurntable({ categoryId: 'c1', productId: 'p1' });

    expect(result).toEqual({ ok: true, data: { categoryId: 'c1', productId: 'p1' } });
    expect(categoryUpdate).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data: { turntableProductId: 'p1' },
    });
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(revalidatePathMock).toHaveBeenNthCalledWith(1, '/admin/catalog/categories');
    expect(revalidatePathMock).toHaveBeenNthCalledWith(2, '/admin/catalog/categories/c1/edit');
  });

  it('explicitly unbinds a category when productId is null', async () => {
    mockCategory();

    const result = await setCategoryTurntable({ categoryId: 'c1', productId: null });

    expect(result).toEqual({ ok: true, data: { categoryId: 'c1', productId: null } });
    expect(categoryUpdate).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data: { turntableProductId: null },
    });
    expect(productFindUnique).not.toHaveBeenCalled();
    expect(revalidatePathMock).toHaveBeenCalledWith('/admin/catalog/categories/c1/edit');
  });

  it('rejects malformed input before any read', async () => {
    const result = await setCategoryTurntable({ categoryId: 'c1', productId: 'p1', extra: true });

    expect(result).toMatchObject({ ok: false, code: 'VALIDATION_ERROR' });
    expect(categoryFindUnique).not.toHaveBeenCalled();
    expect(productFindUnique).not.toHaveBeenCalled();
    expect(categoryUpdate).not.toHaveBeenCalled();
  });

  it('returns NOT_FOUND when category does not exist', async () => {
    mockCategory(null);

    const result = await setCategoryTurntable({ categoryId: 'missing', productId: 'p1' });

    expect(result).toMatchObject({ ok: false, code: 'NOT_FOUND' });
    expect(productFindUnique).not.toHaveBeenCalled();
    expect(categoryUpdate).not.toHaveBeenCalled();
  });

  it('returns NOT_FOUND when product does not exist', async () => {
    mockCategory();
    productFindUnique.mockResolvedValueOnce(null);

    const result = await setCategoryTurntable({ categoryId: 'c1', productId: 'missing' });

    expect(result).toMatchObject({ ok: false, code: 'NOT_FOUND' });
    expect(categoryUpdate).not.toHaveBeenCalled();
  });

  it.each([
    ['missing', [{ kind: 'TURN_TABLE_VIDEO' }, { kind: 'TURN_TABLE_POSTER' }]],
    ['duplicate', [...turntableMedia, { kind: 'TURN_TABLE_VIDEO' }]],
  ])('rejects %s turntable media cardinality', async (_label, media) => {
    mockCategory();
    mockProduct(media);

    const result = await setCategoryTurntable({ categoryId: 'c1', productId: 'p1' });

    expect(result).toMatchObject({ ok: false, code: 'TURNTABLE_MEDIA_REQUIRED' });
    expect(categoryUpdate).not.toHaveBeenCalled();
    expect(transaction).not.toHaveBeenCalled();
  });

  it('returns the current holder identity on binding conflict', async () => {
    mockCategory();
    mockProduct();
    categoryFindUnique.mockResolvedValueOnce({ id: 'c2', name: 'Bedroom', slug: 'bedroom' });

    const result = await setCategoryTurntable({ categoryId: 'c1', productId: 'p1' });

    expect(result).toEqual({
      ok: false,
      code: 'TURNTABLE_BINDING_CONFLICT',
      message: expect.any(String),
      error: expect.any(String),
      details: {
        holderCategoryId: 'c2',
        holderCategoryName: 'Bedroom',
        holderCategorySlug: 'bedroom',
      },
    });
    expect(categoryUpdate).not.toHaveBeenCalled();
    expect(transaction).not.toHaveBeenCalled();
  });

  it('guards before validation and all Prisma reads', async () => {
    authMock.mockResolvedValue({ user: { role: 'CUSTOMER' } });

    const result = await setCategoryTurntable({ categoryId: 'c1', productId: 'p1' });

    expect(result).toMatchObject({ ok: false });
    expect(categoryFindUnique).not.toHaveBeenCalled();
    expect(productFindUnique).not.toHaveBeenCalled();
    expect(categoryUpdate).not.toHaveBeenCalled();
    expect(transaction).not.toHaveBeenCalled();
  });
});
