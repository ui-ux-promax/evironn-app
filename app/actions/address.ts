'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma-client';
import { z } from 'zod';

const addressSchema = z.object({
  label: z.string().trim().min(1).max(40).default('Дом'),
  city: z.string().trim().min(1).max(100),
  street: z.string().trim().min(1).max(200),
  comment: z.string().trim().max(200).optional().nullable(),
});

export type AddressResult = { ok: true; id: string } | { ok: false; error: string };

export async function addAddress(raw: unknown): Promise<AddressResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: 'Не авторизован' };

  const parsed = addressSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'Проверьте поля' };

  const { label, city, street, comment } = parsed.data;

  // If user has no addresses yet, make this one default
  const count = await prisma.address.count({ where: { userId: session.user.id } });
  const isDefault = count === 0;

  const addr = await prisma.address.create({
    data: { userId: session.user.id, label, city, street, comment: comment ?? null, isDefault },
  });

  revalidatePath('/profile');
  return { ok: true, id: addr.id };
}

export async function deleteAddress(id: string): Promise<{ ok: boolean }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false };
  await prisma.address.deleteMany({ where: { id, userId: session.user.id } });
  revalidatePath('/profile');
  return { ok: true };
}

export async function setDefaultAddress(id: string): Promise<{ ok: boolean }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false };
  await prisma.$transaction([
    prisma.address.updateMany({ where: { userId: session.user.id, isDefault: true }, data: { isDefault: false } }),
    prisma.address.update({ where: { id, userId: session.user.id }, data: { isDefault: true } }),
  ]);
  revalidatePath('/profile');
  return { ok: true };
}

export async function saveAddressFromOrder(raw: unknown): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;
  const parsed = z
    .object({ city: z.string(), street: z.string(), comment: z.string().optional().nullable() })
    .safeParse(raw);
  if (!parsed.success) return;

  // Dedup by city+street
  const existing = await prisma.address.findFirst({
    where: { userId: session.user.id, city: parsed.data.city, street: parsed.data.street },
  });
  if (existing) return;

  const count = await prisma.address.count({ where: { userId: session.user.id } });
  await prisma.address.create({
    data: {
      userId: session.user.id,
      label: count === 0 ? 'Дом' : 'Доставка',
      city: parsed.data.city,
      street: parsed.data.street,
      comment: parsed.data.comment ?? null,
      isDefault: count === 0,
    },
  });
  revalidatePath('/profile');
}
