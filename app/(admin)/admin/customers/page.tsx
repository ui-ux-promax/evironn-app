import type { UserRole } from '@prisma/client';
import { requireAdminPage } from '@/lib/admin/require-admin';
import { listAdminCustomers, type AdminCustomerListInput } from '@/lib/admin/customers';
import { parsePaginationParams, readEnumParam, readSearchQuery } from '@/lib/admin/pagination';
import { CUSTOMER_SORT_VALUES, ROLE_FILTER_VALUES } from '@/lib/customer-admin';
import { CustomerFilters } from './_components/customer-filters';
import { CustomerTable } from './_components/customer-table';

export const metadata = { title: 'Клиенты' };
export const dynamic = 'force-dynamic';

type SP = Record<string, string | string[] | undefined>;

export default async function CustomersPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdminPage();
  const sp = await searchParams;
  const { page, limit } = parsePaginationParams(sp, { limit: 20 });
  const role = readEnumParam(sp, 'role', ROLE_FILTER_VALUES) as UserRole | undefined;
  const sort = readEnumParam(sp, 'sort', CUSTOMER_SORT_VALUES);
  const input: AdminCustomerListInput = { page, limit, query: readSearchQuery(sp), role, sort };
  const result = await listAdminCustomers(input);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-admin-head text-3xl font-bold text-admin-on-surface mb-1">Клиенты ({result.total})</h2>
        <p className="text-admin-on-surface-variant">База покупателей, история заказов и управление ролями.</p>
      </div>

      <CustomerFilters />

      {result.rows.length > 0 ? (
        <CustomerTable
          rows={result.rows}
          page={result.pagination.page}
          totalPages={result.pagination.totalPages}
          total={result.total}
          limit={result.pagination.limit}
        />
      ) : (
        <div className="bg-admin-surface border border-admin-outline-variant rounded-xl p-8 text-admin-on-surface-variant text-sm">
          Клиенты не найдены.
        </div>
      )}
    </div>
  );
}
