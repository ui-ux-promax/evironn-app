import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminPanel } from '@/components/admin/admin-panel';
import { requireAdminPage } from '@/lib/admin/require-admin';
import { CouponForm } from '../_components/coupon-form';

export const metadata = { title: 'Новый купон' };

export default async function NewCouponPage() {
  await requireAdminPage();

  return (
    <div className="space-y-[24px]">
      <AdminPageHeader kicker="Маркетинг" title="Новый промокод" subtitle="Создание процентного кода для корзины." />
      <AdminPanel title="Данные промокода">
        <CouponForm mode="create" />
      </AdminPanel>
    </div>
  );
}
