'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { UserRole } from '@prisma/client';
import { Button } from '@/components/admin/ui/button';
import { Icon } from '@/components/admin/icon';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/admin/ui/dialog';
import { changeUserRoleFromForm, type RoleActionResult } from '@/app/actions/admin/customers';

type RoleToggleProps = {
  userId: string;
  currentRole: UserRole;
  isSelf?: boolean;
  isLastAdmin?: boolean;
};

export function RoleToggle({ userId, currentRole, isSelf = false, isLastAdmin = false }: RoleToggleProps) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [confirm, setConfirm] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const target: UserRole = currentRole === 'ADMIN' ? 'CUSTOMER' : 'ADMIN';
  const promoting = target === 'ADMIN';
  const blocked = !promoting && (isSelf || isLastAdmin);
  const blockedMessage = isSelf
    ? 'Нельзя снять роль администратора с самого себя'
    : 'Нельзя разжаловать последнего администратора';

  async function submitRoleChange(formData: FormData) {
    setBusy(true);
    const res: RoleActionResult = await changeUserRoleFromForm({ ok: true }, formData);
    setBusy(false);
    setConfirm(false);
    if (res.ok) router.refresh();
    else setError(res.error);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitRoleChange(new FormData(event.currentTarget));
  }

  if (blocked) {
    return (
      <div className="space-y-2">
        <form action={submitRoleChange}>
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="role" value={target} />
          <Button type="submit" variant="outline" className="w-full" disabled>
            <Icon name="lock" className="text-[18px]" />
            Снять роль администратора
          </Button>
        </form>
        <p className="text-xs text-admin-error" aria-live="polite">
          {blockedMessage}
        </p>
      </div>
    );
  }

  return (
    <div>
      <Button
        variant={promoting ? 'primary' : 'outline'}
        className="w-full"
        onClick={() => setConfirm(true)}
        disabled={busy}
      >
        <Icon name={promoting ? 'shield_person' : 'person_remove'} className="text-[18px]" />
        {promoting ? 'Назначить администратором' : 'Снять роль администратора'}
      </Button>

      <Dialog open={confirm} onOpenChange={(open) => !open && setConfirm(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{promoting ? 'Назначить администратором?' : 'Снять роль администратора?'}</DialogTitle>
            <DialogDescription>
              {promoting
                ? 'Пользователь получит полный доступ к админ-панели.'
                : 'Пользователь потеряет доступ к админ-панели и станет обычным клиентом.'}
            </DialogDescription>
          </DialogHeader>
          <form action={submitRoleChange} onSubmit={handleSubmit}>
            <input type="hidden" name="userId" value={userId} />
            <input type="hidden" name="role" value={target} />
            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setConfirm(false)} disabled={busy}>
                Назад
              </Button>
              <Button type="submit" variant={promoting ? 'primary' : 'danger'} loading={busy}>
                {promoting ? 'Назначить' : 'Снять роль'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={error !== null} onOpenChange={(open) => !open && setError(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Не удалось изменить роль</DialogTitle>
            <DialogDescription aria-live="polite">{error}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setError(null)}>
              Понятно
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
