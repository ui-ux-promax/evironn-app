'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { adminError, adminOk, type AdminActionResult } from '@/lib/admin/action-result';
import { requireAdminAction } from '@/lib/admin/require-admin';
import { prisma } from '@/lib/prisma-client';

const STOCK_PATH = '/admin/catalog/stock';
const PRODUCTS_PATH = '/admin/catalog/products';
type SkuStockResult = { skuId: string; stock: number };

const stockInputSchema = z
  .object({
    skuId: z.string().trim().min(1),
    expectedStock: z.number().int().nonnegative(),
    nextStock: z.number().int().nonnegative(),
  })
  .strict();

function validationMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Проверьте остаток';
}

export async function setSkuStock(input: unknown): Promise<AdminActionResult<SkuStockResult>> {
  const gate = await requireAdminAction();
  if (!gate.ok) return adminError('UNEXPECTED', gate.error);

  const parsed = stockInputSchema.safeParse(input);
  if (!parsed.success) return adminError('VALIDATION_ERROR', validationMessage(parsed.error));

  const { skuId, expectedStock, nextStock } = parsed.data;

  try {
    const updated = await prisma.sku.updateMany({
      where: { id: skuId, stock: expectedStock },
      data: { stock: nextStock },
    });

    if (updated.count === 0) {
      const current = await prisma.sku.findUnique({ where: { id: skuId }, select: { stock: true } });
      if (!current) return adminError('NOT_FOUND', 'SKU не найден');
      return adminError('STALE_VALUE', 'Остаток уже изменён, обновите страницу', { currentStock: current.stock });
    }

    revalidatePath(STOCK_PATH);
    revalidatePath(PRODUCTS_PATH);
    return adminOk({ skuId, stock: nextStock });
  } catch {
    return adminError('UNEXPECTED', 'Не удалось обновить остаток');
  }
}
