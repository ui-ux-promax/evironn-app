/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProductView } from '@/components/shared/product/product-view';
import type { ResolvedProductSelection } from '@/lib/product-selection';

vi.mock('next/image', () => ({
  default: ({
    fill: _fill,
    priority: _priority,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; priority?: boolean }) =>
    React.createElement('img', props),
}));

vi.mock('@/components/shared/product/product-media-stage', () => ({
  ProductMediaStage: ({ images }: { images: Array<{ url: string; alt: string }> }) =>
    React.createElement(
      'div',
      { 'data-testid': 'product-media-stage' },
      images.map((image) => React.createElement('img', { key: image.url, src: image.url, alt: image.alt })),
    ),
}));

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
        { slug: 'black', name: 'Чёрный', swatchHex: '#111111', available: false },
      ],
    },
    {
      slug: 'upholstery',
      name: 'Обивка',
      values: [{ slug: 'ivory-boucle', name: 'Кремовая букле', swatchHex: '#efe7d8', available: true }],
    },
  ],
  images: [{ url: '/assets/products/03-ivory-lounge-idle.webp', alt: 'Noma Woven Lounge' }],
  turntable: null,
};

describe('canonical furniture ProductView', () => {
  it('presents the server-resolved SKU and links available options through the canonical URL', () => {
    render(
      React.createElement(ProductView, {
        product: {
          name: 'Noma Woven Lounge',
          slug: 'noma-woven-lounge',
          description: 'Глубокое lounge-кресло с объёмной букле и съёмным чехлом.',
          specs: { Материал: 'Букле, дуб', Ширина: '84 см' },
          category: { name: 'Кресла', slug: 'armchairs' },
        },
        selection,
      }),
    );

    expect(screen.getByRole('heading', { name: 'Noma Woven Lounge' })).toBeVisible();
    expect(screen.getAllByText('Кресла').length).toBeGreaterThan(0);
    expect(screen.getByText('Глубокое lounge-кресло с объёмной букле и съёмным чехлом.')).toBeVisible();
    expect(screen.getByText('Материал')).toBeVisible();
    expect(screen.getByText('Букле, дуб')).toBeVisible();

    expect(screen.getByRole('link', { name: 'Орех' })).toHaveAttribute(
      'href',
      '/product/noma-woven-lounge?option=finish%3Awalnut%2Cupholstery%3Aivory-boucle',
    );
    expect(screen.getByRole('link', { name: 'Натуральный дуб' })).toHaveAttribute('aria-current', 'true');
    expect(screen.queryByRole('link', { name: 'Чёрный' })).toBeNull();
    expect(screen.getByText('Чёрный')).toHaveAttribute('aria-disabled', 'true');

    expect(screen.getByText('EV-NWL-OAK')).toBeVisible();
    expect(screen.getByText(/124[\s\u00a0]000 ₽/)).toBeVisible();
    expect(screen.getByText(/139[\s\u00a0]000 ₽/)).toBeVisible();
    expect(screen.getByText('В наличии: 3')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Кресла' })).toHaveAttribute('href', '/catalog?category=armchairs');

    const pilotCta = screen.getByRole('button', {
      name: 'Добавление в корзину будет доступно после завершения пилота',
    });
    expect(pilotCta).toBeDisabled();
    expect(screen.getByText('Добавление в корзину будет доступно после завершения пилота')).toBeVisible();
    expect(screen.queryByText(/размер/i)).toBeNull();
    expect(screen.queryByText(/отзыв/i)).toBeNull();
    expect(screen.queryByRole('button', { name: /избранн/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /купить сейчас/i })).toBeNull();
  });
});
