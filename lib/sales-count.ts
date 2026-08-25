import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma-client';
import { logger } from '@/lib/logger';
import { salesDeltaByProduct } from '@/lib/product-aggregates';

// Двигает денормализованный Product.salesCount (популярность каталога). Один update на товар
// (агрегируем quantity по productId). sign=+1 при оформлении заказа, sign=-1 при отмене —
// симметрично стоку. Best-effort: сбой логируется, но НЕ пробрасывается (популярность ≠
// деньги/сток; заказ уже создан/отменён, ломать его из-за счётчика нельзя).
export async function adjustSalesCount(
  items: ReadonlyArray<{ productId: string; quantity: number }>,
  sign: 1 | -1,
): Promise<void> {
  const delta = salesDeltaByProduct(items);
  for (const [productId, qty] of delta) {
    try {
      await prisma.product.update({
        where: { id: productId },
        data: { salesCount: { increment: sign * qty } },
      });
    } catch (e) {
      logger.error('sales_count_adjust_failed', e, { productId, sign });
    }
  }
}

export async function adjustSalesCountInTransaction(
  transaction: Pick<Prisma.TransactionClient, 'product'>,
  items: ReadonlyArray<{ productId: string; quantity: number }>,
  sign: 1 | -1,
): Promise<void> {
  const delta = salesDeltaByProduct(items);
  for (const [productId, quantity] of delta) {
    await transaction.product.update({
      where: { id: productId },
      data: { salesCount: { increment: sign * quantity } },
    });
  }
}
