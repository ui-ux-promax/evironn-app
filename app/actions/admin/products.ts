'use server';

import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdminAction } from '@/lib/admin/require-admin';
import { prisma } from '@/lib/prisma-client';
import { deleteAsset } from '@/lib/cloudinary/server';
import {
  furnitureProductSchema,
  productSchema,
  type FurnitureProductValues,
  type ProductValues,
} from '@/services/dto/product.dto';
import { productDenormFromColorways } from '@/lib/product-aggregates';
import { buildCombinationKey } from '@/lib/furniture-sku';
import { adminError, adminOk, type AdminActionResult } from '@/lib/admin/action-result';
import { isEvironnPublicId, isLegacyPublicId, isSafeMediaPath } from '@/lib/cloudinary/folders';
import type { AdminMediaInput } from '@/services/dto/product.dto';

export type ProductActionResult = { ok: true; id: string } | { ok: false; error: string };

const LIST_PATH = '/admin/catalog/products';

function firstError(error: import('zod').ZodError): string {
  return error.issues[0]?.message ?? 'Проверьте поля';
}

// Денорм из дерева формы: порядок расцветок = индекс массива (как при записи sortOrder).
function denormOf(v: ProductValues): { minPrice: number; discountPct: number } {
  return productDenormFromColorways(
    v.colorways.map((c, i) => ({
      isDefault: c.isDefault,
      sortOrder: i,
      variants: c.variants.map((vr) => ({
        price: vr.price,
        compareAtPrice: vr.compareAtPrice ?? null,
        active: vr.active,
      })),
    })),
  );
}

function specsToJson(v: ProductValues): Prisma.InputJsonValue {
  return Object.fromEntries(v.specs.map((s) => [s.key, s.value]));
}

function scalarData(v: ProductValues) {
  return {
    name: v.name,
    slug: v.slug,
    brand: v.brand,
    gender: v.gender,
    categoryId: v.categoryId,
    description: v.description ?? null,
    fitNote: v.fitNote ?? null,
    specs: specsToJson(v),
    isBestseller: v.isBestseller,
    active: v.active,
    sortOrder: v.sortOrder,
    ...denormOf(v),
  };
}

function mapP2002(e: unknown): ProductActionResult | null {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
    return { ok: false, error: 'SKU занят: проверьте артикулы вариантов' };
  }
  return null;
}

function canonicalP2002(e: unknown): AdminActionResult<never> | null {
  if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== 'P2002') return null;
  const target = (e as { meta?: { target?: unknown } }).meta?.target;
  const targets = Array.isArray(target) ? target : [target];
  const targetText = targets.filter((value): value is string => typeof value === 'string').join(' ');
  if (/articleNumber/i.test(targetText))
    return adminError('ARTICLE_NUMBER_TAKEN', 'SKU article number is already in use');
  if (/slug/i.test(targetText)) return adminError('SLUG_TAKEN', 'Product slug is already in use');
  return adminError('UNEXPECTED', 'Product or SKU unique constraint failed');
}

export async function createProduct(raw: unknown): Promise<ProductActionResult> {
  const gate = await requireAdminAction();
  if (!gate.ok) return { ok: false, error: gate.error };

  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const v = parsed.data;

  try {
    const id = await prisma.$transaction(async (txn) => {
      const product = await txn.product.create({ data: scalarData(v) });
      for (let ci = 0; ci < v.colorways.length; ci++) {
        const c = v.colorways[ci];
        const cw = await txn.productColorway.create({
          data: {
            productId: product.id,
            name: c.name,
            slug: c.slug,
            swatchHex: c.swatchHex ?? null,
            isDefault: c.isDefault,
            sortOrder: ci,
          },
        });
        if (c.images.length > 0) {
          await txn.productImage.createMany({
            data: c.images.map((img, ii) => ({
              colorwayId: cw.id,
              url: img.url,
              publicId: img.publicId ?? null,
              alt: img.alt ?? null,
              sortOrder: ii,
            })),
          });
        }
        for (const vr of c.variants) {
          await txn.productVariant.create({
            data: {
              colorwayId: cw.id,
              size: vr.size,
              sizeOrder: vr.sizeOrder,
              sku: vr.sku,
              price: vr.price,
              compareAtPrice: vr.compareAtPrice ?? null,
              stock: vr.stock,
              active: vr.active,
            },
          });
        }
      }
      return product.id;
    });
    revalidatePath(LIST_PATH);
    return { ok: true, id };
  } catch (e) {
    const mapped = mapP2002(e);
    if (mapped) return mapped;
    throw e;
  }
}

export async function updateProduct(id: string, raw: unknown): Promise<ProductActionResult> {
  const gate = await requireAdminAction();
  if (!gate.ok) return { ok: false, error: gate.error };

  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const v = parsed.data;

  const existing = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      colorways: {
        select: { id: true, images: { select: { publicId: true } }, variants: { select: { id: true } } },
      },
    },
  });
  if (!existing) return { ok: false, error: 'Товар не найден' };

  const existingColorwayIds = new Set(existing.colorways.map((c) => c.id));
  const existingVariantIds = new Set(existing.colorways.flatMap((c) => c.variants.map((vr) => vr.id)));
  const incomingColorwayIds = new Set(v.colorways.map((c) => c.id).filter(Boolean) as string[]);
  const incomingVariantIds = new Set(
    v.colorways.flatMap((c) => c.variants.map((vr) => vr.id).filter(Boolean) as string[]),
  );

  const removedColorwayIds = [...existingColorwayIds].filter((cid) => !incomingColorwayIds.has(cid));
  const removedVariantIds = [...existingVariantIds].filter((vid) => !incomingVariantIds.has(vid));
  const existingPublicIds = existing.colorways.flatMap(
    (c) => c.images.map((image) => image.publicId).filter(Boolean) as string[],
  );
  const incomingPublicIds = new Set(
    v.colorways.flatMap((c) => c.images.map((image) => image.publicId).filter(Boolean) as string[]),
  );
  const removedPublicIds = existingPublicIds.filter((publicId) => !incomingPublicIds.has(publicId));

  // Guard: нельзя удалить variant, на который ссылается заказ.
  if (removedVariantIds.length > 0) {
    const refs = await prisma.orderItem.findMany({
      where: { productVariantId: { in: removedVariantIds } },
      select: { productVariantId: true },
      take: 1,
    });
    if (refs.length > 0) {
      return { ok: false, error: 'Вариант используется в заказах — деактивируйте вместо удаления' };
    }
  }

  try {
    await prisma.$transaction(async (txn) => {
      await txn.product.update({ where: { id }, data: scalarData(v) });

      if (removedColorwayIds.length > 0) {
        // cascade удалит images+variants удаляемых расцветок (variants проверены guard'ом).
        await txn.productColorway.deleteMany({ where: { id: { in: removedColorwayIds } } });
      }
      if (removedVariantIds.length > 0) {
        // variants выживших расцветок, которых нет во входе (cascade'нутые уже исчезли — idempotent).
        await txn.productVariant.deleteMany({ where: { id: { in: removedVariantIds } } });
      }

      for (let ci = 0; ci < v.colorways.length; ci++) {
        const c = v.colorways[ci];
        let colorwayId: string;
        if (c.id && existingColorwayIds.has(c.id)) {
          await txn.productColorway.update({
            where: { id: c.id },
            data: { name: c.name, slug: c.slug, swatchHex: c.swatchHex ?? null, isDefault: c.isDefault, sortOrder: ci },
          });
          colorwayId = c.id;
        } else {
          const created = await txn.productColorway.create({
            data: {
              productId: id,
              name: c.name,
              slug: c.slug,
              swatchHex: c.swatchHex ?? null,
              isDefault: c.isDefault,
              sortOrder: ci,
            },
          });
          colorwayId = created.id;
        }

        // Картинки: на них нет входящих FK → полная замена.
        await txn.productImage.deleteMany({ where: { colorwayId } });
        if (c.images.length > 0) {
          await txn.productImage.createMany({
            data: c.images.map((img, ii) => ({
              colorwayId,
              url: img.url,
              publicId: img.publicId ?? null,
              alt: img.alt ?? null,
              sortOrder: ii,
            })),
          });
        }

        // Варианты: diff-upsert (НЕ replace — FK OrderItem).
        for (const vr of c.variants) {
          const data = {
            size: vr.size,
            sizeOrder: vr.sizeOrder,
            sku: vr.sku,
            price: vr.price,
            compareAtPrice: vr.compareAtPrice ?? null,
            stock: vr.stock,
            active: vr.active,
          };
          if (vr.id && existingVariantIds.has(vr.id)) {
            await txn.productVariant.update({ where: { id: vr.id }, data });
          } else {
            await txn.productVariant.create({ data: { colorwayId, ...data } });
          }
        }
      }
    });
    for (const publicId of removedPublicIds) {
      try {
        await deleteAsset(publicId);
      } catch {
        /* best-effort */
      }
    }
    revalidatePath(LIST_PATH);
    return { ok: true, id };
  } catch (e) {
    const mapped = mapP2002(e);
    if (mapped) return mapped;
    throw e;
  }
}

export async function deleteProduct(id: string): Promise<ProductActionResult> {
  const gate = await requireAdminAction();
  if (!gate.ok) return { ok: false, error: gate.error };

  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      colorways: { select: { images: { select: { publicId: true } }, variants: { select: { id: true } } } },
    },
  });
  if (!product) return { ok: false, error: 'Товар не найден' };

  const variantIds = product.colorways.flatMap((c) => c.variants.map((vr) => vr.id));
  if (variantIds.length > 0) {
    const refs = await prisma.orderItem.findMany({
      where: { productVariantId: { in: variantIds } },
      select: { productVariantId: true },
      take: 1,
    });
    if (refs.length > 0) {
      return { ok: false, error: 'Товар есть в заказах — деактивируйте вместо удаления' };
    }
  }

  await prisma.product.delete({ where: { id } }); // cascade: colorways → images + variants

  // Best-effort чистка Cloudinary (не блокирует).
  const publicIds = product.colorways.flatMap((c) => c.images.map((im) => im.publicId).filter(Boolean) as string[]);
  for (const pid of publicIds) {
    try {
      await deleteAsset(pid);
    } catch {
      /* best-effort */
    }
  }
  revalidatePath(LIST_PATH);
  return { ok: true, id };
}

const productSaveEnvelopeSchema = z
  .object({
    product: z.unknown(),
    detachOptionGroupIds: z.array(z.string().trim().min(1)).optional().default([]),
    detachOptionValueIds: z.array(z.string().trim().min(1)).optional().default([]),
  })
  .strict();

const productToggleSchema = z
  .object({ productId: z.string().min(1).optional(), id: z.string().min(1).optional(), active: z.boolean() })
  .strict()
  .refine((value) => Boolean(value.productId ?? value.id), { path: ['productId'], message: 'Product id is required' });

const productIdSchema = z.union([
  z.string().min(1),
  z.object({ productId: z.string().min(1) }).strict(),
  z.object({ id: z.string().min(1) }).strict(),
]);

const canonicalProductSelect = {
  id: true,
  gender: true,
  name: true,
  slug: true,
  categoryId: true,
  category: { select: { id: true, slug: true, turntableProductId: true } },
  rooms: { select: { roomId: true, room: { select: { id: true, slug: true } } } },
  optionGroups: {
    select: {
      optionGroupId: true,
      optionGroup: {
        select: {
          id: true,
          name: true,
          slug: true,
          sortOrder: true,
          values: { select: { id: true, name: true, slug: true, swatchHex: true, sortOrder: true } },
        },
      },
      values: {
        select: {
          optionValueId: true,
          optionValue: { select: { id: true, name: true, slug: true, swatchHex: true, sortOrder: true } },
        },
      },
    },
  },
  skus: {
    orderBy: { articleNumber: 'asc' },
    select: {
      id: true,
      combinationKey: true,
      articleNumber: true,
      price: true,
      oldPrice: true,
      stock: true,
      active: true,
      selections: {
        select: {
          optionGroupId: true,
          optionValueId: true,
          optionGroup: { select: { id: true, name: true, slug: true, sortOrder: true } },
          optionValue: { select: { id: true, name: true, slug: true, swatchHex: true, sortOrder: true } },
        },
      },
      cartItems: { select: { id: true } },
      orderItems: { select: { id: true } },
      media: {
        orderBy: { sortOrder: 'asc' },
        select: { id: true, kind: true, url: true, publicId: true, alt: true, sortOrder: true },
      },
    },
  },
  media: {
    orderBy: { sortOrder: 'asc' },
    select: { id: true, kind: true, url: true, publicId: true, alt: true, sortOrder: true },
  },
  colorways: {
    select: {
      id: true,
      images: { select: { publicId: true } },
      variants: { select: { id: true, cartItems: { select: { id: true } }, orderItems: { select: { id: true } } } },
    },
  },
} satisfies Prisma.ProductSelect;

type CanonicalProduct = Prisma.ProductGetPayload<{ select: typeof canonicalProductSelect }>;
type CanonicalSku = CanonicalProduct['skus'][number];
type CanonicalOptionGroup = CanonicalProduct['optionGroups'][number]['optionGroup'];
type CanonicalOptionValue = CanonicalOptionGroup['values'][number];

type ProductReferenceCounts = {
  referencedSkuCount: number;
  referencedLegacyVariantCount: number;
  referencedWishlistCount: number;
};

type FurnitureProductSaveResult = { productId: string; skuCount: number; deactivatedSkuIds: string[] };
type ProductActiveResult = { productId: string; active: boolean };

type SkuPlan = {
  updates: { current: CanonicalSku; next: FurnitureProductValues['skus'][number] }[];
  creates: FurnitureProductValues['skus'][number][];
  deactivations: CanonicalSku[];
  removals: CanonicalSku[];
  retained: CanonicalSku[];
  sellable: { id: string | null; selected: { optionGroupId: string; optionValueId: string }[]; active: boolean }[];
  warnings: string[];
};

type ResolvedOptionGroup = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  values: { id: string; name: string; slug: string; swatchHex: string | null; sortOrder: number }[];
};

class RuleVConflict extends Error {
  constructor(
    readonly code: 'OPTION_VALUE_IN_USE' | 'OPTION_GROUP_IN_USE',
    readonly details: Record<string, string | number | string[]>,
  ) {
    super(code);
  }
}

class MediaOwnershipConflict extends Error {
  constructor(readonly publicIdKind: 'legacy' | 'unsafe' | 'foreign') {
    super('MEDIA_OWNERSHIP_REJECTED');
  }
}

function canonicalScalarData(v: FurnitureProductValues, gender: 'MEN' | 'WOMEN' | 'UNISEX' | 'KIDS') {
  return {
    name: v.name,
    slug: v.slug,
    brand: v.brand,
    gender,
    categoryId: v.categoryId,
    description: v.description ?? null,
    fitNote: null,
    specs: Object.fromEntries(v.specs.map((spec) => [spec.key, spec.value])) as Prisma.InputJsonValue,
    isBestseller: v.isBestseller,
    active: v.active,
    sortOrder: v.sortOrder,
  };
}

function canonicalMediaValues(product: CanonicalProduct | null) {
  return (product?.media ?? []).map((media) => ({
    id: media.id,
    kind: media.kind,
    url: media.url,
    ...(media.publicId ? { publicId: media.publicId } : {}),
    ...(media.alt ? { alt: media.alt } : {}),
    sortOrder: media.sortOrder,
  }));
}

function canonicalSkuMediaValues(sku: CanonicalSku) {
  return sku.media.map((media) => ({
    id: media.id,
    kind: media.kind,
    url: media.url,
    ...(media.publicId ? { publicId: media.publicId } : {}),
    ...(media.alt ? { alt: media.alt } : {}),
    sortOrder: media.sortOrder,
  }));
}

function recordOf(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function arrayOf(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function selectionFromCanonical(selection: CanonicalSku['selections'][number]) {
  return { groupSlug: selection.optionGroup.slug, valueSlug: selection.optionValue.slug };
}

function optionGroupFromCanonical(group: CanonicalProduct['optionGroups'][number]): ResolvedOptionGroup {
  const linkedValueIds = new Set(group.values.map((value) => value.optionValueId));
  return {
    id: group.optionGroup.id,
    name: group.optionGroup.name,
    slug: group.optionGroup.slug,
    sortOrder: group.optionGroup.sortOrder,
    values: group.optionGroup.values.filter((value) => linkedValueIds.has(value.id)).map((value) => ({ ...value })),
  };
}

function projectRetainedInactiveSelections(rawProduct: unknown, current: CanonicalProduct | null): unknown {
  const raw = recordOf(rawProduct);
  if (!raw || !current) return rawProduct;

  const projected: Record<string, unknown> = { ...raw };
  const groups = arrayOf(raw.optionGroups).map((group) => ({ ...(recordOf(group) ?? {}) }));
  const skus = arrayOf(raw.skus).map((sku) => ({ ...(recordOf(sku) ?? {}) }));
  const groupById = new Map<string, Record<string, unknown>>();
  const groupBySlug = new Map<string, Record<string, unknown>>();
  for (const group of groups) {
    if (typeof group.id === 'string') groupById.set(group.id, group);
    if (typeof group.slug === 'string') groupBySlug.set(group.slug, group);
  }

  const incomingById = new Map<string, Record<string, unknown>>();
  for (const sku of skus) if (typeof sku.id === 'string') incomingById.set(sku.id, sku);

  for (const currentSku of current.skus) {
    const incoming = incomingById.get(currentSku.id);
    const retainedInactive = incoming
      ? incoming.active === false
      : currentSku.cartItems.length > 0 || currentSku.orderItems.length > 0;
    if (!retainedInactive) continue;

    for (const selection of currentSku.selections) {
      let group = groupById.get(selection.optionGroupId) ?? groupBySlug.get(selection.optionGroup.slug);
      if (!group) {
        group = {
          id: selection.optionGroup.id,
          name: selection.optionGroup.name,
          slug: selection.optionGroup.slug,
          sortOrder: selection.optionGroup.sortOrder,
          values: [],
        };
        groups.push(group);
        groupById.set(selection.optionGroupId, group);
        groupBySlug.set(selection.optionGroup.slug, group);
      }
      const values = arrayOf(group.values).map((value) => ({ ...(recordOf(value) ?? {}) }));
      if (!values.some((value) => value.id === selection.optionValueId || value.slug === selection.optionValue.slug)) {
        values.push({
          id: selection.optionValue.id,
          name: selection.optionValue.name,
          slug: selection.optionValue.slug,
          ...(selection.optionValue.swatchHex ? { swatchHex: selection.optionValue.swatchHex } : {}),
          sortOrder: selection.optionValue.sortOrder,
        });
      }
      group.values = values;
    }

    const selectedOptions = currentSku.selections.map(selectionFromCanonical);
    if (incoming) {
      const currentOptions = arrayOf(incoming.selectedOptions).map((option) => recordOf(option) ?? {});
      incoming.selectedOptions = [
        ...currentOptions,
        ...selectedOptions.filter(
          (selection) =>
            !currentOptions.some(
              (option) => option.groupSlug === selection.groupSlug && option.valueSlug === selection.valueSlug,
            ),
        ),
      ];
      if (!Array.isArray(incoming.media)) incoming.media = canonicalSkuMediaValues(currentSku);
    } else {
      skus.push({
        id: currentSku.id,
        articleNumber: currentSku.articleNumber,
        combinationKey: currentSku.combinationKey,
        selectedOptions,
        price: currentSku.price,
        oldPrice: currentSku.oldPrice,
        stock: currentSku.stock,
        active: false,
        media: canonicalSkuMediaValues(currentSku),
      });
    }
  }

  projected.optionGroups = groups;
  projected.skus = skus;
  if (!Array.isArray(projected.media)) projected.media = canonicalMediaValues(current);
  return projected;
}

async function loadCanonicalProduct(productId: string): Promise<CanonicalProduct | null> {
  return prisma.product.findUnique({ where: { id: productId }, select: canonicalProductSelect });
}

async function resolveOptionGroups(
  values: FurnitureProductValues,
  current: CanonicalProduct | null,
): Promise<ResolvedOptionGroup[] | null> {
  const currentGroups = new Map(
    current?.optionGroups.map(optionGroupFromCanonical).map((group) => [group.id, group]) ?? [],
  );
  const currentGroupsBySlug = new Map(
    current?.optionGroups.map(optionGroupFromCanonical).map((group) => [group.slug, group]) ?? [],
  );
  const unresolvedGroupIds = values.optionGroups.map((group) => group.id).filter((id): id is string => Boolean(id));
  const unresolvedValueIds = values.optionGroups.flatMap((group) =>
    group.values.map((value) => value.id).filter((id): id is string => Boolean(id)),
  );
  const [groups, optionValues] = await Promise.all([
    unresolvedGroupIds.length > 0
      ? prisma.optionGroup.findMany({
          where: { id: { in: unresolvedGroupIds } },
          select: { id: true, name: true, slug: true, sortOrder: true },
        })
      : Promise.resolve([]),
    unresolvedValueIds.length > 0
      ? prisma.optionValue.findMany({
          where: { id: { in: unresolvedValueIds } },
          select: { id: true, optionGroupId: true, name: true, slug: true, swatchHex: true, sortOrder: true },
        })
      : Promise.resolve([]),
  ]);
  const groupsById = new Map(groups.map((group) => [group.id, group]));
  const valuesById = new Map(optionValues.map((value) => [value.id, value]));

  const resolved: ResolvedOptionGroup[] = [];
  for (const group of values.optionGroups) {
    const currentGroup = (group.id ? currentGroups.get(group.id) : undefined) ?? currentGroupsBySlug.get(group.slug);
    const resolvedGroup = (group.id ? groupsById.get(group.id) : undefined) ?? currentGroup;
    if (!resolvedGroup) return null;
    const resolvedValues: ResolvedOptionGroup['values'] = [];
    for (const value of group.values) {
      const currentValue = currentGroup?.values.find((candidate) => candidate.slug === value.slug);
      const resolvedValue = (value.id ? valuesById.get(value.id) : undefined) ?? currentValue;
      if (!resolvedValue || ('optionGroupId' in resolvedValue && resolvedValue.optionGroupId !== resolvedGroup.id)) {
        return null;
      }
      resolvedValues.push({
        id: resolvedValue.id,
        name: value.name,
        slug: value.slug,
        swatchHex: value.swatchHex ?? resolvedValue.swatchHex ?? null,
        sortOrder: value.sortOrder,
      });
    }
    resolved.push({
      id: resolvedGroup.id,
      name: group.name,
      slug: group.slug,
      sortOrder: group.sortOrder,
      values: resolvedValues,
    });
  }
  return resolved;
}

async function resolveRoomIds(roomSlugs: string[], current: CanonicalProduct | null): Promise<string[] | null> {
  const currentBySlug = new Map((current?.rooms ?? []).map((room) => [room.room.slug, room.roomId]));
  const missingSlugs = roomSlugs.filter((slug) => !currentBySlug.has(slug));
  const rooms = missingSlugs.length
    ? await prisma.room.findMany({ where: { slug: { in: missingSlugs } }, select: { id: true, slug: true } })
    : [];
  const bySlug = new Map(rooms.map((room) => [room.slug, room.id]));
  const ids = roomSlugs.map((slug) => currentBySlug.get(slug) ?? bySlug.get(slug));
  return ids.every((id): id is string => Boolean(id)) ? ids : null;
}

function selectedIds(
  sku: FurnitureProductValues['skus'][number],
  groups: ResolvedOptionGroup[],
): { optionGroupId: string; optionValueId: string }[] | null {
  const result = sku.selectedOptions.map((selection) => {
    const group = groups.find((candidate) => candidate.slug === selection.groupSlug);
    const value = group?.values.find((candidate) => candidate.slug === selection.valueSlug);
    return group && value ? { optionGroupId: group.id, optionValueId: value.id } : null;
  });
  return result.every((selection): selection is { optionGroupId: string; optionValueId: string } => Boolean(selection))
    ? result
    : null;
}

function buildSkuPlan(
  values: FurnitureProductValues,
  current: CanonicalProduct | null,
  groups: ResolvedOptionGroup[],
): SkuPlan | AdminActionResult<never> {
  const currentById = new Map((current?.skus ?? []).map((sku) => [sku.id, sku]));
  const incomingIds = new Set<string>();
  const updates: SkuPlan['updates'] = [];
  const creates: SkuPlan['creates'] = [];
  const sellable: SkuPlan['sellable'] = [];
  const warnings: string[] = [];

  for (const sku of values.skus) {
    const selected = selectedIds(sku, groups);
    if (!selected) return adminError('VALIDATION_ERROR', 'SKU selections do not belong to the product option groups');
    if (sku.id) {
      const existing = currentById.get(sku.id);
      if (!existing || incomingIds.has(sku.id))
        return adminError('VALIDATION_ERROR', 'SKU reference is not owned by this product');
      incomingIds.add(sku.id);
      if (existing.combinationKey !== sku.combinationKey) {
        return adminError('VALIDATION_ERROR', 'Existing SKU selections are immutable');
      }
      updates.push({ current: existing, next: sku });
      if (existing.stock !== sku.stock && !warnings.includes('existing-sku-stock-ignored')) {
        warnings.push('existing-sku-stock-ignored');
      }
      if (sku.active) sellable.push({ id: existing.id, selected, active: true });
      continue;
    }
    creates.push(sku);
    if (sku.active) sellable.push({ id: null, selected, active: true });
  }

  const deactivations: CanonicalSku[] = [];
  const removals: CanonicalSku[] = [];
  for (const sku of current?.skus ?? []) {
    if (incomingIds.has(sku.id)) continue;
    if (sku.cartItems.length > 0 || sku.orderItems.length > 0) deactivations.push(sku);
    else removals.push(sku);
  }
  for (const sku of deactivations) {
    sellable.push({
      id: sku.id,
      selected: sku.selections.map((selection) => ({
        optionGroupId: selection.optionGroupId,
        optionValueId: selection.optionValueId,
      })),
      active: false,
    });
  }
  return {
    updates,
    creates,
    deactivations,
    removals,
    retained: [...updates.map(({ current: sku }) => sku), ...deactivations],
    sellable,
    warnings,
  };
}

function blockingDetailsForValue(
  optionValueId: string,
  groups: ResolvedOptionGroup[],
  sellable: SkuPlan['sellable'],
  values: FurnitureProductValues,
) {
  const value = groups
    .flatMap((group) => group.values.map((candidate) => ({ group, candidate })))
    .find(({ candidate }) => candidate.id === optionValueId);
  const blocking = sellable.filter((sku) =>
    sku.selected.some((selection) => selection.optionValueId === optionValueId),
  );
  const blockingCombinationKeys = values.skus
    .filter(
      (sku) => sku.active && sku.selectedOptions.some((selection) => selection.valueSlug === value?.candidate.slug),
    )
    .map((sku) => sku.combinationKey)
    .slice(0, 20);
  return {
    optionValueSlug: value?.candidate.slug ?? optionValueId,
    sellableSkuCount: blocking.length,
    blockingCombinationKeys,
  };
}

function blockingDetailsForGroup(
  optionGroupId: string,
  groups: ResolvedOptionGroup[],
  sellable: SkuPlan['sellable'],
  values: FurnitureProductValues,
) {
  const group = groups.find((candidate) => candidate.id === optionGroupId);
  const blocking = sellable.filter((sku) =>
    sku.selected.some((selection) => selection.optionGroupId === optionGroupId),
  );
  return {
    optionGroupSlug: group?.slug ?? optionGroupId,
    sellableSkuCount: blocking.length,
    blockingCombinationKeys: values.skus
      .filter((sku) => sku.active && sku.selectedOptions.some((selection) => selection.groupSlug === group?.slug))
      .map((sku) => sku.combinationKey)
      .slice(0, 20),
  };
}

function assertRuleV(
  detachOptionValueIds: string[],
  detachOptionGroupIds: string[],
  groups: ResolvedOptionGroup[],
  plan: SkuPlan,
  values: FurnitureProductValues,
): void {
  for (const optionValueId of detachOptionValueIds) {
    const details = blockingDetailsForValue(optionValueId, groups, plan.sellable, values);
    if (details.sellableSkuCount > 0) throw new RuleVConflict('OPTION_VALUE_IN_USE', details);
  }
  for (const optionGroupId of detachOptionGroupIds) {
    const details = blockingDetailsForGroup(optionGroupId, groups, plan.sellable, values);
    if (details.sellableSkuCount > 0) throw new RuleVConflict('OPTION_GROUP_IN_USE', details);
  }
}

async function productReferences(product: CanonicalProduct): Promise<ProductReferenceCounts> {
  return {
    referencedSkuCount: product.skus.filter((sku) => sku.cartItems.length > 0 || sku.orderItems.length > 0).length,
    referencedLegacyVariantCount: product.colorways
      .flatMap((colorway) => colorway.variants)
      .filter((variant) => variant.cartItems.length > 0 || variant.orderItems.length > 0).length,
    referencedWishlistCount: (await prisma.wishlistItem.count({ where: { productId: product.id } })) ?? 0,
  };
}

function turntableLock(product: CanonicalProduct | null) {
  if (!product?.category.turntableProductId || product.category.turntableProductId !== product.id) return null;
  return adminError('TURNTABLE_BOUND_PRODUCT_LOCKED', 'Turntable-bound product must be unbound before this operation', {
    categoryId: product.category.id,
    categorySlug: product.category.slug,
  });
}

async function destroyMediaAfterCommit(publicIds: string[]): Promise<string[]> {
  const uniqueIds = [...new Set(publicIds.filter(Boolean))];
  if (uniqueIds.length === 0) return [];
  const [skuRefs, productRefs] = await Promise.all([
    prisma.skuMedia.findMany({ where: { publicId: { in: uniqueIds } }, select: { publicId: true } }),
    prisma.productMedia.findMany({ where: { publicId: { in: uniqueIds } }, select: { publicId: true } }),
  ]);
  const referenced = new Set(
    [...(skuRefs ?? []), ...(productRefs ?? [])]
      .map((media) => media.publicId)
      .filter((id): id is string => Boolean(id)),
  );
  const warnings: string[] = [];
  for (const publicId of uniqueIds.filter((id) => !referenced.has(id))) {
    try {
      await deleteAsset(publicId);
    } catch {
      if (!warnings.includes('media-destroy-failed')) warnings.push('media-destroy-failed');
    }
  }
  return warnings;
}

function revalidateFurnitureProduct(productId: string) {
  revalidatePath('/admin/catalog/products');
  revalidatePath(`/admin/catalog/products/${productId}/edit`);
  revalidatePath('/admin/catalog');
}

async function parseFurnitureEnvelope(
  input: unknown,
  current: CanonicalProduct | null,
): Promise<
  | { ok: false; error: ReturnType<typeof adminError> }
  | { ok: true; envelope: z.infer<typeof productSaveEnvelopeSchema>; values: FurnitureProductValues }
> {
  const envelope = productSaveEnvelopeSchema.safeParse(input);
  if (!envelope.success) return { ok: false, error: adminError('VALIDATION_ERROR', firstError(envelope.error)) };
  const projected = projectRetainedInactiveSelections(envelope.data.product, current);
  const parsed = furnitureProductSchema.safeParse(projected);
  if (!parsed.success) return { ok: false, error: adminError('VALIDATION_ERROR', firstError(parsed.error)) };
  return { ok: true, envelope: envelope.data, values: parsed.data };
}

async function checkProductSlug(productId: string | undefined, slug: string) {
  const existing = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
  return Boolean(existing && existing.id !== productId);
}

async function checkArticleNumbers(productId: string | undefined, values: FurnitureProductValues) {
  const articles = values.skus.map((sku) => sku.articleNumber);
  if (new Set(articles).size !== articles.length) return true;
  const existing = await prisma.sku.findFirst({
    where: { articleNumber: { in: articles }, ...(productId ? { productId: { not: productId } } : {}) },
    select: { id: true },
  });
  return Boolean(existing);
}

function mediaPublicIdKind(publicId: string): 'legacy' | 'unsafe' | 'foreign' {
  if (isLegacyPublicId(publicId)) return 'legacy';
  if (!isSafeMediaPath(publicId)) return 'unsafe';
  return 'foreign';
}

function mediaOwnershipConflict(
  media: AdminMediaInput,
  persistedById: Map<string, { id: string; publicId: string | null }>,
) {
  if (!media.publicId || isEvironnPublicId(media.publicId)) return null;
  const persisted = media.id ? persistedById.get(media.id) : undefined;
  if (isLegacyPublicId(media.publicId) && persisted?.publicId === media.publicId) return null;
  return new MediaOwnershipConflict(mediaPublicIdKind(media.publicId));
}

function validateNewMediaPublicIds(values: FurnitureProductValues, current: CanonicalProduct | null) {
  const productMediaById = new Map((current?.media ?? []).map((media) => [media.id, media]));
  const skuMediaBySkuId = new Map(
    (current?.skus ?? []).map((sku) => [sku.id, new Map(sku.media.map((media) => [media.id, media]))]),
  );
  const submitted = [
    { media: values.media, persistedById: productMediaById },
    ...values.skus.map((sku) => ({
      media: sku.media ?? [],
      persistedById: sku.id ? skuMediaBySkuId.get(sku.id) : undefined,
    })),
  ];
  for (const entry of submitted) {
    for (const media of entry.media) {
      const conflict = mediaOwnershipConflict(toAdminMediaInput(media), entry.persistedById ?? new Map());
      if (conflict)
        return adminError('MEDIA_OWNERSHIP_REJECTED', 'Media public ID is not owned by Evironn', {
          publicIdKind: conflict.publicIdKind,
        });
    }
  }
  return null;
}

function turntableMediaComplete(media: FurnitureProductValues['media']) {
  return (['TURN_TABLE_VIDEO', 'TURN_TABLE_POSTER', 'TURN_TABLE_FALLBACK'] as const).every(
    (kind) => media.filter((item) => item.kind === kind).length === 1,
  );
}

function toAdminMediaInput(media: FurnitureProductValues['media'][number]): AdminMediaInput {
  return {
    id: media.id ?? null,
    kind: media.kind,
    url: media.url,
    publicId: media.publicId ?? null,
    alt: media.alt ?? null,
    sortOrder: media.sortOrder,
  };
}

function canonicalMediaForSku(sku: FurnitureProductValues['skus'][number], current: CanonicalSku): AdminMediaInput[] {
  return sku.media === undefined
    ? canonicalSkuMediaValues(current).map(toAdminMediaInput)
    : sku.media.map(toAdminMediaInput);
}

export async function saveFurnitureProduct(input: unknown): Promise<AdminActionResult<FurnitureProductSaveResult>> {
  const gate = await requireAdminAction();
  if (!gate.ok) return adminError('UNEXPECTED', gate.error);

  const envelopeShape = productSaveEnvelopeSchema.safeParse(input);
  if (!envelopeShape.success) return adminError('VALIDATION_ERROR', firstError(envelopeShape.error));
  const rawProduct = recordOf(envelopeShape.data.product);
  const productId = typeof rawProduct?.id === 'string' ? rawProduct.id : undefined;
  const current = productId ? await loadCanonicalProduct(productId) : null;
  if (productId && !current) return adminError('NOT_FOUND', 'Product not found');

  const migrationMissing: string[] = [];
  if (current && current.skus.length === 0 && current.colorways.length > 0) {
    const rawGroups = arrayOf(rawProduct?.optionGroups);
    if (rawGroups.length === 0) migrationMissing.push('optionGroups');
    if (rawGroups.some((group) => arrayOf(recordOf(group)?.values).length === 0)) migrationMissing.push('optionValues');
    if (arrayOf(rawProduct?.skus).length === 0) migrationMissing.push('skus');
    if (migrationMissing.length > 0)
      return adminError('MIGRATION_INCOMPLETE', 'Canonical migration is incomplete', { missing: migrationMissing });
  }

  const parsed = await parseFurnitureEnvelope(input, current);
  if (!parsed.ok) return parsed.error;
  const { values, envelope } = parsed;

  if (await checkProductSlug(productId, values.slug)) return adminError('SLUG_TAKEN', 'Product slug is already in use');
  if (await checkArticleNumbers(productId, values))
    return adminError('ARTICLE_NUMBER_TAKEN', 'SKU article number is already in use');

  const category = await prisma.category.findUnique({
    where: { id: values.categoryId },
    select: { id: true, slug: true, turntableProductId: true },
  });
  if (!category) return adminError('VALIDATION_ERROR', 'Category not found');
  const roomIds = await resolveRoomIds(values.roomIds, current);
  if (!roomIds) return adminError('VALIDATION_ERROR', 'One or more rooms are not available');
  const groups = await resolveOptionGroups(values, current);
  if (!groups) return adminError('VALIDATION_ERROR', 'Option group or value is not available');
  const plan = buildSkuPlan(values, current, groups);
  if (!('updates' in plan)) return plan;

  const mediaOwnershipError = validateNewMediaPublicIds(values, current);
  if (mediaOwnershipError) return mediaOwnershipError;
  if (category.turntableProductId === productId && !turntableMediaComplete(values.media)) {
    return adminError('TURNTABLE_MEDIA_REQUIRED', 'Turntable-bound product requires one video, poster and fallback');
  }

  try {
    assertRuleV(envelope.detachOptionValueIds, envelope.detachOptionGroupIds, groups, plan, values);
  } catch (error) {
    if (error instanceof RuleVConflict)
      return adminError(error.code, 'Option link is still used by a sellable SKU', error.details);
    throw error;
  }

  const nextProductId = productId ?? 'new-product';
  const existingRoomIds = new Set((current?.rooms ?? []).map((room) => room.roomId));
  const nextRoomIds = new Set(roomIds);
  const removedRoomIds = [...existingRoomIds].filter((id) => !nextRoomIds.has(id));
  const addedRoomIds = [...nextRoomIds].filter((id) => !existingRoomIds.has(id));
  const existingGroupIds = new Set((current?.optionGroups ?? []).map((group) => group.optionGroupId));
  const detachedGroupIds = new Set(envelope.detachOptionGroupIds);
  const detachedValueIds = new Set(envelope.detachOptionValueIds);
  const addedGroupIds = groups
    .map((group) => group.id)
    .filter((id) => !existingGroupIds.has(id) && !detachedGroupIds.has(id));
  const existingValueKeys = new Set(
    (current?.optionGroups ?? []).flatMap((group) =>
      group.values.map((value) => `${group.optionGroupId}:${value.optionValueId}`),
    ),
  );
  const addedValues = groups.flatMap((group) =>
    group.values
      .filter(
        (value) =>
          !existingValueKeys.has(`${group.id}:${value.id}`) &&
          !detachedGroupIds.has(group.id) &&
          !detachedValueIds.has(value.id),
      )
      .map((value) => ({ productId: nextProductId, optionGroupId: group.id, optionValueId: value.id })),
  );
  const removedValueIds = envelope.detachOptionValueIds.filter((id) =>
    (current?.optionGroups ?? []).some((group) => group.values.some((value) => value.optionValueId === id)),
  );
  const removedGroupIds = envelope.detachOptionGroupIds.filter((id) => existingGroupIds.has(id));
  const removedSkuMediaIds = plan.removals.flatMap((sku) =>
    sku.media.map((media) => media.publicId).filter((id): id is string => Boolean(id)),
  );
  const gender = current?.gender ?? 'UNISEX';

  try {
    const result = await prisma.$transaction(async (txn) => {
      // Step 1: all reads that can refuse are complete before this callback writes.
      const product = productId
        ? await txn.product.update({ where: { id: productId }, data: canonicalScalarData(values, gender) })
        : await txn.product.create({ data: canonicalScalarData(values, gender) });
      const savedProductId = product.id;

      // Step 3: product rooms.
      if (removedRoomIds.length > 0) {
        await txn.productRoom.deleteMany({ where: { productId: savedProductId, roomId: { in: removedRoomIds } } });
      }
      if (addedRoomIds.length > 0) {
        await txn.productRoom.createMany({
          data: addedRoomIds.map((roomId) => ({ productId: savedProductId, roomId })),
        });
      }

      // Step 4: additive option links.
      if (addedGroupIds.length > 0) {
        await txn.productOptionGroup.createMany({
          data: addedGroupIds.map((optionGroupId) => ({ productId: savedProductId, optionGroupId })),
        });
      }
      if (addedValues.length > 0) {
        await txn.productOptionValue.createMany({
          data: addedValues.map((value) => ({ ...value, productId: savedProductId })),
        });
      }

      // Step 5: update kept SKUs, create new SKUs, then dispose of unreferenced removals.
      for (const { current: sku, next } of plan.updates) {
        await txn.sku.update({
          where: { id: sku.id },
          data: { price: next.price, oldPrice: next.oldPrice, active: next.active, articleNumber: next.articleNumber },
        });
      }
      for (const sku of plan.deactivations) {
        await txn.sku.update({ where: { id: sku.id }, data: { active: false } });
      }
      for (const sku of plan.removals) {
        await txn.skuMedia.deleteMany({ where: { skuId: sku.id } });
        await txn.skuOptionValue.deleteMany({ where: { skuId: sku.id } });
        await txn.sku.delete({ where: { id: sku.id } });
      }
      const createdSkuIds: string[] = [];
      for (const sku of plan.creates) {
        const created = await txn.sku.create({
          data: {
            productId: savedProductId,
            combinationKey: buildCombinationKey(sku.selectedOptions),
            articleNumber: sku.articleNumber,
            price: sku.price,
            oldPrice: sku.oldPrice,
            stock: sku.stock,
            active: sku.active,
          },
        });
        createdSkuIds.push(created.id);
        const selected = selectedIds(sku, groups) ?? [];
        if (selected.length > 0) {
          await txn.skuOptionValue.createMany({
            data: selected.map(({ optionGroupId, optionValueId }) => ({
              skuId: created.id,
              optionGroupId,
              optionValueId,
            })),
          });
        }
      }

      // Step 7: explicit subtractive links after SKU reconciliation.
      const sellableAfter = await txn.sku.findMany({
        where: { productId: savedProductId, active: true },
        select: { combinationKey: true, selections: { select: { optionGroupId: true, optionValueId: true } } },
      });
      for (const optionValueId of removedValueIds) {
        const blockers = sellableAfter.filter((sku) =>
          sku.selections.some((selection) => selection.optionValueId === optionValueId),
        );
        if (blockers.length > 0) {
          throw new RuleVConflict('OPTION_VALUE_IN_USE', {
            optionValueSlug:
              groups.flatMap((group) => group.values).find((value) => value.id === optionValueId)?.slug ??
              optionValueId,
            sellableSkuCount: blockers.length,
            blockingCombinationKeys: blockers.map((sku) => sku.combinationKey).slice(0, 20),
          });
        }
        await txn.productOptionValue.deleteMany({ where: { productId: savedProductId, optionValueId } });
      }
      for (const optionGroupId of removedGroupIds) {
        const blockers = sellableAfter.filter((sku) =>
          sku.selections.some((selection) => selection.optionGroupId === optionGroupId),
        );
        if (blockers.length > 0) {
          throw new RuleVConflict('OPTION_GROUP_IN_USE', {
            optionGroupSlug: groups.find((group) => group.id === optionGroupId)?.slug ?? optionGroupId,
            sellableSkuCount: blockers.length,
            blockingCombinationKeys: blockers.map((sku) => sku.combinationKey).slice(0, 20),
          });
        }
        await txn.productOptionGroup.deleteMany({ where: { productId: savedProductId, optionGroupId } });
      }

      // Step 8: aggregate fields; salesCount is intentionally absent.
      const activeSkus = await txn.sku.findMany({
        where: { productId: savedProductId, active: true },
        select: { price: true, oldPrice: true },
      });
      const minPrice = activeSkus.length > 0 ? Math.min(...activeSkus.map((sku) => sku.price)) : 0;
      const discountPct =
        activeSkus.length > 0
          ? Math.max(
              0,
              ...activeSkus.map((sku) =>
                sku.oldPrice && sku.oldPrice > sku.price
                  ? Math.round(((sku.oldPrice - sku.price) / sku.oldPrice) * 100)
                  : 0,
              ),
            )
          : 0;
      await txn.product.update({ where: { id: savedProductId }, data: { minPrice, discountPct } });

      // Step 9: replace canonical media after all aggregate writes. Delete first avoids
      // unique collisions when an operator reorders media rows.
      const retainedSkuIds = [...new Set([...plan.retained.map((sku) => sku.id), ...createdSkuIds])];
      const persistedProductMedia = await txn.productMedia.findMany({
        where: { productId: savedProductId },
        select: { id: true, kind: true, url: true, publicId: true, alt: true, sortOrder: true },
      });
      const persistedSkuMedia =
        retainedSkuIds.length > 0
          ? await txn.skuMedia.findMany({
              where: { skuId: { in: retainedSkuIds } },
              select: { id: true, kind: true, url: true, publicId: true, alt: true, sortOrder: true, skuId: true },
            })
          : [];

      const finalProductMedia = values.media.map(toAdminMediaInput);
      const finalSkuMedia = [
        ...plan.updates.map(({ current: sku, next }) => ({ skuId: sku.id, media: canonicalMediaForSku(next, sku) })),
        ...plan.deactivations.map((sku) => ({
          skuId: sku.id,
          media: canonicalSkuMediaValues(sku).map(toAdminMediaInput),
        })),
        ...plan.creates.map((sku, index) => ({
          skuId: createdSkuIds[index],
          media: (sku.media ?? []).map(toAdminMediaInput),
        })),
      ];
      const persistedProductMediaById = new Map(persistedProductMedia.map((media) => [media.id, media]));
      const persistedSkuMediaBySkuId = new Map<string, Map<string, (typeof persistedSkuMedia)[number]>>();
      for (const media of persistedSkuMedia) {
        const ownerMedia = persistedSkuMediaBySkuId.get(media.skuId) ?? new Map();
        ownerMedia.set(media.id, media);
        persistedSkuMediaBySkuId.set(media.skuId, ownerMedia);
      }
      for (const media of finalProductMedia) {
        const conflict = mediaOwnershipConflict(media, persistedProductMediaById);
        if (conflict) throw conflict;
      }
      for (const { skuId, media } of finalSkuMedia) {
        const persistedById = persistedSkuMediaBySkuId.get(skuId) ?? new Map();
        for (const item of media) {
          const conflict = mediaOwnershipConflict(item, persistedById);
          if (conflict) throw conflict;
        }
      }
      const beforePublicIds = [
        ...persistedProductMedia.map((media) => media.publicId),
        ...persistedSkuMedia.map((media) => media.publicId),
        ...removedSkuMediaIds,
      ].filter((id): id is string => id !== null && isEvironnPublicId(id));
      const afterPublicIds = [
        ...finalProductMedia.map((media) => media.publicId),
        ...finalSkuMedia.flatMap(({ media }) => media.map((item) => item.publicId)),
      ].filter((id): id is string => Boolean(id));
      const afterSet = new Set(afterPublicIds);
      const publicIdsToDestroy = [...new Set(beforePublicIds.filter((id) => !afterSet.has(id)))];

      if (persistedProductMedia.length > 0 || finalProductMedia.length > 0) {
        await txn.productMedia.deleteMany({ where: { productId: savedProductId } });
        if (finalProductMedia.length > 0) {
          await txn.productMedia.createMany({
            data: finalProductMedia.map((media) => ({
              productId: savedProductId,
              kind: media.kind,
              url: media.url,
              publicId: media.publicId,
              alt: media.alt,
              sortOrder: media.sortOrder,
            })),
          });
        }
      }
      for (const { skuId, media } of finalSkuMedia) {
        await txn.skuMedia.deleteMany({ where: { skuId } });
        if (media.length > 0) {
          await txn.skuMedia.createMany({
            data: media.map((item) => ({
              skuId,
              kind: item.kind,
              url: item.url,
              publicId: item.publicId,
              alt: item.alt,
              sortOrder: item.sortOrder,
            })),
          });
        }
      }

      return {
        productId: savedProductId,
        skuCount: plan.updates.length + plan.creates.length + plan.deactivations.length,
        deactivatedSkuIds: plan.deactivations.map((sku) => sku.id),
        createdSkuIds,
        publicIdsToDestroy,
      };
    });
    const warnings = [...plan.warnings, ...(await destroyMediaAfterCommit(result.publicIdsToDestroy))];
    revalidateFurnitureProduct(result.productId);
    return adminOk(
      { productId: result.productId, skuCount: result.skuCount, deactivatedSkuIds: result.deactivatedSkuIds },
      warnings,
    );
  } catch (error) {
    if (error instanceof RuleVConflict)
      return adminError(error.code, 'Option link is still used by a sellable SKU', error.details);
    if (error instanceof MediaOwnershipConflict)
      return adminError('MEDIA_OWNERSHIP_REJECTED', 'Media public ID is not owned by Evironn', {
        publicIdKind: error.publicIdKind,
      });
    const mappedP2002 = canonicalP2002(error);
    if (mappedP2002) return mappedP2002;
    throw error;
  }
}

export async function setProductActive(input: unknown): Promise<AdminActionResult<ProductActiveResult>> {
  const gate = await requireAdminAction();
  if (!gate.ok) return adminError('UNEXPECTED', gate.error);
  const parsed = productToggleSchema.safeParse(input);
  if (!parsed.success) return adminError('VALIDATION_ERROR', firstError(parsed.error));
  const productId = parsed.data.productId ?? parsed.data.id!;
  const product = await loadCanonicalProduct(productId);
  if (!product) return adminError('NOT_FOUND', 'Product not found');
  if (!parsed.data.active) {
    const lock = turntableLock(product);
    if (lock) return lock;
  }
  await prisma.$transaction(async (txn) => {
    await txn.product.update({ where: { id: productId }, data: { active: parsed.data.active } });
  });
  revalidateFurnitureProduct(productId);
  return adminOk({ productId, active: parsed.data.active });
}

export async function deleteFurnitureProduct(input: unknown): Promise<AdminActionResult<null>> {
  const gate = await requireAdminAction();
  if (!gate.ok) return adminError('UNEXPECTED', gate.error);
  const parsed = productIdSchema.safeParse(input);
  if (!parsed.success) return adminError('VALIDATION_ERROR', firstError(parsed.error));
  const productId =
    typeof parsed.data === 'string' ? parsed.data : 'productId' in parsed.data ? parsed.data.productId : parsed.data.id;
  const product = await loadCanonicalProduct(productId);
  if (!product) return adminError('NOT_FOUND', 'Product not found');
  const lock = turntableLock(product);
  if (lock) return lock;
  const references = await productReferences(product);
  if (references.referencedSkuCount || references.referencedLegacyVariantCount || references.referencedWishlistCount) {
    return adminError('PRODUCT_HAS_REFERENCES', 'Product has references; deactivate it instead', references);
  }

  const mediaIds = [
    ...product.media.map((media) => media.publicId).filter((id): id is string => Boolean(id)),
    ...product.skus.flatMap((sku) =>
      sku.media.map((media) => media.publicId).filter((id): id is string => Boolean(id)),
    ),
    ...product.colorways.flatMap((colorway) =>
      colorway.images.map((image) => image.publicId).filter((id): id is string => Boolean(id)),
    ),
  ];
  await prisma.$transaction(async (txn) => {
    const skuIds = product.skus.map((sku) => sku.id);
    const colorwayIds = product.colorways.map((colorway) => colorway.id);
    if (skuIds.length > 0) {
      await txn.skuMedia.deleteMany({ where: { skuId: { in: skuIds } } });
      await txn.skuOptionValue.deleteMany({ where: { skuId: { in: skuIds } } });
      await txn.sku.deleteMany({ where: { id: { in: skuIds } } });
    }
    await txn.productMedia.deleteMany({ where: { productId } });
    await txn.productOptionValue.deleteMany({ where: { productId } });
    await txn.productOptionGroup.deleteMany({ where: { productId } });
    await txn.productRoom.deleteMany({ where: { productId } });
    if (colorwayIds.length > 0) {
      await txn.productVariant.deleteMany({ where: { colorwayId: { in: colorwayIds } } });
      await txn.productImage.deleteMany({ where: { colorwayId: { in: colorwayIds } } });
      await txn.productColorway.deleteMany({ where: { id: { in: colorwayIds } } });
    }
    await txn.product.delete({ where: { id: productId } });
  });
  const warnings = await destroyMediaAfterCommit(mediaIds);
  revalidateFurnitureProduct(productId);
  return adminOk(null, warnings);
}
