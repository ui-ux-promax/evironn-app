'use server';

import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { adminError, adminOk, type AdminActionResult } from '@/lib/admin/action-result';
import { prisma } from '@/lib/prisma-client';
import { requireAdminAction } from '@/lib/admin/require-admin';
import { roomSchema, type RoomValues } from '@/services/dto/room.dto';
import { z } from 'zod';

const ROOMS_PATH = '/admin/catalog/rooms';
const PRODUCTS_PATH = '/admin/catalog/products';
type SaveRoomResult = AdminActionResult<{ id: string }>;

const deleteSchema = z.object({ id: z.string().trim().min(1) });
const reorderSchema = z.object({
  ids: z.array(z.string().trim().min(1)).superRefine((ids, ctx) => {
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Комнаты не должны повторяться' });
    }
  }),
});

function validationMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Проверьте поля';
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

async function normalizeRoomOrdering(tx: { room: Pick<typeof prisma.room, 'findMany' | 'update'> }): Promise<void> {
  const rooms = await tx.room.findMany({
    orderBy: [{ sortOrder: 'asc' }, { slug: 'asc' }],
    select: { id: true },
  });
  for (const [sortOrder, room] of rooms.entries()) {
    await tx.room.update({ where: { id: room.id }, data: { sortOrder } });
  }
}

async function getRoomSlugConflict(value: RoomValues) {
  return prisma.room.findFirst({
    where: { slug: value.slug, ...(value.id ? { id: { not: value.id } } : {}) },
    select: { id: true },
  });
}

export async function saveRoom(input: unknown): Promise<SaveRoomResult> {
  const gate = await requireAdminAction();
  if (!gate.ok) return adminError('UNEXPECTED', gate.error);

  const parsed = roomSchema.safeParse(input);
  if (!parsed.success) return adminError('VALIDATION_ERROR', validationMessage(parsed.error));
  const value = parsed.data;

  const conflict = await getRoomSlugConflict(value);
  if (conflict) return adminError('SLUG_TAKEN', 'Slug комнаты уже занят');
  if (value.id) {
    const existing = await prisma.room.findUnique({ where: { id: value.id }, select: { id: true } });
    if (!existing) return adminError('NOT_FOUND', 'Комната не найдена');
  }

  try {
    const id = await prisma.$transaction(async (tx) => {
      const room = await tx.room.upsert({
        where: { id: value.id ?? '' },
        create: { name: value.name, slug: value.slug, sortOrder: value.sortOrder },
        update: { name: value.name, slug: value.slug, sortOrder: value.sortOrder },
        select: { id: true },
      });
      await normalizeRoomOrdering(tx);
      return room.id;
    });
    revalidatePath(ROOMS_PATH);
    revalidatePath(PRODUCTS_PATH);
    return adminOk({ id });
  } catch (error) {
    if (isUniqueViolation(error)) return adminError('SLUG_TAKEN', 'Slug комнаты уже занят');
    return adminError('UNEXPECTED', 'Не удалось сохранить комнату');
  }
}

export async function deleteRoom(input: unknown): Promise<AdminActionResult<null>> {
  const gate = await requireAdminAction();
  if (!gate.ok) return adminError('UNEXPECTED', gate.error);

  const parsed = deleteSchema.safeParse(input);
  if (!parsed.success) return adminError('VALIDATION_ERROR', validationMessage(parsed.error));

  const productCount = await prisma.productRoom.count({ where: { roomId: parsed.data.id } });
  if (productCount > 0) {
    return adminError('ROOM_HAS_PRODUCTS', 'Комната используется товарами', { productCount });
  }
  const existing = await prisma.room.findUnique({ where: { id: parsed.data.id }, select: { id: true } });
  if (!existing) return adminError('NOT_FOUND', 'Комната не найдена');

  try {
    await prisma.$transaction(async (tx) => {
      await tx.room.delete({ where: { id: parsed.data.id } });
      await normalizeRoomOrdering(tx);
    });
    revalidatePath(ROOMS_PATH);
    revalidatePath(PRODUCTS_PATH);
    return adminOk(null);
  } catch {
    return adminError('UNEXPECTED', 'Не удалось удалить комнату');
  }
}

export async function reorderRooms(input: unknown): Promise<AdminActionResult<null>> {
  const gate = await requireAdminAction();
  if (!gate.ok) return adminError('UNEXPECTED', gate.error);

  const parsed = reorderSchema.safeParse(input);
  if (!parsed.success) return adminError('VALIDATION_ERROR', validationMessage(parsed.error));

  const rooms = await prisma.room.findMany({ select: { id: true } });
  const existingIds = new Set(rooms.map((room) => room.id));
  if (parsed.data.ids.length !== rooms.length || parsed.data.ids.some((id) => !existingIds.has(id))) {
    return adminError('NOT_FOUND', 'Комната не найдена');
  }

  try {
    await prisma.$transaction(async (tx) => {
      for (const [sortOrder, id] of parsed.data.ids.entries()) {
        await tx.room.update({ where: { id }, data: { sortOrder } });
      }
    });
    revalidatePath(ROOMS_PATH);
    revalidatePath(PRODUCTS_PATH);
    return adminOk(null);
  } catch {
    return adminError('UNEXPECTED', 'Не удалось изменить порядок комнат');
  }
}
