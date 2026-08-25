import { notFound } from 'next/navigation';
import { requireAdminPage } from '@/lib/admin/require-admin';
import { getAdminCustomerDetail } from '@/lib/admin/customers';
import { CustomerDetail } from '../_components/customer-detail';

export const metadata = { title: 'Клиент' };
export const dynamic = 'force-dynamic';

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminPage();
  const { id } = await params;
  const customer = await getAdminCustomerDetail(id, session.user.id);
  if (!customer) notFound();

  return <CustomerDetail customer={customer} />;
}
