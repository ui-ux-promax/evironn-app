import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminPanel } from '@/components/admin/admin-panel';
import { CouponForm } from '../_components/coupon-form';

export const metadata = { title: 'Новый купон' };

export default function NewCouponPage() {
  return (
    <div className="space-y-[24px]">
      <AdminPageHeader kicker="Маркетинг" title="Новый промокод" subtitle="Создание процентного кода для корзины." />
      <AdminPanel title="Данные промокода">
        <CouponForm />
      </AdminPanel>
    </div>
  );
}
