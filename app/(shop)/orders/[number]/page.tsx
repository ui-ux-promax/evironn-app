import { redirect, notFound } from 'next/navigation';
import { auth } from '@/auth';
import { getOrderPageDto } from '@/lib/order-page';
import { OrderVariantA } from '@/components/evironn/order/order-variant-a';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Заказ' };

export default async function OrderPage({ params, searchParams }: { params: Promise<{ number: string }>; searchParams: Promise<{ placed?: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const { number } = await params;
  const orderNumber = Number(number);
  if (!Number.isSafeInteger(orderNumber) || orderNumber <= 0) notFound();
  const order = await getOrderPageDto({ userId: session.user.id, orderNumber });
  if (!order) notFound();
  const query = await searchParams;
  return <OrderVariantA order={order} placed={query.placed === '1'} />;
}
