import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/password', () => ({ hashPassword: vi.fn(), verifyPassword: vi.fn() }));
vi.mock('@/lib/prisma-client', () => ({
  prisma: { user: { findUnique: vi.fn(), update: vi.fn() } },
}));

import { auth } from '@/auth';
import { hashPassword, verifyPassword } from '@/lib/password';
import { prisma } from '@/lib/prisma-client';
import { updatePassword } from '@/app/actions/profile';

const authMock = auth as unknown as ReturnType<typeof vi.fn>;
const findUser = prisma.user.findUnique as unknown as ReturnType<typeof vi.fn>;
const updateUser = prisma.user.update as unknown as ReturnType<typeof vi.fn>;
const hashMock = hashPassword as unknown as ReturnType<typeof vi.fn>;
const verifyMock = verifyPassword as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  authMock.mockResolvedValue({ user: { id: 'u1' } });
  findUser.mockResolvedValue({ passwordHash: 'old-hash' });
  updateUser.mockResolvedValue({ id: 'u1' });
  verifyMock.mockResolvedValue(true);
  hashMock.mockResolvedValue('new-hash');
});

describe('updatePassword', () => {
  it('rejects unauthenticated callers and never reads or writes a password', async () => {
    authMock.mockResolvedValue(null);

    await expect(
      updatePassword({ currentPassword: 'old', newPassword: 'new-password', repeatPassword: 'new-password' }),
    ).resolves.toEqual({
      ok: false,
      error: 'Не авторизован',
    });
    expect(findUser).not.toHaveBeenCalled();
    expect(updateUser).not.toHaveBeenCalled();
  });

  it('requires the current password and verifies it before hashing the replacement', async () => {
    verifyMock.mockResolvedValue(false);

    const result = await updatePassword({
      currentPassword: 'wrong-password',
      newPassword: 'new-password',
      repeatPassword: 'new-password',
    });

    expect(result).toEqual({ ok: false, error: 'Текущий пароль неверный' });
    expect(verifyMock).toHaveBeenCalledWith('wrong-password', 'old-hash');
    expect(hashMock).not.toHaveBeenCalled();
    expect(updateUser).not.toHaveBeenCalled();
  });

  it('stores only the replacement hash and never accepts email mutation', async () => {
    const result = await updatePassword({
      currentPassword: 'old-password',
      newPassword: 'new-password',
      repeatPassword: 'new-password',
      email: 'attacker@example.com',
    } as never);

    expect(result).toEqual({ ok: true });
    expect(hashMock).toHaveBeenCalledWith('new-password');
    expect(updateUser).toHaveBeenCalledWith({ where: { id: 'u1' }, data: { passwordHash: 'new-hash' } });
    expect(JSON.stringify(updateUser.mock.calls[0][0])).not.toContain('attacker@example.com');
  });

  it('rejects replacement validation failures before touching the database', async () => {
    const result = await updatePassword({
      currentPassword: 'old-password',
      newPassword: 'short',
      repeatPassword: 'short',
    });

    expect(result).toEqual({ ok: false, error: 'Новый пароль должен быть не короче 8 символов' });
    expect(findUser).not.toHaveBeenCalled();
    expect(updateUser).not.toHaveBeenCalled();
  });

  it('returns a stable validation result for malformed input', async () => {
    await expect(updatePassword(null as never)).resolves.toEqual({ ok: false, error: 'Проверьте поля' });
    expect(findUser).not.toHaveBeenCalled();
    expect(updateUser).not.toHaveBeenCalled();
  });
});
