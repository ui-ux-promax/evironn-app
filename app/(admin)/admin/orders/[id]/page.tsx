import { notFound } from 'next/navigation';
import { requireAdminPage } from '@/lib/admin/require-admin';
import { getAdminOrderDetail } from '@/lib/admin/orders';
import { OrderDetail } from '../_components/order-detail';

export const metadata = { title: 'Заказ' };
export const dynamic = 'force-dynamic';

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  const order = await getAdminOrderDetail(id);
  if (!order) notFound();
  return <OrderDetail order={order} />;
}
