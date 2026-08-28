import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import CatalogLoading from '@/app/(admin)/admin/catalog/loading';
import ProductsLoading from '@/app/(admin)/admin/catalog/products/loading';

describe('admin catalog loading state', () => {
  it.each([
    ['catalog redirect', CatalogLoading],
    ['products route', ProductsLoading],
  ])('mirrors the accepted products register for the %s', (_label, Loading) => {
    const markup = renderToStaticMarkup(createElement(Loading));

    expect(markup).toContain('aria-label="Загрузка каталога товаров"');
    expect(markup).toContain('data-skeleton="catalog-products-hero"');
    expect(markup).toContain('data-skeleton="catalog-products-tabs"');
    expect(markup).toContain('data-skeleton="catalog-products-filters"');
    expect(markup).toContain('data-skeleton="catalog-products-registry"');
    expect(markup).toContain('data-skeleton="catalog-products-table"');
    expect(markup).toContain('background-color:var(--admin-surface-low)');
    expect(markup).not.toContain('data-skeleton="catalog-products-stats"');
  });

  it('keeps the shared viewport auto rows from stretching the topbar', () => {
    const shell = readFileSync('components/admin/admin-shell.module.css', 'utf8');

    expect(shell).toMatch(/\.viewport\s*\{[\s\S]*?align-content:\s*start;/);
  });
});
