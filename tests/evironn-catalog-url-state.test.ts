import { describe, expect, it } from 'vitest';
import { catalogBQueryFromSearchParams, normalizeCatalogBQuery } from '@/components/evironn/catalog/catalog-url-state';

describe('Catalog Variant B URL state', () => {
  it('keeps approved keys and stable-deduplicates list values', () => {
    const query = catalogBQueryFromSearchParams(
      new URLSearchParams(
        'category=sofas,armchairs,sofas&room=living&option=finish:oak,finish:oak,upholstery:linen&priceFrom=25000&priceTo=190000&inStock=1&sort=price-asc&page=3&q=%20Noma%20&legacy=drop',
      ),
    );

    expect(query.toString()).toBe(
      'category=sofas%2Carmchairs&room=living&option=finish%3Aoak%2Cupholstery%3Alinen&priceFrom=25000&priceTo=190000&inStock=1&sort=price-asc&page=3&q=Noma',
    );
  });

  it('normalizes repeated URL keys without changing canonical token order', () => {
    const query = catalogBQueryFromSearchParams(
      new URLSearchParams('category=sofas&category=sofas,chairs&option=finish:oak&option=finish:oak,finish:walnut'),
    );

    expect(query.get('category')).toBe('sofas,chairs');
    expect(query.get('option')).toBe('finish:oak,finish:walnut');
  });

  it('preserves page for already-normalized filtered pagination', () => {
    const query = normalizeCatalogBQuery(new URLSearchParams('category=sofas&page=2'));

    expect(query.toString()).toBe('category=sofas&page=2');
  });

  it('expects caller to delete page before normalizing changed filter or sort state', () => {
    const changedQuery = new URLSearchParams('category=armchairs&sort=price-asc');

    expect(normalizeCatalogBQuery(changedQuery).toString()).toBe('category=armchairs&sort=price-asc');
  });

  it('resets page through documented caller flow when filter changes', () => {
    const currentQuery = new URLSearchParams('category=sofas&page=2');
    const nextQuery = new URLSearchParams(currentQuery);
    nextQuery.set('category', 'armchairs');
    nextQuery.delete('page');

    expect(normalizeCatalogBQuery(nextQuery).toString()).toBe('category=armchairs');
    expect(normalizeCatalogBQuery(nextQuery).has('page')).toBe(false);
  });

  it('returns empty catalog semantics when no approved query state remains', () => {
    expect(normalizeCatalogBQuery(new URLSearchParams('legacy=drop')).toString()).toBe('');
  });
});
