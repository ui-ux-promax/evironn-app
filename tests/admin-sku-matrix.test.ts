// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { buildSkuMatrix } from '@/lib/admin/sku-matrix';
import { SkuMatrix } from '@/app/(admin)/admin/catalog/products/_components/sku-matrix';

const axes = [
  {
    optionGroupId: 'finish-id',
    optionGroupSlug: 'finish',
    optionGroupName: 'Finish',
    sortOrder: 2,
    values: [
      { optionValueId: 'walnut-id', optionValueSlug: 'walnut', optionValueName: 'Walnut', sortOrder: 2 },
      { optionValueId: 'oak-id', optionValueSlug: 'oak', optionValueName: 'Oak', sortOrder: 1 },
    ],
  },
  {
    optionGroupId: 'upholstery-id',
    optionGroupSlug: 'upholstery',
    optionGroupName: 'Upholstery',
    sortOrder: 1,
    values: [
      { optionValueId: 'linen-id', optionValueSlug: 'linen', optionValueName: 'Linen', sortOrder: 2 },
      { optionValueId: 'boucle-id', optionValueSlug: 'boucle', optionValueName: 'Boucle', sortOrder: 1 },
    ],
  },
];

describe('buildSkuMatrix', () => {
  it('creates a stable nested cross-product and canonical combination keys', () => {
    const result = buildSkuMatrix({ axes, existing: [] });

    expect(result.rows.map((row) => row.combinationKey)).toEqual([
      'finish=oak|upholstery=boucle',
      'finish=walnut|upholstery=boucle',
      'finish=oak|upholstery=linen',
      'finish=walnut|upholstery=linen',
    ]);
    expect(result.rows[0]?.selections.map((selection) => selection.optionGroupSlug)).toEqual(['upholstery', 'finish']);
  });

  it('preserves existing fields and splits removed combinations by reference state', () => {
    const result = buildSkuMatrix({
      axes: [axes[0]!],
      existing: [
        {
          skuId: 'existing-oak',
          combinationKey: 'finish=oak',
          articleNumber: 'EV-OAK',
          price: 89990,
          oldPrice: 109990,
          stock: 4,
          active: false,
          referenced: true,
        },
        {
          skuId: 'removed-referenced',
          combinationKey: 'finish=mahogany',
          articleNumber: 'EV-WALNUT',
          price: 99990,
          oldPrice: null,
          stock: 2,
          active: true,
          referenced: true,
        },
        {
          skuId: 'removed-unreferenced',
          combinationKey: 'finish=ash',
          articleNumber: 'EV-ASH',
          price: 79990,
          oldPrice: null,
          stock: 0,
          active: true,
          referenced: false,
        },
      ],
    });

    expect(result.rows).toMatchObject([
      {
        combinationKey: 'finish=oak',
        skuId: 'existing-oak',
        articleNumber: 'EV-OAK',
        price: 89990,
        oldPrice: 109990,
        stock: 4,
        active: false,
        referenced: true,
        state: 'existing',
      },
      {
        combinationKey: 'finish=walnut',
        skuId: null,
        articleNumber: '',
        price: 0,
        oldPrice: null,
        stock: 0,
        active: true,
        referenced: false,
        state: 'new',
      },
    ]);
    expect(result.deactivations).toEqual([
      { skuId: 'removed-referenced', combinationKey: 'finish=mahogany', reason: 'removed-referenced-combination' },
    ]);
    expect(result.removals).toEqual([{ skuId: 'removed-unreferenced', combinationKey: 'finish=ash' }]);
  });

  it('surfaces duplicate option groups through buildCombinationKey', () => {
    expect(() =>
      buildSkuMatrix({
        axes: [axes[0]!, { ...axes[0]!, optionGroupId: 'second-finish-id' }],
        existing: [],
      }),
    ).toThrow('Each SKU can contain only one value per option group');
  });
});

describe('SkuMatrix', () => {
  it('renders existing stock read-only with stock-console note and leaves component unwired', () => {
    const onChange = vi.fn();

    render(
      React.createElement(SkuMatrix, {
        axes: [axes[0]!],
        existing: [
          {
            skuId: 'existing-oak',
            combinationKey: 'finish=oak',
            articleNumber: 'EV-OAK',
            price: 89990,
            oldPrice: null,
            stock: 4,
            active: true,
            referenced: false,
          },
        ],
        onChange,
      }),
    );

    expect(screen.getByTestId('admin-product-matrix-stock-finish=oak').getAttribute('readonly')).not.toBeNull();
    expect(screen.getByTestId('admin-product-matrix-stock-finish=oak').getAttribute('name')).toBeNull();
    expect(screen.getByText(/stock is managed in the stock console/i)).toBeTruthy();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('keeps the canonical SKU matrix wired after legacy matrix retirement', () => {
    const productForm = readFileSync(
      resolve(process.cwd(), 'app/(admin)/admin/catalog/products/_components/product-form.tsx'),
      'utf8',
    );

    expect(productForm).toContain("import { SkuMatrix } from './sku-matrix';");
    expect(productForm).toContain('<SkuMatrix');
    expect(productForm).not.toContain('defaultValue={selectedRoomIds}');
    expect(productForm).not.toContain('selectedRoomIds = []');
    expect(
      existsSync(resolve(process.cwd(), 'app/(admin)/admin/catalog/products/_components/variant-matrix.tsx')),
    ).toBe(false);
  });
});
