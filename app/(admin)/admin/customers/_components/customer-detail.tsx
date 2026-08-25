import Link from 'next/link';
import type { ReactNode } from 'react';
import { Icon } from '@/components/admin/icon';
import { formatDate, formatDateTime, formatPrice } from '@/lib/format';
import { orderStatusView } from '@/lib/order';
import type { AdminCustomerDetail } from '@/lib/admin/customers';
import { roleView } from '@/lib/customer-admin';
import { RoleToggle } from './role-toggle';

export function CustomerDetail({ customer }: { customer: AdminCustomerDetail | null }) {
  if (!customer) {
    return (
      <div className="bg-admin-surface border border-admin-outline-variant rounded-xl p-8 text-sm text-admin-on-surface-variant">
        Клиент не найден.
      </div>
    );
  }

  const role = roleView(customer.role);

  return (
    <div className="space-y-8">
      <Link
        href="/admin/customers"
        className="inline-flex items-center gap-1 text-sm text-admin-on-surface-variant hover:text-admin-on-surface"
      >
        <Icon name="arrow_back" className="text-[18px]" /> К клиентам
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-admin-head text-3xl font-bold text-admin-on-surface">
          {customer.name?.trim() || 'Без имени'}
        </h2>
        <span className={role.badge}>{role.label}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Section
            title={`История заказов${customer.orderCount > customer.orders.length ? ` (последние ${customer.orders.length} из ${customer.orderCount})` : ''}`}
          >
            {customer.orders.length === 0 ? (
              <p className="text-sm text-admin-on-surface-variant">Заказов нет.</p>
            ) : (
              <div className="space-y-4">
                {customer.orders.map((order) => {
                  const status = orderStatusView(order.status, order.paymentStatus);
                  return (
                    <article key={order.id} className="rounded-xl border border-admin-outline-variant p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="font-bold text-admin-on-surface hover:underline tabular-nums"
                          >
                            #{order.orderNumber}
                          </Link>
                          <span className={status.badge}>{status.label}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-admin-on-surface tabular-nums">
                            {formatPrice(order.totalAmount)}
                          </div>
                          <div className="text-xs text-admin-on-surface-variant tabular-nums">
                            {formatDateTime(order.createdAt)}
                          </div>
                        </div>
                      </div>
                      {order.items.length > 0 && (
                        <div className="mt-3 space-y-2 border-t border-admin-outline-variant pt-3">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                              <div className="min-w-0">
                                <span className="font-medium text-admin-on-surface">{item.productName}</span>
                                {item.articleNumber && (
                                  <span className="ml-2 text-xs text-admin-on-surface-variant">
                                    {item.articleNumber}
                                  </span>
                                )}
                                {item.combinationLabel && (
                                  <div className="text-xs text-admin-on-surface-variant">{item.combinationLabel}</div>
                                )}
                              </div>
                              <span className="text-admin-on-surface-variant tabular-nums">
                                {item.quantity} × {formatPrice(item.unitPrice)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Профиль">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-full bg-admin-surface-high border border-admin-outline-variant overflow-hidden flex items-center justify-center shrink-0">
                {customer.image ? (
                  /* eslint-disable-next-line @next/next/no-img-element -- admin avatar */
                  <img src={customer.image} alt="" className="object-cover w-full h-full" />
                ) : (
                  <Icon name="person" className="text-admin-on-surface-variant" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-admin-on-surface truncate">{customer.email}</span>
                  <Icon
                    name={customer.emailVerified ? 'verified' : 'gpp_maybe'}
                    className={
                      customer.emailVerified
                        ? 'text-[16px] text-admin-primary'
                        : 'text-[16px] text-admin-on-surface-variant'
                    }
                  />
                </div>
                <div className="text-xs text-admin-on-surface-variant">
                  {customer.emailVerified ? 'Email подтверждён' : 'Email не подтверждён'}
                </div>
              </div>
            </div>
            <dl className="space-y-2 text-sm">
              <Row label="Телефон" value={customer.phone || '—'} />
              <Row label="Дата рождения" value={customer.birthdate ? formatDate(customer.birthdate) : '—'} />
              <Row label="Регистрация" value={formatDateTime(customer.createdAt)} />
            </dl>
          </Section>

          <Section title="Сводка">
            <dl className="space-y-2 text-sm">
              <Row label="Заказов" value={String(customer.orderCount)} />
              <Row label="Потрачено" value={formatPrice(customer.totalSpent)} />
              <Row
                label="Отзывов"
                value={
                  customer.reviewSummary.count > 0 && customer.reviewSummary.averageRating != null
                    ? `${customer.reviewSummary.count} (★ ${customer.reviewSummary.averageRating.toFixed(1)})`
                    : String(customer.reviewSummary.count)
                }
              />
              <Row label="В избранном" value={String(customer.wishlistCount)} />
              <Row label="В корзине" value={String(customer.cartCount)} />
              <Row label="Рассылка" value={customer.newsletterActive ? 'Подписан' : 'Нет'} />
            </dl>
          </Section>

          <Section title="Роль">
            <RoleToggle
              userId={customer.id}
              currentRole={customer.role}
              isSelf={customer.roleControl.isSelf}
              isLastAdmin={customer.roleControl.isLastAdmin}
            />
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-admin-surface border border-admin-outline-variant rounded-xl p-6">
      <h3 className="font-admin-head text-lg font-bold text-admin-on-surface mb-4">{title}</h3>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-admin-on-surface-variant shrink-0">{label}</dt>
      <dd className="text-admin-on-surface text-right break-words">{value}</dd>
    </div>
  );
}
