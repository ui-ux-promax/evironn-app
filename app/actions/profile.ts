'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { hashPassword, verifyPassword } from '@/lib/password';
import { prisma } from '@/lib/prisma-client';
import { profileSchema } from '@/services/dto/auth.dto';

export type ProfileResult = { ok: true } | { ok: false; error: string };
export type PasswordResult = { ok: true } | { ok: false; error: string };

export async function updateProfile(raw: unknown): Promise<ProfileResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: 'Не авторизован' };

  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'Проверьте поля' };

  const { name, phone, birthdate } = parsed.data;
  // Пустые поля трактуем как «очистить» → null (а не пустая строка в БД).
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: name?.trim() ? name.trim() : null,
      phone: phone?.trim() ? phone.trim() : null,
      birthdate: birthdate ? new Date(birthdate) : null,
    },
  });
  revalidatePath('/profile');
  return { ok: true };
}

export async function updatePassword(raw: {
  currentPassword: string;
  newPassword: string;
  repeatPassword: string;
}): Promise<PasswordResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: 'Не авторизован' };

  const { currentPassword, newPassword, repeatPassword } = raw;

  if (!currentPassword) return { ok: false, error: 'Введите текущий пароль' };
  if (newPassword.length < 8) return { ok: false, error: 'Новый пароль должен быть не короче 8 символов' };
  if (newPassword.length > 72) return { ok: false, error: 'Новый пароль слишком длинный' };
  if (newPassword !== repeatPassword) return { ok: false, error: 'Пароли не совпадают' };
  if (currentPassword === newPassword) return { ok: false, error: 'Новый пароль должен отличаться от текущего' };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });

  if (!user?.passwordHash) return { ok: false, error: 'Для аккаунта не задан пароль' };

  const ok = await verifyPassword(currentPassword, user.passwordHash);
  if (!ok) return { ok: false, error: 'Текущий пароль неверный' };

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash },
  });

  return { ok: true };
}
