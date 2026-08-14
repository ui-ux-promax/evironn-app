/** @vitest-environment jsdom */
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const getList = vi.hoisted(() => vi.fn());
const get = vi.hoisted(() => vi.fn());
const toggleInList = vi.hoisted(() => vi.fn());
const setParam = vi.hoisted(() => vi.fn());
const reset = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/use-catalog-url', () => ({
  useCatalogUrl: () => ({
    sp: new URLSearchParams('option=finish%3Aoak'),
    getList,
    toggleInList,
    get,
    setParam,
    reset,
  }),
}));

import { ActiveFilterChips } from '@/components/shared/catalog/active-filter-chips';
import { OptionFacet } from '@/components/shared/catalog/option-facet';

const facets = {
  categories: [{ value: 'sofas', label: 'Sofas', count: 4 }],
  rooms: [{ value: 'living', label: 'Living room', count: 3 }],
  options: [
    {
      slug: 'finish',
      name: 'Finish',
      values: [{ value: 'oak', label: 'Oak', swatchHex: '#c89b6d', count: 2 }],
    },
  ],
  price: { min: 50000, max: 180000 },
};

afterEach(() => {
  cleanup();
  getList.mockReset();
  get.mockReset();
  toggleInList.mockReset();
  setParam.mockReset();
  reset.mockReset();
});

describe('OptionFacet', () => {
  it('toggles the exact group:value token and renders swatch and count', () => {
    getList.mockReturnValue([]);
    render(<OptionFacet group={facets.options[0]} paramKey="option" />);

    expect(screen.getByTestId('swatch-finish-oak').getAttribute('data-swatch-hex')).toBe('#c89b6d');
    expect(screen.getByText('2')).toBeTruthy();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Oak' }));

    expect(toggleInList).toHaveBeenCalledWith('option', 'finish:oak');
  });
});

describe('ActiveFilterChips', () => {
  it('resolves option labels and removes the exact group:value token', () => {
    getList.mockImplementation((key: string) => {
      if (key === 'category') return ['sofas'];
      if (key === 'room') return ['living'];
      if (key === 'option') return ['finish:oak'];
      return [];
    });

    render(<ActiveFilterChips facets={facets} />);

    expect(screen.getByText('Sofas')).toBeTruthy();
    expect(screen.getByText('Living room')).toBeTruthy();
    expect(screen.getByText('Oak')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Убрать фильтр Oak' }));

    expect(toggleInList).toHaveBeenCalledTimes(1);
    expect(toggleInList).toHaveBeenCalledWith('option', 'finish:oak');
  });

  it('renders and removes the in-stock chip when the URL uses true', () => {
    getList.mockReturnValue([]);
    get.mockImplementation((key: string) => (key === 'inStock' ? 'true' : ''));

    render(<ActiveFilterChips facets={facets} />);

    const removeButton = screen.getAllByRole('button')[0];
    fireEvent.click(removeButton);
    expect(setParam).toHaveBeenCalledWith('inStock', null);
  });
});

describe('InStockToggle', () => {
  it('checks and clears the toggle when the URL uses true', async () => {
    const { InStockToggle } = await import('@/components/shared/catalog/in-stock-toggle');
    get.mockImplementation((key: string) => (key === 'inStock' ? 'true' : ''));

    render(<InStockToggle />);

    const checkbox = screen.getByRole('checkbox');
    expect((checkbox as HTMLInputElement).checked).toBe(true);
    fireEvent.click(checkbox);
    expect(setParam).toHaveBeenCalledWith('inStock', null);
  });
});
