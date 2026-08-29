import type { UserRole } from '@prisma/client';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { requireAdminPage } from '@/lib/admin/require-admin';
import { listAdminCustomers, type AdminCustomerListInput } from '@/lib/admin/customers';
import { parsePaginationParams, readEnumParam, readSearchQuery } from '@/lib/admin/pagination';
import { CUSTOMER_SORT_VALUES, ROLE_FILTER_VALUES } from '@/lib/customer-admin';
import { CustomerFilters } from './_components/customer-filters';
import { CustomerTable } from './_components/customer-table';
import { Icon } from '@/components/admin/icon';

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
    <div className="space-y-5">
      <AdminPageHeader
        className="rounded-[28px] border border-admin-outline-variant bg-admin-surface px-6 py-6 shadow-[var(--admin-shadow-tight)] sm:px-7"
        kicker="Клиентская база"
        title="Клиенты"
        subtitle="Покупатели, история заказов и ценность отношений."
        action={
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="inline-flex min-h-11 items-center gap-2 rounded-[14px] bg-admin-primary px-5 text-sm font-bold text-white opacity-60"
          >
            <Icon name="person_add" className="text-[18px]" /> Добавить клиента
          </button>
        }
      />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" aria-label="Ключевые показатели клиентов">
        <CustomerKpi label="Всего клиентов" value={result.total.toLocaleString('ru-RU')} detail="Текущий результат" />
        <CustomerKpi label="В выборке" value={result.rows.length.toLocaleString('ru-RU')} detail="Текущая страница" />
        <CustomerKpi
          label="С заказами"
          value={result.rows.filter((row) => row.orderCount > 0).length.toLocaleString('ru-RU')}
          detail="На текущей странице"
        />
        <CustomerKpi
          label="Администраторы"
          value={result.rows.filter((row) => row.role === 'ADMIN').length.toLocaleString('ru-RU')}
          detail="На текущей странице"
        />
      </section>

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

function CustomerKpi({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="rounded-[20px] border border-admin-outline-variant bg-admin-surface p-5 shadow-[var(--admin-shadow-tight)]">
      <p className="text-xs font-semibold text-admin-on-surface-variant">{label}</p>
      <p className="mt-2 font-admin-head text-3xl font-medium tracking-tight text-admin-on-surface tabular-nums">
        {value}
      </p>
      <span className="mt-3 inline-flex rounded-full bg-admin-surface-low px-2.5 py-1 text-[11px] font-bold text-admin-on-surface-variant">
        {detail}
      </span>
    </article>
  );
}
