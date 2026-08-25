import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/cloudinary/server', () => ({ deleteAsset: vi.fn() }));
vi.mock('@/lib/prisma-client', () => {
  const prisma = {
    product: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    productColorway: { create: vi.fn(), update: vi.fn(), deleteMany: vi.fn() },
    productImage: { deleteMany: vi.fn(), createMany: vi.fn() },
    productVariant: { create: vi.fn(), update: vi.fn(), deleteMany: vi.fn() },
    orderItem: { findMany: vi.fn() },
    productRoom: { findMany: vi.fn(), deleteMany: vi.fn(), createMany: vi.fn() },
    productOptionGroup: { findMany: vi.fn(), deleteMany: vi.fn(), createMany: vi.fn() },
    productOptionValue: { findMany: vi.fn(), deleteMany: vi.fn(), createMany: vi.fn() },
    optionGroup: { findMany: vi.fn() },
    optionValue: { findMany: vi.fn() },
    room: { findMany: vi.fn() },
    sku: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    skuOptionValue: { findMany: vi.fn(), deleteMany: vi.fn(), createMany: vi.fn() },
    skuMedia: { findMany: vi.fn(), deleteMany: vi.fn() },
    productMedia: { findMany: vi.fn(), deleteMany: vi.fn() },
    category: { findUnique: vi.fn(), findFirst: vi.fn() },
    wishlistItem: { count: vi.fn() },
    $transaction: vi.fn(),
  };
  return { prisma };
});

import {
  createProduct,
  updateProduct,
  deleteProduct,
  deleteFurnitureProduct,
  saveFurnitureProduct,
  setProductActive,
} from '@/app/actions/admin/products';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma-client';
import { deleteAsset } from '@/lib/cloudinary/server';

const authMock = auth as unknown as ReturnType<typeof vi.fn>;
const deleteAssetMock = deleteAsset as unknown as ReturnType<typeof vi.fn>;
const p = prisma as unknown as {
  product: Record<string, ReturnType<typeof vi.fn>>;
  productColorway: Record<string, ReturnType<typeof vi.fn>>;
  productImage: Record<string, ReturnType<typeof vi.fn>>;
  productVariant: Record<string, ReturnType<typeof vi.fn>>;
  orderItem: Record<string, ReturnType<typeof vi.fn>>;
  productRoom: Record<string, ReturnType<typeof vi.fn>>;
  productOptionGroup: Record<string, ReturnType<typeof vi.fn>>;
  productOptionValue: Record<string, ReturnType<typeof vi.fn>>;
  optionGroup: Record<string, ReturnType<typeof vi.fn>>;
  optionValue: Record<string, ReturnType<typeof vi.fn>>;
  room: Record<string, ReturnType<typeof vi.fn>>;
  sku: Record<string, ReturnType<typeof vi.fn>>;
  skuOptionValue: Record<string, ReturnType<typeof vi.fn>>;
  skuMedia: Record<string, ReturnType<typeof vi.fn>>;
  productMedia: Record<string, ReturnType<typeof vi.fn>>;
  category: Record<string, ReturnType<typeof vi.fn>>;
  wishlistItem: Record<string, ReturnType<typeof vi.fn>>;
  $transaction: ReturnType<typeof vi.fn>;
};

const variant = { size: 'M', sku: 'SKU-M', price: 12990, compareAtPrice: null, stock: 5, active: true };
const colorway = { name: 'Чёрный', slug: 'black', isDefault: true, images: [], variants: [variant] };
const fullProduct = {
  name: 'Air Max 90',
  slug: 'air-max-90',
  brand: 'Nike',
  gender: 'UNISEX',
  categoryId: 'cat1',
  description: '',
  fitNote: '',
  specs: [],
  isBestseller: false,
  active: true,
  sortOrder: 0,
  colorways: [colorway],
};

const furnitureGroup = {
  id: 'og1',
  name: 'Материал',
  slug: 'material',
  sortOrder: 0,
  values: [{ id: 'ov1', name: 'Дуб', slug: 'oak', sortOrder: 0 }],
};

const furnitureDraft = (overrides: Record<string, unknown> = {}) => ({
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
  optionGroups: [{ ...furnitureGroup, values: [...furnitureGroup.values] }],
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
      media: [],
    },
  ],
  media: [],
  turntable: false,
  ...overrides,
});

const canonicalState = (overrides: Record<string, unknown> = {}) => ({
  id: 'pr1',
  gender: 'UNISEX',
  name: 'Oak Chair',
  slug: 'oak-chair',
  categoryId: 'cat1',
  category: { id: 'cat1', slug: 'living', turntableProductId: null },
  rooms: [{ roomId: 'room1', room: { id: 'room1', slug: 'living' } }],
  optionGroups: [
    {
      optionGroupId: 'og1',
      optionGroup: furnitureGroup,
      values: [{ optionValueId: 'ov1', optionValue: furnitureGroup.values[0] }],
    },
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
      selections: [
        {
          optionGroupId: 'og1',
          optionValueId: 'ov1',
          optionGroup: furnitureGroup,
          optionValue: furnitureGroup.values[0],
        },
      ],
      cartItems: [],
      orderItems: [],
      media: [],
    },
  ],
  media: [],
  colorways: [],
  ...overrides,
});

function prepareCanonicalMocks(state: Record<string, unknown>) {
  p.product.findUnique.mockImplementation(async (args: { where: Record<string, string> }) =>
    args.where.id ? state : null,
  );
  p.category.findUnique.mockResolvedValue({ id: 'cat1', slug: 'living', turntableProductId: null });
  p.optionGroup.findMany.mockResolvedValue([furnitureGroup]);
  p.optionValue.findMany.mockResolvedValue([{ ...furnitureGroup.values[0], optionGroupId: 'og1' }]);
  p.room.findMany.mockResolvedValue([{ id: 'room1', slug: 'living' }]);
  p.sku.findFirst.mockResolvedValue(null);
  p.sku.findMany.mockResolvedValue([]);
  p.product.update.mockResolvedValue({ id: 'pr1' });
  p.sku.update.mockResolvedValue({ id: 'sku1' });
  p.sku.create.mockResolvedValue({ id: 'sku-new' });
  p.product.create.mockResolvedValue({ id: 'pr-new' });
  p.wishlistItem.count.mockResolvedValue(0);
  p.skuMedia.findMany.mockResolvedValue([]);
  p.productMedia.findMany.mockResolvedValue([]);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME', 'ritm-cloud');
  authMock.mockResolvedValue({ user: { role: 'ADMIN' } });
  // Интерактивная транзакция: выполняем колбэк с тем же мок-клиентом.
  p.$transaction.mockImplementation(async (cb: (tx: typeof prisma) => unknown) => cb(prisma));
  p.product.create.mockResolvedValue({ id: 'new1' });
  p.productColorway.create.mockResolvedValue({ id: 'cw1' });
});

describe('createProduct', () => {
  it('anon → ok:false, no write', async () => {
    authMock.mockResolvedValue(null);
    const r = await createProduct(fullProduct);
    expect(r.ok).toBe(false);
    expect(p.product.create).not.toHaveBeenCalled();
  });

  it('CUSTOMER → ok:false', async () => {
    authMock.mockResolvedValue({ user: { role: 'CUSTOMER' } });
    const r = await createProduct(fullProduct);
    expect(r.ok).toBe(false);
  });

  it('draft (active=false, empty colorways) → creates with minPrice/discountPct 0', async () => {
    const r = await createProduct({ ...fullProduct, active: false, colorways: [] });
    expect(r.ok).toBe(true);
    expect(p.product.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ minPrice: 0, discountPct: 0, active: false }) }),
    );
  });

  it('full product → computes denorm minPrice from cheapest active variant', async () => {
    const r = await createProduct(fullProduct);
    expect(r.ok).toBe(true);
    expect(p.product.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ minPrice: 12990 }) }),
    );
    expect(p.productColorway.create).toHaveBeenCalled();
    expect(p.productVariant.create).toHaveBeenCalled();
  });

  it('invalid (zod) → ok:false, no write', async () => {
    const r = await createProduct({ ...fullProduct, name: '' });
    expect(r.ok).toBe(false);
    expect(p.product.create).not.toHaveBeenCalled();
  });

  it('P2002 (dup sku) → ok:false', async () => {
    const { Prisma } = await import('@prisma/client');
    p.$transaction.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: 'x' }),
    );
    const r = await createProduct(fullProduct);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/SKU/);
  });
});

describe('updateProduct', () => {
  beforeEach(() => {
    p.product.findUnique.mockResolvedValue({
      id: 'pr1',
      colorways: [{ id: 'cw1', images: [{ publicId: 'im1' }], variants: [{ id: 'v1' }] }],
    });
    p.orderItem.findMany.mockResolvedValue([]);
  });

  it('not found → ok:false', async () => {
    p.product.findUnique.mockResolvedValue(null);
    const r = await updateProduct('nope', fullProduct);
    expect(r.ok).toBe(false);
  });

  it('removing a referenced variant → blocked', async () => {
    // incoming has no variant id 'v1' → it is being removed
    p.orderItem.findMany.mockResolvedValue([{ productVariantId: 'v1' }]);
    const r = await updateProduct('pr1', {
      ...fullProduct,
      colorways: [{ ...colorway, id: 'cw1', variants: [{ ...variant, sku: 'NEW' }] }],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/заказ/);
    expect(p.$transaction).not.toHaveBeenCalled();
  });

  it('valid update keeping referenced variant → updates in transaction', async () => {
    const r = await updateProduct('pr1', {
      ...fullProduct,
      colorways: [{ ...colorway, id: 'cw1', variants: [{ ...variant, id: 'v1' }] }],
    });
    expect(r.ok).toBe(true);
    expect(p.$transaction).toHaveBeenCalled();
    expect(p.product.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'pr1' }, data: expect.objectContaining({ minPrice: 12990 }) }),
    );
    expect(p.productVariant.update).toHaveBeenCalled();
  });

  it('deletes removed persisted Cloudinary images after successful update', async () => {
    p.product.findUnique.mockResolvedValue({
      id: 'pr1',
      colorways: [
        {
          id: 'cw1',
          images: [{ publicId: 'ritm/products/old' }, { publicId: 'ritm/products/keep' }],
          variants: [{ id: 'v1' }],
        },
      ],
    });

    const next = {
      ...fullProduct,
      colorways: [
        {
          ...colorway,
          id: 'cw1',
          images: [
            {
              url: 'https://res.cloudinary.com/ritm-cloud/image/upload/v1700000000/ritm/products/keep',
              publicId: 'ritm/products/keep',
            },
          ],
          variants: [{ ...variant, id: 'v1' }],
        },
      ],
    };

    const r = await updateProduct('pr1', next);

    expect(r).toEqual({ ok: true, id: 'pr1' });
    expect(deleteAssetMock).toHaveBeenCalledWith('ritm/products/old');
    expect(deleteAssetMock).not.toHaveBeenCalledWith('ritm/products/keep');
  });
});

describe('deleteProduct', () => {
  it('referenced by an order → blocked', async () => {
    p.product.findUnique.mockResolvedValue({ id: 'pr1', colorways: [{ variants: [{ id: 'v1' }], images: [] }] });
    p.orderItem.findMany.mockResolvedValue([{ productVariantId: 'v1' }]);
    const r = await deleteProduct('pr1');
    expect(r.ok).toBe(false);
    expect(p.product.delete).not.toHaveBeenCalled();
  });

  it('unreferenced → deletes', async () => {
    p.product.findUnique.mockResolvedValue({
      id: 'pr1',
      colorways: [{ variants: [{ id: 'v1' }], images: [{ publicId: 'x' }] }],
    });
    p.orderItem.findMany.mockResolvedValue([]);
    p.product.delete.mockResolvedValue({ id: 'pr1' });
    const r = await deleteProduct('pr1');
    expect(r.ok).toBe(true);
    expect(p.product.delete).toHaveBeenCalledWith({ where: { id: 'pr1' } });
  });
});

describe('canonical furniture product actions', () => {
  it('exposes the canonical action contract', () => {
    expect(saveFurnitureProduct).toBeTypeOf('function');
    expect(setProductActive).toBeTypeOf('function');
    expect(deleteFurnitureProduct).toBeTypeOf('function');
  });

  it('rejects a malformed admin envelope before any write', async () => {
    const result = await saveFurnitureProduct({ product: fullProduct, detachOptionValueIds: [''] });

    expect(result).toMatchObject({ ok: false, code: 'VALIDATION_ERROR' });
    expect(p.$transaction).not.toHaveBeenCalled();
    expect(p.product.create).not.toHaveBeenCalled();
    expect(p.product.update).not.toHaveBeenCalled();
  });

  it('projects retained inactive selections before strict validation and allows value detach', async () => {
    const state = canonicalState({
      skus: [
        {
          ...canonicalState().skus[0],
          cartItems: [{ id: 'cart1' }],
        },
      ],
    });
    prepareCanonicalMocks(state);
    const result = await saveFurnitureProduct({
      product: furnitureDraft({
        active: false,
        optionGroups: [{ ...furnitureGroup, values: [] }],
        skus: [{ ...furnitureDraft().skus[0], active: false, selectedOptions: [] }],
      }),
      detachOptionValueIds: ['ov1'],
    });

    expect(result).toMatchObject({ ok: true });
    expect(p.productOptionValue.createMany).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([expect.objectContaining({ optionValueId: 'ov1' })]),
      }),
    );
    expect(p.productOptionValue.deleteMany).toHaveBeenCalledWith({ where: { productId: 'pr1', optionValueId: 'ov1' } });
    expect(p.skuOptionValue.deleteMany).not.toHaveBeenCalled();
  });

  it.each([
    ['articleNumber', 'ARTICLE_NUMBER_TAKEN'],
    ['slug', 'SLUG_TAKEN'],
  ])('maps an in-transaction P2002 target %s to %s', async (target, code) => {
    const { Prisma } = await import('@prisma/client');
    prepareCanonicalMocks(canonicalState());
    const collision = new Prisma.PrismaClientKnownRequestError('duplicate', {
      code: 'P2002',
      clientVersion: 'x',
    });
    Object.assign(collision, { meta: { target: [target] } });
    p.$transaction.mockRejectedValue(collision);

    const result = await saveFurnitureProduct({ product: furnitureDraft() });

    expect(result).toMatchObject({ ok: false, code });
  });

  it('refuses value detach while a sellable SKU selects it with zero writes', async () => {
    const state = canonicalState();
    prepareCanonicalMocks(state);
    const result = await saveFurnitureProduct({ product: furnitureDraft(), detachOptionValueIds: ['ov1'] });

    expect(result).toMatchObject({
      ok: false,
      code: 'OPTION_VALUE_IN_USE',
      details: { sellableSkuCount: 1, blockingCombinationKeys: ['material=oak'] },
    });
    expect(p.$transaction).not.toHaveBeenCalled();
    expect(p.product.update).not.toHaveBeenCalled();
    expect(p.sku.update).not.toHaveBeenCalled();
  });

  it('allows and refuses group detach under the same retained-inactive Rule V boundary', async () => {
    const inactiveState = canonicalState({ skus: [{ ...canonicalState().skus[0], cartItems: [{ id: 'cart1' }] }] });
    prepareCanonicalMocks(inactiveState);
    const allowed = await saveFurnitureProduct({
      product: furnitureDraft({
        active: false,
        optionGroups: [{ ...furnitureGroup, values: [] }],
        skus: [{ ...furnitureDraft().skus[0], active: false, selectedOptions: [] }],
      }),
      detachOptionGroupIds: ['og1'],
    });
    expect(allowed).toMatchObject({ ok: true });

    vi.clearAllMocks();
    authMock.mockResolvedValue({ user: { role: 'ADMIN' } });
    p.$transaction.mockImplementation(async (cb: (tx: typeof prisma) => unknown) => cb(prisma));
    prepareCanonicalMocks(canonicalState());
    const refused = await saveFurnitureProduct({ product: furnitureDraft(), detachOptionGroupIds: ['og1'] });
    expect(refused).toMatchObject({ ok: false, code: 'OPTION_GROUP_IN_USE', details: { sellableSkuCount: 1 } });
    expect(p.$transaction).not.toHaveBeenCalled();
  });

  it('returns Rule R counts for canonical and wishlist references without writes', async () => {
    const state = canonicalState({ skus: [{ ...canonicalState().skus[0], orderItems: [{ id: 'order1' }] }] });
    prepareCanonicalMocks(state);
    p.wishlistItem.count.mockResolvedValue(2);
    const result = await deleteFurnitureProduct({ productId: 'pr1' });

    expect(result).toMatchObject({
      ok: false,
      code: 'PRODUCT_HAS_REFERENCES',
      details: { referencedSkuCount: 1, referencedLegacyVariantCount: 0, referencedWishlistCount: 2 },
    });
    expect(p.$transaction).not.toHaveBeenCalled();
    expect(p.sku.delete).not.toHaveBeenCalled();
    expect(p.product.delete).not.toHaveBeenCalled();
  });

  it('returns Rule R legacy-only reference counts without deleting legacy children', async () => {
    const state = canonicalState({
      skus: [],
      colorways: [
        { id: 'cw1', images: [], variants: [{ id: 'legacy1', cartItems: [], orderItems: [{ id: 'order1' }] }] },
      ],
    });
    prepareCanonicalMocks(state);
    const result = await deleteFurnitureProduct({ productId: 'pr1' });

    expect(result).toMatchObject({
      ok: false,
      code: 'PRODUCT_HAS_REFERENCES',
      details: { referencedSkuCount: 0, referencedLegacyVariantCount: 1 },
    });
    expect(p.$transaction).not.toHaveBeenCalled();
    expect(p.productVariant.deleteMany).not.toHaveBeenCalled();
  });

  it('deactivation writes only Product.active', async () => {
    const state = canonicalState();
    prepareCanonicalMocks(state);
    const result = await setProductActive({ productId: 'pr1', active: false });

    expect(result).toEqual({ ok: true, data: { productId: 'pr1', active: false } });
    expect(p.product.update).toHaveBeenCalledWith({ where: { id: 'pr1' }, data: { active: false } });
    expect(p.sku.update).not.toHaveBeenCalled();
    expect(p.productOptionValue.deleteMany).not.toHaveBeenCalled();
  });

  it('ignores existing stock but creates submitted stock for a new SKU', async () => {
    const state = canonicalState();
    prepareCanonicalMocks(state);
    const existing = await saveFurnitureProduct({
      product: furnitureDraft({ skus: [{ ...furnitureDraft().skus[0], stock: 99 }] }),
    });
    expect(existing).toMatchObject({ ok: true, warnings: ['existing-sku-stock-ignored'] });
    expect(p.sku.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.not.objectContaining({ stock: expect.anything() }) }),
    );

    vi.clearAllMocks();
    authMock.mockResolvedValue({ user: { role: 'ADMIN' } });
    p.$transaction.mockImplementation(async (cb: (tx: typeof prisma) => unknown) => cb(prisma));
    p.product.findUnique.mockResolvedValue(null);
    p.category.findUnique.mockResolvedValue({ id: 'cat1', slug: 'living', turntableProductId: null });
    p.room.findMany.mockResolvedValue([{ id: 'room1', slug: 'living' }]);
    p.optionGroup.findMany.mockResolvedValue([furnitureGroup]);
    p.optionValue.findMany.mockResolvedValue([{ ...furnitureGroup.values[0], optionGroupId: 'og1' }]);
    p.sku.findFirst.mockResolvedValue(null);
    p.product.create.mockResolvedValue({ id: 'pr-new' });
    p.sku.create.mockResolvedValue({ id: 'sku-new' });
    p.sku.findMany.mockResolvedValue([]);
    p.product.update.mockResolvedValue({ id: 'pr-new' });
    p.skuMedia.findMany.mockResolvedValue([]);
    p.productMedia.findMany.mockResolvedValue([]);
    const created = await saveFurnitureProduct({
      product: furnitureDraft({ id: undefined, skus: [{ ...furnitureDraft().skus[0], id: undefined, stock: 12 }] }),
    });
    expect(created).toMatchObject({ ok: true, data: { productId: 'pr-new', skuCount: 1 } });
    expect(p.sku.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ stock: 12 }) }),
    );
  });

  it('refuses incomplete legacy migration with missing fields', async () => {
    const state = canonicalState({ skus: [], colorways: [{ id: 'cw1', images: [], variants: [] }] });
    prepareCanonicalMocks(state);
    const result = await saveFurnitureProduct({ product: { id: 'pr1', name: 'Legacy' } });
    expect(result).toMatchObject({
      ok: false,
      code: 'MIGRATION_INCOMPLETE',
      details: { missing: ['optionGroups', 'skus'] },
    });
    expect(p.$transaction).not.toHaveBeenCalled();
  });

  it('locks turntable-bound deactivate and delete', async () => {
    const state = canonicalState({ category: { id: 'cat1', slug: 'living', turntableProductId: 'pr1' } });
    prepareCanonicalMocks(state);
    expect(await setProductActive({ productId: 'pr1', active: false })).toMatchObject({
      ok: false,
      code: 'TURNTABLE_BOUND_PRODUCT_LOCKED',
    });
    expect(await deleteFurnitureProduct({ productId: 'pr1' })).toMatchObject({
      ok: false,
      code: 'TURNTABLE_BOUND_PRODUCT_LOCKED',
    });
    expect(p.$transaction).not.toHaveBeenCalled();
  });

  it('reconciles removed SKU children in explicit child-first order', async () => {
    const state = canonicalState({
      skus: [
        {
          ...canonicalState().skus[0],
          id: 'old-sku',
          combinationKey: 'material=old',
          articleNumber: 'OLD-1',
          media: [{ publicId: 'evironn/old' }],
        },
      ],
    });
    prepareCanonicalMocks(state);
    p.sku.create.mockResolvedValue({ id: 'new-sku' });
    const result = await saveFurnitureProduct({
      product: furnitureDraft({ skus: [{ ...furnitureDraft().skus[0], id: undefined, articleNumber: 'NEW-1' }] }),
    });
    expect(result).toMatchObject({ ok: true });
    const mediaOrder = p.skuMedia.deleteMany.mock.invocationCallOrder[0];
    const selectionOrder = p.skuOptionValue.deleteMany.mock.invocationCallOrder[0];
    const skuOrder = p.sku.delete.mock.invocationCallOrder[0];
    expect(mediaOrder).toBeLessThan(selectionOrder);
    expect(selectionOrder).toBeLessThan(skuOrder);
  });

  it('hard-deletes an unreferenced product with explicit product child ordering', async () => {
    const state = canonicalState();
    prepareCanonicalMocks(state);
    const result = await deleteFurnitureProduct({ productId: 'pr1' });

    expect(result).toMatchObject({ ok: true, data: null });
    expect(p.sku.deleteMany).toHaveBeenCalledWith({ where: { id: { in: ['sku1'] } } });
    expect(p.product.delete).toHaveBeenCalledWith({ where: { id: 'pr1' } });
    expect(p.sku.deleteMany.mock.invocationCallOrder[0]).toBeLessThan(p.product.delete.mock.invocationCallOrder[0]);
    expect(p.productOptionValue.deleteMany.mock.invocationCallOrder[0]).toBeLessThan(
      p.product.delete.mock.invocationCallOrder[0],
    );
  });
});
