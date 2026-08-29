import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import CustomersLoading from '@/app/(admin)/admin/customers/loading';
import MarketingLoading from '@/app/(admin)/admin/marketing/loading';

describe('admin list loading states', () => {
  it.each([
    ['клиентов', CustomersLoading, 'customer'],
    ['промокодов', MarketingLoading, 'coupon'],
  ] as const)('mirrors the visible %s page regions', (label, Loading, prefix) => {
    const markup = renderToStaticMarkup(createElement(Loading));

    expect(markup).toContain(`aria-label="Загрузка ${label}"`);
    for (const section of ['hero', 'kpis', 'filters', 'registry', 'table']) {
      expect(markup).toContain(`data-skeleton="${prefix}-${section}"`);
    }
    expect(markup).toContain('background-color:var(--admin-surface-low)');
    expect(markup).not.toContain('aria-label="Загрузка…"');
  });
});
