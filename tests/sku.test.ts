import { describe, it, expect } from 'vitest';
import { suggestSku } from '@/lib/sku';

describe('suggestSku', () => {
  it('builds UPPER segments joined by dash', () => {
    expect(suggestSku({ brand: 'RITM', productName: 'Oversize Tee', colorwaySlug: 'black', size: 'M' })).toBe(
      'RITM-OVERSIZE-TEE-BLACK-M',
    );
  });

  it('keeps letter sizes as SKU suffixes', () => {
    expect(suggestSku({ brand: 'RITM', productName: 'Hoodie', colorwaySlug: 'sage', size: 'XXL' })).toBe(
      'RITM-HOODIE-SAGE-XXL',
    );
  });

  it('transliterates Cyrillic and strips junk', () => {
    expect(suggestSku({ brand: 'Ритм', productName: 'Футболка!!!', colorwaySlug: 'white', size: 'S' })).toBe(
      'RITM-FUTBOLKA-WHITE-S',
    );
  });

  it('omits empty segments', () => {
    expect(suggestSku({ brand: '', productName: 'X', colorwaySlug: '', size: 'XL' })).toBe('X-XL');
  });
});
