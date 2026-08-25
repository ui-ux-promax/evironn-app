import { notFound } from 'next/navigation';
import { requireAdminPage } from '@/lib/admin/require-admin';
import { prisma } from '@/lib/prisma-client';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminPanel } from '@/components/admin/admin-panel';
import { CouponForm } from '../../_components/coupon-form';

export const metadata = { title: 'Редактирование купона' };
export const dynamic = 'force-dynamic';

export default async function EditCouponPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) notFound();

  return (
    <div className="space-y-[24px]">
      <AdminPageHeader kicker="Маркетинг" title="Редактирование промокода" subtitle={coupon.code} />
      <AdminPanel title="Данные промокода">
        <CouponForm
          mode="edit"
          coupon={{
            id: coupon.id,
            code: coupon.code,
            percent: coupon.percent,
            active: coupon.active,
            expiresAt: coupon.expiresAt ? coupon.expiresAt.toISOString().slice(0, 10) : '',
          }}
        />
      </AdminPanel>
    </div>
  );
}
