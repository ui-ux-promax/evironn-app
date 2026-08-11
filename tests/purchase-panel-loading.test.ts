/** @vitest-environment jsdom */
import React from 'react';
import { readFileSync } from 'node:fs';
import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it } from 'vitest';
import { PurchasePanel } from '@/components/shared/product/purchase-panel';
import type { ResolvedProductSelection } from '@/lib/product-selection';

afterEach(() => cleanup());

const selection: ResolvedProductSelection = {
  sku: {
    id: 'sku-oak',
    articleNumber: 'EV-NWL-OAK',
    combinationKey: 'finish=oak|upholstery=ivory-boucle',
    price: 124000,
    oldPrice: 139000,
    stock: 3,
  },
  canonicalSelection: { finish: 'oak', upholstery: 'ivory-boucle' },
  optionGroups: [
    {
      slug: 'finish',
      name: 'Отделка',
      values: [
        { slug: 'oak', name: 'Натуральный дуб', swatchHex: '#c8a97e', available: true },
        { slug: 'walnut', name: 'Орех', swatchHex: '#6b4a30', available: true },
      ],
    },
  ],
  images: [],
  turntable: null,
};

describe('PurchasePanel canonical contract', () => {
  it('accepts only the resolved furniture selection contract', () => {
    const source = readFileSync('components/shared/product/purchase-panel.tsx', 'utf8');
    expect(source).not.toContain('Record<string, unknown>');

    render(
      React.createElement(PurchasePanel, {
        productName: 'Noma Woven Lounge',
        productSlug: 'noma-woven-lounge',
        categoryName: 'Кресла',
        description: null,
        specs: null,
        selection,
      }),
    );

    expect(screen.getByText('EV-NWL-OAK')).toBeVisible();
    expect(screen.getByRole('button', { name: /Добавление в корзину/ })).toBeDisabled();
  });
});
