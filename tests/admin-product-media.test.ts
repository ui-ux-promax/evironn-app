import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/cloudinary/server', () => ({ deleteAsset: vi.fn() }));
vi.mock('@/lib/prisma-client', () => {
  const prisma = {
    product: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    productRoom: { deleteMany: vi.fn(), createMany: vi.fn() },
    productOptionGroup: { deleteMany: vi.fn(), createMany: vi.fn() },
    productOptionValue: { deleteMany: vi.fn(), createMany: vi.fn() },
    optionGroup: { findMany: vi.fn() },
    optionValue: { findMany: vi.fn() },
    room: { findMany: vi.fn() },
    category: { findUnique: vi.fn() },
    sku: { findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn(), create: vi.fn(), delete: vi.fn() },
    skuOptionValue: { deleteMany: vi.fn(), createMany: vi.fn() },
    skuMedia: { findMany: vi.fn(), deleteMany: vi.fn(), createMany: vi.fn() },
    productMedia: { findMany: vi.fn(), deleteMany: vi.fn(), createMany: vi.fn() },
    wishlistItem: { count: vi.fn() },
    $transaction: vi.fn(),
  };
  return { prisma };
});

import { saveFurnitureProduct } from '@/app/actions/admin/products';
import { auth } from '@/auth';
import { deleteAsset } from '@/lib/cloudinary/server';
import { prisma } from '@/lib/prisma-client';

const authMock = auth as unknown as ReturnType<typeof vi.fn>;
const deleteAssetMock = deleteAsset as unknown as ReturnType<typeof vi.fn>;
type MockFn = ReturnType<typeof vi.fn>;
type MockedPrisma = {
  product: Record<string, MockFn>;
  productRoom: Record<string, MockFn>;
  productOptionGroup: Record<string, MockFn>;
  productOptionValue: Record<string, MockFn>;
  optionGroup: Record<string, MockFn>;
  optionValue: Record<string, MockFn>;
  room: Record<string, MockFn>;
  category: Record<string, MockFn>;
  sku: Record<string, MockFn>;
  skuOptionValue: Record<string, MockFn>;
  skuMedia: Record<string, MockFn>;
  productMedia: Record<string, MockFn>;
  wishlistItem: Record<string, MockFn>;
  $transaction: MockFn;
};
const p = prisma as unknown as MockedPrisma;

const productMedia = {
  id: 'pm1',
  kind: 'IMAGE' as const,
  url: 'https://res.cloudinary.com/demo/image/upload/evironn/products/chair',
  publicId: 'evironn/products/chair',
  alt: 'Chair',
  sortOrder: 0,
};
const skuMedia = {
  id: 'sm1',
  kind: 'IMAGE' as const,
  url: 'https://res.cloudinary.com/demo/image/upload/evironn/skus/chair-oak',
  publicId: 'evironn/skus/chair-oak',
  alt: 'Oak finish',
  sortOrder: 0,
};

const group = {
  id: 'og1',
  name: 'Material',
  slug: 'material',
  sortOrder: 0,
  values: [{ id: 'ov1', name: 'Oak', slug: 'oak', sortOrder: 0 }],
};

const draft = (overrides: Record<string, unknown> = {}) => ({
  id: 'pr1',
  name: 'Oak Chair',
  slug: 'oak-chair',
  brand: 'Evironn',
  categoryId: 'cat1',
  roomIds: ['living'],
  description: '',
  specs: [],
  isBestseller: false,
  active: true,
  sortOrder: 0,
  optionGroups: [group],
  skus: [
    {
      id: 'sku1',
      articleNumber: 'OAK-1',
      combinationKey: 'material=oak',
      selectedOptions: [{ groupSlug: 'material', valueSlug: 'oak' }],
      price: 20000,
      oldPrice: null,
      stock: 7,
      active: true,
      media: [skuMedia],
    },
  ],
  media: [productMedia],
  turntable: false,
  ...overrides,
});

const state = (overrides: Record<string, unknown> = {}) => ({
  id: 'pr1',
  gender: 'UNISEX',
  name: 'Oak Chair',
  slug: 'oak-chair',
  categoryId: 'cat1',
  category: { id: 'cat1', slug: 'living', turntableProductId: null },
  rooms: [{ roomId: 'room1', room: { id: 'room1', slug: 'living' } }],
  optionGroups: [
    { optionGroupId: 'og1', optionGroup: group, values: [{ optionValueId: 'ov1', optionValue: group.values[0] }] },
  ],
  skus: [
    {
      id: 'sku1',
      combinationKey: 'material=oak',
      articleNumber: 'OAK-1',
      price: 20000,
      oldPrice: null,
      stock: 7,
      active: true,
      selections: [{ optionGroupId: 'og1', optionValueId: 'ov1', optionGroup: group, optionValue: group.values[0] }],
      cartItems: [],
      orderItems: [],
      media: [skuMedia],
    },
  ],
  media: [productMedia],
  colorways: [],
  ...overrides,
});

function prepare(current = state()) {
  const prismaMock = p;
  prismaMock.product.findUnique.mockImplementation(async ({ where }: { where: Record<string, string> }) =>
    where.id ? current : null,
  );
  prismaMock.category.findUnique.mockResolvedValue(current.category);
  prismaMock.optionGroup.findMany.mockResolvedValue([group]);
  prismaMock.optionValue.findMany.mockResolvedValue([{ ...group.values[0], optionGroupId: 'og1' }]);
  prismaMock.room.findMany.mockResolvedValue([{ id: 'room1', slug: 'living' }]);
  prismaMock.sku.findFirst.mockResolvedValue(null);
  prismaMock.sku.findMany.mockImplementation(async (args: { select?: { selections?: unknown } }) =>
    args.select?.selections ? current.skus : [{ price: 20000, oldPrice: null }],
  );
  prismaMock.product.update.mockResolvedValue({ id: 'pr1' });
  prismaMock.sku.update.mockResolvedValue({ id: 'sku1' });
  prismaMock.skuMedia.findMany.mockImplementation(async (args: { where?: { publicId?: unknown } }) =>
    args.where?.publicId ? [] : current.skus.flatMap((sku: (typeof current.skus)[number]) => sku.media),
  );
  prismaMock.productMedia.findMany.mockImplementation(async (args: { where?: { publicId?: unknown } }) =>
    args.where?.publicId ? [] : current.media,
  );
  prismaMock.wishlistItem.count.mockResolvedValue(0);
}

beforeEach(() => {
  vi.clearAllMocks();
  authMock.mockResolvedValue({ user: { role: 'ADMIN' } });
  p.$transaction.mockImplementation(async (callback: (tx: typeof prisma) => unknown) => callback(prisma));
  prepare();
  deleteAssetMock.mockResolvedValue(undefined);
});

describe('canonical product and SKU media', () => {
  it('accepts Evironn product and SKU media and reconciles both owners', async () => {
    const result = await saveFurnitureProduct({ product: draft() });

    expect(result).toMatchObject({ ok: true, data: { productId: 'pr1' } });
    expect(p.productMedia.deleteMany).toHaveBeenCalledWith({ where: { productId: 'pr1' } });
    expect(p.productMedia.createMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({ productId: 'pr1', publicId: 'evironn/products/chair', sortOrder: 0 })],
    });
    expect(p.skuMedia.deleteMany).toHaveBeenCalledWith({ where: { skuId: 'sku1' } });
    expect(p.skuMedia.createMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({ skuId: 'sku1', publicId: 'evironn/skus/chair-oak', sortOrder: 0 })],
    });
  });

  it('refuses a foreign new public ID before any transaction write', async () => {
    const result = await saveFurnitureProduct({
      product: draft({ media: [{ ...productMedia, id: undefined, publicId: 'foreign/products/chair' }] }),
    });

    expect(result).toMatchObject({ ok: false, code: 'MEDIA_OWNERSHIP_REJECTED', details: { publicIdKind: 'foreign' } });
    expect(p.$transaction).not.toHaveBeenCalled();
    expect(p.product.update).not.toHaveBeenCalled();
  });

  it('refuses an unsafe new public ID before any transaction write', async () => {
    const result = await saveFurnitureProduct({
      product: draft({ media: [{ ...productMedia, id: undefined, publicId: '../unsafe' }] }),
    });

    expect(result).toMatchObject({ ok: false, code: 'MEDIA_OWNERSHIP_REJECTED', details: { publicIdKind: 'unsafe' } });
    expect(p.$transaction).not.toHaveBeenCalled();
  });

  it('accepts exact persisted legacy media but refuses changed legacy media', async () => {
    const legacy = { ...productMedia, publicId: 'ritm/products/chair' };
    const current = state({ media: [legacy] });
    prepare(current);

    const accepted = await saveFurnitureProduct({ product: draft({ media: [legacy] }) });
    expect(accepted).toMatchObject({ ok: true });

    vi.clearAllMocks();
    authMock.mockResolvedValue({ user: { role: 'ADMIN' } });
    p.$transaction.mockImplementation(async (callback: (tx: typeof prisma) => unknown) => callback(prisma));
    prepare(current);
    const refused = await saveFurnitureProduct({
      product: draft({ media: [{ ...legacy, id: undefined, publicId: 'ritm/products/other' }] }),
    });
    expect(refused).toMatchObject({ ok: false, code: 'MEDIA_OWNERSHIP_REJECTED', details: { publicIdKind: 'legacy' } });
  });

  it('destroys removed assets once after commit and returns warning on failure', async () => {
    const current = state({
      media: [{ ...productMedia, publicId: 'evironn/products/removed' }],
      skus: [{ ...state().skus[0], media: [{ ...skuMedia, publicId: 'evironn/skus/removed' }] }],
    });
    prepare(current);
    p.productMedia.findMany.mockImplementation(async (args: { where?: { publicId?: unknown } }) =>
      args.where?.publicId ? [] : current.media,
    );
    p.skuMedia.findMany.mockImplementation(async (args: { where?: { publicId?: unknown } }) =>
      args.where?.publicId ? [] : current.skus.flatMap((sku: (typeof current.skus)[number]) => sku.media),
    );
    deleteAssetMock.mockRejectedValueOnce(new Error('provider down')).mockResolvedValue(undefined);

    const result = await saveFurnitureProduct({
      product: draft({ media: [], skus: [{ ...draft().skus[0], media: [] }] }),
    });

    expect(p.$transaction.mock.invocationCallOrder[0]).toBeLessThan(deleteAssetMock.mock.invocationCallOrder[0]);
    expect(deleteAssetMock).toHaveBeenCalledTimes(2);
    expect(deleteAssetMock).toHaveBeenCalledWith('evironn/products/removed');
    expect(deleteAssetMock).toHaveBeenCalledWith('evironn/skus/removed');
    expect(result).toMatchObject({ ok: true, warnings: ['media-destroy-failed'] });
  });

  it('refuses a bound turntable product with incomplete final media without writes', async () => {
    prepare(state({ category: { id: 'cat1', slug: 'living', turntableProductId: 'pr1' } }));

    const result = await saveFurnitureProduct({ product: draft({ media: [] }) });

    expect(result).toMatchObject({ ok: false, code: 'TURNTABLE_MEDIA_REQUIRED' });
    expect(p.$transaction).not.toHaveBeenCalled();
    expect(p.product.update).not.toHaveBeenCalled();
  });
});
