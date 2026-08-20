/** @vitest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Pagination } from '@/components/shared/catalog/pagination';

(globalThis as typeof globalThis & { React: typeof React }).React = React;
vi.mock('@/hooks/use-catalog-url', () => ({ useCatalogUrl: () => ({ setPage: vi.fn() }) }));

describe('Pagination', () => {
  it('uses a white surface for controls that can be selected', () => {
    render(React.createElement(Pagination, { page: 1, totalPages: 2 }));

    expect(screen.getByRole('button', { name: '2' }).className).toContain('bg-surface');
    expect(screen.getByRole('button', { name: 'Вперёд' }).className).toContain('bg-surface');
    expect(screen.getByRole('button', { name: '1' }).className).toContain('bg-ink');
  });
});
