/** @vitest-environment jsdom */
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const actionMock = vi.hoisted(() => ({ setSkuStock: vi.fn() }));

vi.mock('@/app/actions/admin/stock', () => actionMock);
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import { StockCell } from '@/app/(admin)/admin/catalog/stock/_components/stock-cell';

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
});
