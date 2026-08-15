'use server';

import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma-client';

const addressSchema = z.object({
  label: z.string().trim().min(1).max(40).default('Дом'),
  city: z.string().trim().min(1).max(100),
  street: z.string().trim().min(1).max(200),
  comment: z.string().trim().max(200).optional().nullable(),
});

const orderAddressSchema = z.object({
  city: z.string().trim().min(1).max(100),
  street: z.string().trim().min(1).max(200),
  comment: z.string().trim().max(200).optional().nullable(),
});

const ADDRESS_TRANSACTION_ATTEMPTS = 3;

export type AddressResult = { ok: true; id: string } | { ok: false; error: string };
export type AddressMutationResult = { ok: true } | { ok: false; error: string };

class AddressNotFoundError extends Error {
  constructor() {
    super('Адрес не найден');
    this.name = 'AddressNotFoundError';
  }
}

function isP2034(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === 'P2034');
}

function isAddressNotFound(error: unknown): boolean {
  return error instanceof AddressNotFoundError;
}

async function withSerializableAddressRetry<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= ADDRESS_TRANSACTION_ATTEMPTS; attempt += 1) {
    try {
      return await prisma.$transaction(async (tx) => operation(tx as unknown as Prisma.TransactionClient), {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      lastError = error;
      if (!isP2034(error) || attempt === ADDRESS_TRANSACTION_ATTEMPTS) throw error;
    }
  }
  throw lastError;
}

type OwnedAddress = { id: string; isDefault: boolean; createdAt: Date };

async function readOwnedAddresses(tx: Prisma.TransactionClient, userId: string): Promise<OwnedAddress[]> {
  return tx.address.findMany({
    where: { userId },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    select: { id: true, isDefault: true, createdAt: true },
  });
}

async function normalizeDefault(
  tx: Prisma.TransactionClient,
  userId: string,
  addresses: OwnedAddress[],
): Promise<void> {
  const preferred = addresses.find((address) => address.isDefault) ?? addresses[0];
  if (!preferred) return;
  await tx.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
  await tx.address.update({ where: { id: preferred.id }, data: { isDefault: true } });
}

function mapAddressError(error: unknown): { ok: false; error: string } {
  if (isAddressNotFound(error)) return { ok: false, error: 'Адрес не найден' };
  if (isP2034(error)) return { ok: false, error: 'Не удалось обновить адреса' };
  return { ok: false, error: 'Не удалось обновить адреса' };
}

export async function addAddress(raw: unknown): Promise<AddressResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: 'Не авторизован' };

  const parsed = addressSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'Проверьте поля' };

  try {
    const id = await withSerializableAddressRetry(async (tx) => {
      const owned = await readOwnedAddresses(tx, session.user.id);
      if (owned.length > 0) await normalizeDefault(tx, session.user.id, owned);
      const address = await tx.address.create({
        data: {
          userId: session.user.id,
          label: parsed.data.label,
          city: parsed.data.city,
          street: parsed.data.street,
          comment: parsed.data.comment ?? null,
          isDefault: owned.length === 0,
        },
        select: { id: true },
      });
      return address.id;
    });
    revalidatePath('/profile');
    return { ok: true, id };
  } catch (error) {
    return mapAddressError(error);
  }
}

export async function deleteAddress(id: string): Promise<AddressMutationResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: 'Не авторизован' };

  try {
    await withSerializableAddressRetry(async (tx) => {
      const owned = await readOwnedAddresses(tx, session.user.id);
      const target = owned.find((address) => address.id === id);
      if (!target) throw new AddressNotFoundError();

      await tx.address.delete({ where: { id: target.id } });
      const remaining = owned.filter((address) => address.id !== target.id);
      if (remaining.length > 0) await normalizeDefault(tx, session.user.id, remaining);
    });
    revalidatePath('/profile');
    return { ok: true };
  } catch (error) {
    return mapAddressError(error);
  }
}

export async function setDefaultAddress(id: string): Promise<AddressMutationResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: 'Не авторизован' };

  try {
    await withSerializableAddressRetry(async (tx) => {
      const owned = await readOwnedAddresses(tx, session.user.id);
      const target = owned.find((address) => address.id === id);
      if (!target) throw new AddressNotFoundError();
      await tx.address.updateMany({ where: { userId: session.user.id, isDefault: true }, data: { isDefault: false } });
      await tx.address.update({ where: { id: target.id }, data: { isDefault: true } });
    });
    revalidatePath('/profile');
    return { ok: true };
  } catch (error) {
    return mapAddressError(error);
  }
}

export async function saveAddressFromOrder(raw: unknown): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;
  const parsed = orderAddressSchema.safeParse(raw);
  if (!parsed.success) return;

  try {
    const created = await withSerializableAddressRetry(async (tx) => {
      const existing = await tx.address.findFirst({
        where: { userId: session.user.id, city: parsed.data.city, street: parsed.data.street },
        select: { id: true },
      });
      if (existing) return false;

      const owned = await readOwnedAddresses(tx, session.user.id);
      if (owned.length > 0) await normalizeDefault(tx, session.user.id, owned);
      await tx.address.create({
        data: {
          userId: session.user.id,
          label: owned.length === 0 ? 'Дом' : 'Доставка',
          city: parsed.data.city,
          street: parsed.data.street,
          comment: parsed.data.comment ?? null,
          isDefault: owned.length === 0,
        },
        select: { id: true },
      });
      return true;
    });
    if (created) revalidatePath('/profile');
  } catch {
    // Order completion must not fail solely because saving a convenience address conflicted.
  }
}
