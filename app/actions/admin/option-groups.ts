'use server';

import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { requireAdminAction } from '@/lib/admin/require-admin';
import { prisma } from '@/lib/prisma-client';
import { adminError, adminOk, type AdminActionResult } from '@/lib/admin/action-result';
import { optionGroupSchema, type OptionGroupValues } from '@/services/dto/option-group.dto';
import { z } from 'zod';

const OPTIONS_PATH = '/admin/catalog/options';
const PRODUCTS_PATH = '/admin/catalog/products';
type SaveOptionGroupResult = AdminActionResult<{ id: string }>;
const reorderSchema = z.object({
  ids: z.array(z.string().trim().min(1)).superRefine((ids, ctx) => {
    if (new Set(ids).size !== ids.length)
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Группы не должны повторяться' });
  }),
});
const deleteSchema = z.object({ id: z.string().trim().min(1) });

function validationMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Проверьте поля';
}

function refsDetails(products: number, values: number, skuSelections: number) {
  const referencedBy: string[] = [];
  if (products > 0) referencedBy.push(`products:${products}`);
  if (values > 0) referencedBy.push(`values:${values}`);
  if (skuSelections > 0) referencedBy.push(`skuSelections:${skuSelections}`);
  return { referencedBy };
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

function isForeignKeyViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003';
}

function orderedValues(values: OptionGroupValues['values']) {
  return [...values]
    .sort((a, b) => a.sortOrder - b.sortOrder || a.slug.localeCompare(b.slug))
    .map((value, index) => ({ ...value, sortOrder: index }));
}

async function checkValueReferences(valueId: string) {
  const [products, skuSelections] = await Promise.all([
    prisma.productOptionValue.count({ where: { optionValueId: valueId } }),
    prisma.skuOptionValue.count({ where: { optionValueId: valueId } }),
  ]);
  return { products, skuSelections };
}

export async function saveOptionGroup(input: unknown): Promise<SaveOptionGroupResult> {
  const gate = await requireAdminAction();
  if (!gate.ok) return adminError('UNEXPECTED', gate.error);

  const parsed = optionGroupSchema.safeParse(input);
  if (!parsed.success) return adminError('VALIDATION_ERROR', validationMessage(parsed.error));
  const value = parsed.data;

  const groupConflict = await prisma.optionGroup.findFirst({
    where: { slug: value.slug, ...(value.id ? { id: { not: value.id } } : {}) },
    select: { id: true },
  });
  if (groupConflict) return adminError('SLUG_TAKEN', 'Slug группы уже занят');

  let currentValues: { id: string; name: string; slug: string; swatchHex: string | null; sortOrder: number }[] = [];
  if (value.id) {
    const existing = await prisma.optionGroup.findUnique({ where: { id: value.id }, select: { id: true } });
    if (!existing) return adminError('NOT_FOUND', 'Группа опций не найдена');
    currentValues = await prisma.optionValue.findMany({
      where: { optionGroupId: value.id },
      select: { id: true, name: true, slug: true, swatchHex: true, sortOrder: true },
    });
  }

  const currentById = new Map(currentValues.map((item) => [item.id, item]));
  for (const submitted of value.values) {
    if (submitted.id && !currentById.has(submitted.id)) return adminError('NOT_FOUND', 'Значение опции не найдено');
    if (!value.id) continue;
    const conflict = await prisma.optionValue.findFirst({
      where: {
        optionGroupId: value.id,
        slug: submitted.slug,
        ...(submitted.id ? { id: { not: submitted.id } } : {}),
      },
      select: { id: true },
    });
    if (conflict) return adminError('SLUG_TAKEN', 'Slug значения уже занят');
  }

  const submittedIds = new Set(value.values.flatMap((item) => (item.id ? [item.id] : [])));
  const removed = currentValues.filter((item) => !submittedIds.has(item.id));
  for (const item of removed) {
    const refs = await checkValueReferences(item.id);
    if (refs.products > 0 || refs.skuSelections > 0) {
      return adminError(
        'OPTION_VALUE_IN_USE',
        'Значение опции используется',
        refsDetails(refs.products, 0, refs.skuSelections),
      );
    }
  }

  try {
    const groupId = await prisma.$transaction(async (tx) => {
      const group = value.id
        ? await tx.optionGroup.update({
            where: { id: value.id },
            data: { name: value.name, slug: value.slug, sortOrder: value.sortOrder },
          })
        : await tx.optionGroup.create({
            data: { name: value.name, slug: value.slug, sortOrder: value.sortOrder },
          });
      const id = group.id;
      if (removed.length) {
        await tx.optionValue.deleteMany({ where: { optionGroupId: id, id: { in: removed.map((item) => item.id) } } });
      }
      for (const item of orderedValues(value.values)) {
        if (item.id) {
          await tx.optionValue.update({
            where: { id: item.id },
            data: { name: item.name, slug: item.slug, swatchHex: item.swatchHex, sortOrder: item.sortOrder },
          });
        } else {
          await tx.optionValue.create({
            data: {
              optionGroupId: id,
              name: item.name,
              slug: item.slug,
              swatchHex: item.swatchHex,
              sortOrder: item.sortOrder,
            },
          });
        }
      }
      return id;
    });
    revalidatePath(OPTIONS_PATH);
    revalidatePath(PRODUCTS_PATH);
    return adminOk({ id: groupId });
  } catch (error) {
    if (isUniqueViolation(error)) return adminError('SLUG_TAKEN', 'Slug уже занят');
    if (isForeignKeyViolation(error)) return adminError('OPTION_VALUE_IN_USE', 'Значение опции используется');
    return adminError('UNEXPECTED', 'Не удалось сохранить группу опций');
  }
}

export async function deleteOptionGroup(input: unknown): Promise<AdminActionResult<null>> {
  const gate = await requireAdminAction();
  if (!gate.ok) return adminError('UNEXPECTED', gate.error);

  const parsed = deleteSchema.safeParse(input);
  if (!parsed.success) return adminError('VALIDATION_ERROR', validationMessage(parsed.error));

  const existing = await prisma.optionGroup.findUnique({ where: { id: parsed.data.id }, select: { id: true } });
  if (!existing) return adminError('NOT_FOUND', 'Группа опций не найдена');
  const [productGroupCount, values, skuSelections] = await Promise.all([
    prisma.productOptionGroup.count({ where: { optionGroupId: parsed.data.id } }),
    prisma.productOptionValue.count({ where: { optionGroupId: parsed.data.id } }),
    prisma.skuOptionValue.count({ where: { optionGroupId: parsed.data.id } }),
  ]);
  const products =
    typeof (existing as { _count?: { products?: number } })._count?.products === 'number'
      ? (existing as unknown as { _count: { products: number } })._count.products
      : productGroupCount;
  if (products > 0 || values > 0 || skuSelections > 0) {
    return adminError('OPTION_GROUP_IN_USE', 'Группа используется', refsDetails(products, values, skuSelections));
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.optionGroup.delete({ where: { id: parsed.data.id } });
    });
    revalidatePath(OPTIONS_PATH);
    revalidatePath(PRODUCTS_PATH);
    return adminOk(null);
  } catch (error) {
    if (isForeignKeyViolation(error)) return adminError('OPTION_GROUP_IN_USE', 'Группа используется');
    return adminError('UNEXPECTED', 'Не удалось удалить группу опций');
  }
}

export async function reorderOptionGroups(input: unknown): Promise<AdminActionResult<null>> {
  const gate = await requireAdminAction();
  if (!gate.ok) return adminError('UNEXPECTED', gate.error);

  const parsed = reorderSchema.safeParse(input);
  if (!parsed.success) return adminError('VALIDATION_ERROR', validationMessage(parsed.error));
  const groups = await prisma.optionGroup.findMany({ select: { id: true } });
  const existingIds = new Set(groups.map((group) => group.id));
  if (parsed.data.ids.some((id) => !existingIds.has(id)) || parsed.data.ids.length !== groups.length) {
    return adminError('NOT_FOUND', 'Группа опций не найдена');
  }

  try {
    await prisma.$transaction(async (tx) => {
      for (const [sortOrder, id] of parsed.data.ids.entries()) {
        await tx.optionGroup.update({ where: { id }, data: { sortOrder } });
      }
    });
    revalidatePath(OPTIONS_PATH);
    revalidatePath(PRODUCTS_PATH);
    return adminOk(null);
  } catch {
    return adminError('UNEXPECTED', 'Не удалось изменить порядок групп опций');
  }
}
