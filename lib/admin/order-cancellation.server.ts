import type { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma-client';
import { runSerializableOrderTransaction, OrderTransactionConflictError } from '@/lib/order';
import { canAdminCancel } from '@/lib/order-admin';
import { adjustSalesCountInTransaction } from '@/lib/sales-count';
import { adminError, adminOk, type AdminActionResult } from '@/lib/admin/action-result';
import { adminOrderCancelSchema } from '@/services/dto/order-admin.dto';

const cancellationOrderInclude = {
  items: {
    include: {
      canonicalSku: { select: { id: true, productId: true } },
      productVariant: { select: { id: true, colorway: { select: { productId: true } } } },
    },
  },
  payment: true,
} as const;

type CancellationOrder = Prisma.OrderGetPayload<{ include: typeof cancellationOrderInclude }>;

export type ResolvedCancelledOrderItem = {
  kind: 'canonical' | 'legacy';
  inventoryId: string;
  productId: string;
  quantity: number;
};

type CancellationFailure =
  | { kind: 'blocked'; reason: string; message: string }
  | { kind: 'stale'; message: string }
  | { kind: 'not-found'; message: string };

function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

export function resolveCancelledOrderInventoryReferences(
  items: ReadonlyArray<{
    quantity: number;
    skuId: string | null;
    canonicalSku: { id: string; productId: string } | null;
    productVariantId: string | null;
    productVariant: { id: string; colorway: { productId: string } } | null;
  }>,
): { ok: true; items: ResolvedCancelledOrderItem[] } | { ok: false; reason: 'INVALID_INVENTORY_REFERENCE' } {
  const resolved: ResolvedCancelledOrderItem[] = [];

  for (const item of items) {
    if (!isPositiveInteger(item.quantity)) return { ok: false, reason: 'INVALID_INVENTORY_REFERENCE' };

    const hasCanonicalReference = item.skuId !== null || item.canonicalSku !== null;
    const hasLegacyReference = item.productVariantId !== null || item.productVariant !== null;
    if (hasCanonicalReference === hasLegacyReference) {
      return { ok: false, reason: 'INVALID_INVENTORY_REFERENCE' };
    }

    if (hasCanonicalReference) {
      if (
        item.skuId === null ||
        item.canonicalSku === null ||
        item.canonicalSku.id !== item.skuId ||
        item.productVariantId !== null ||
        item.productVariant !== null
      ) {
        return { ok: false, reason: 'INVALID_INVENTORY_REFERENCE' };
      }
      resolved.push({
        kind: 'canonical',
        inventoryId: item.canonicalSku.id,
        productId: item.canonicalSku.productId,
        quantity: item.quantity,
      });
      continue;
    }

    if (
      item.productVariantId === null ||
      item.productVariant === null ||
      item.productVariant.id !== item.productVariantId ||
      item.skuId !== null ||
      item.canonicalSku !== null
    ) {
      return { ok: false, reason: 'INVALID_INVENTORY_REFERENCE' };
    }
    resolved.push({
      kind: 'legacy',
      inventoryId: item.productVariant.id,
      productId: item.productVariant.colorway.productId,
      quantity: item.quantity,
    });
  }

  return { ok: true, items: resolved };
}

export async function restoreCancelledOrderInventory(
  transaction: Pick<Prisma.TransactionClient, 'sku' | 'productVariant' | 'product'>,
  items: ReadonlyArray<ResolvedCancelledOrderItem>,
): Promise<void> {
  for (const item of items) {
    if (item.kind === 'canonical') {
      await transaction.sku.update({
        where: { id: item.inventoryId },
        data: { stock: { increment: item.quantity } },
      });
    } else {
      await transaction.productVariant.update({
        where: { id: item.inventoryId },
        data: { stock: { increment: item.quantity } },
      });
    }
  }

  await adjustSalesCountInTransaction(transaction, items, -1);
}

function failureFromReason(failure: CancellationFailure): AdminActionResult<never> {
  if (failure.kind === 'blocked') {
    return adminError('ORDER_CANCELLATION_BLOCKED', failure.message, { reason: failure.reason });
  }
  if (failure.kind === 'not-found') return adminError('NOT_FOUND', failure.message);
  return adminError('STALE_VALUE', failure.message);
}

function isCancellationFailure(error: unknown): error is Error & { failure: CancellationFailure } {
  return Boolean(error && typeof error === 'object' && 'failure' in error);
}

function throwCancellationFailure(failure: CancellationFailure): never {
  throw Object.assign(new Error(failure.message), { failure });
}

function cancellationOrderInput(order: CancellationOrder) {
  return {
    status: order.status,
    paymentInitializationState: order.paymentInitializationState,
    paymentInitializationClaimedAt: order.paymentInitializationClaimedAt,
    paymentEverDispatchedAt: order.paymentEverDispatchedAt,
    payment: order.payment ? { status: order.payment.status } : null,
  };
}

export async function cancelOrderAsAdmin(
  input: unknown,
): Promise<AdminActionResult<{ status: 'CANCELLED'; stockRestored: true }>> {
  const parsed = adminOrderCancelSchema.safeParse(input);
  if (!parsed.success) return adminError('VALIDATION_ERROR', 'Некорректные данные отмены заказа');

  const { orderId, expectedStatus } = parsed.data;
  try {
    const committed = await runSerializableOrderTransaction(prisma, async (transaction) => {
      const order = await transaction.order.findUnique({
        where: { id: orderId },
        include: cancellationOrderInclude,
      });
      if (!order) {
        throwCancellationFailure({ kind: 'not-found', message: 'Заказ не найден' });
      }

      const decision = canAdminCancel(cancellationOrderInput(order));
      if (!decision.ok) {
        throwCancellationFailure({
          kind: 'blocked',
          reason: decision.reason,
          message: 'Этот заказ нельзя отменить по текущему статусу или платёжным признакам',
        });
      }
      if (order.status !== expectedStatus) {
        throwCancellationFailure({ kind: 'stale', message: 'Статус заказа изменился, обновите страницу' });
      }

      const resolved = resolveCancelledOrderInventoryReferences(order.items);
      if (!resolved.ok) {
        throwCancellationFailure({
          kind: 'blocked',
          reason: resolved.reason,
          message: 'У заказа повреждена ссылка на складскую позицию',
        });
      }

      const updated = await transaction.order.updateMany({
        where: { id: orderId, status: expectedStatus },
        data: { status: 'CANCELLED' },
      });
      if (updated.count === 0) {
        throwCancellationFailure({ kind: 'stale', message: 'Статус заказа изменился, обновите страницу' });
      }

      await restoreCancelledOrderInventory(
        transaction as unknown as Pick<Prisma.TransactionClient, 'sku' | 'productVariant' | 'product'>,
        resolved.items,
      );
      return { orderNumber: order.orderNumber, userId: order.userId };
    });

    revalidatePath('/admin/orders');
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath('/admin/customers');
    revalidatePath(`/admin/customers/${committed.userId}`);
    revalidatePath('/profile');
    revalidatePath(`/orders/${committed.orderNumber}`);
    return adminOk({ status: 'CANCELLED', stockRestored: true });
  } catch (error) {
    if (isCancellationFailure(error)) return failureFromReason(error.failure);
    if (error instanceof OrderTransactionConflictError) {
      return adminError('STALE_VALUE', 'Заказ изменялся одновременно, обновите страницу');
    }
    return adminError('UNEXPECTED', 'Не удалось отменить заказ');
  }
}
