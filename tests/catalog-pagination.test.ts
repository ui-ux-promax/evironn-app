/** @vitest-environment jsdom */
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const setPage = vi.hoisted(() => vi.fn());
vi.mock('@/hooks/use-catalog-url', () => ({ useCatalogUrl: () => ({ setPage }) }));

import { Pagination } from '@/components/shared/catalog/pagination';

afterEach(() => {
  cleanup();
  setPage.mockClear();
});

describe('Pagination', () => {
  it('renders a compact window with inert accessible gaps for a long result set', () => {
    render(React.createElement(Pagination, { page: 50, totalPages: 100 }));

    expect(screen.getByRole('button', { name: /^1$/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /^49$/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /^50$/ }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('button', { name: /^51$/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /^100$/ })).toBeTruthy();
    expect(screen.getAllByLabelText('Пропуск страниц')).toHaveLength(2);
    expect(screen.getAllByLabelText('Пропуск страниц')[0].getAttribute('aria-disabled')).toBe('true');
    expect(screen.getAllByLabelText('Пропуск страниц')[0].tagName).not.toBe('BUTTON');
  });

  it('delegates page navigation to setPage', () => {
    render(React.createElement(Pagination, { page: 2, totalPages: 4 }));

    fireEvent.click(screen.getByRole('button', { name: /^3$/ }));
    expect(setPage).toHaveBeenCalledWith(3);
  });
});
