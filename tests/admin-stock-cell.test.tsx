/** @vitest-environment jsdom */
import { readFileSync } from 'node:fs';
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const actionMock = vi.hoisted(() => ({ setSkuStock: vi.fn() }));

vi.mock('@/app/actions/admin/stock', () => actionMock);
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import { StockCell } from '@/app/(admin)/admin/catalog/stock/_components/stock-cell';
import { StockTable } from '@/app/(admin)/admin/catalog/stock/_components/stock-table';

const row = {
  skuId: 'sku-1',
  productId: 'product-1',
  productName: 'Chair',
  articleNumber: 'EV-CHAIR-1',
  combinationKey: 'finish=oak',
  optionLabels: ['Oak'],
  price: 100,
  stock: 4,
  active: true,
};

beforeEach(() => {
  actionMock.setSkuStock.mockReset();
  actionMock.setSkuStock.mockResolvedValue({ ok: true, data: { skuId: 'sku-1', stock: 7 } });
});

afterEach(() => cleanup());

describe('StockCell', () => {
  it('keeps the stock register semantic table and preserved product destination', () => {
    const table = readFileSync('app/(admin)/admin/catalog/stock/_components/stock-table.tsx', 'utf8');
    const page = readFileSync('app/(admin)/admin/catalog/stock/page.tsx', 'utf8');

    expect(table).toContain('aria-label="Реестр остатков"');
    expect(table).toContain('href={`/admin/catalog/products/${row.productId}/edit`}');
    expect(table).toContain('Активен');
    expect(table).toContain('Черновик');
    expect(page).toContain('<CatalogTabs embedded />');
    expect(page).not.toContain('AdminKpiCard');
  });

  it('rejects blank and whitespace input before calling the stock action', () => {
    render(<StockCell row={row} />);
    const input = screen.getByRole('spinbutton', { name: 'Остаток EV-CHAIR-1' });
    const save = screen.getByRole('button', { name: 'Сохранить' });

    fireEvent.change(input, { target: { value: '   ' } });
    expect(save).toBeDisabled();
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(actionMock.setSkuStock).not.toHaveBeenCalled();
    expect(screen.getByText('Введите целое число от 0')).toBeInTheDocument();
  });

  it('renders stock pagination, active status, and product edit destination', () => {
    render(<StockTable rows={[row]} page={1} totalPages={2} total={21} limit={20} />);

    expect(screen.getByRole('table', { name: 'Реестр остатков' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Chair' })).toHaveAttribute(
      'href',
      '/admin/catalog/products/product-1/edit',
    );
    expect(screen.getByText('Активен')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1' })).toHaveAttribute('aria-current', 'page');
  });

  it('keeps disabled previous and next controls visible on a one-page stock result', () => {
    render(<StockTable rows={[row]} page={1} totalPages={1} total={1} limit={20} />);

    expect(screen.getByRole('button', { name: 'Предыдущая страница' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Следующая страница' })).toBeDisabled();
  });
});
