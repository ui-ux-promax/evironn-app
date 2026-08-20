/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ShowcaseProductPageDto } from '@/lib/showcase-product';
import { ProductPageHandoff } from '@/components/evironn/product/product-page-handoff';

vi.mock('@/components/evironn/product/ProductPage', () => ({
  default: () => <main data-testid="resolved-product">Resolved product</main>,
}));

const model = {
  sceneBackgroundUrl: '/scene.png',
  selected: { chairUrl: '/chair.png' },
} as ShowcaseProductPageDto;

let imageInstances: Array<{ onload: null | (() => void); onerror: null | (() => void) }> = [];

beforeEach(() => {
  imageInstances = [];
  vi.stubGlobal(
    'Image',
    class {
      onload: null | (() => void) = null;
      onerror: null | (() => void) = null;

      set src(_value: string) {
        imageInstances.push(this);
      }
    },
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Evironn product handoff', () => {
  it('keeps the loading body visible until the first viewport media is ready', async () => {
    render(<ProductPageHandoff model={model} />);

    expect(screen.getByRole('main', { name: 'Загрузка страницы товара' })).toBeVisible();
    expect(screen.getByTestId('resolved-product').parentElement).toHaveAttribute('hidden');
    expect(imageInstances).toHaveLength(2);

    imageInstances.forEach((image) => image.onload?.());

    await waitFor(() => expect(screen.queryByRole('main', { name: 'Загрузка страницы товара' })).toBeNull());
    expect(screen.getByTestId('resolved-product').parentElement).not.toHaveAttribute('hidden');
  });
});
