import { expect, test } from 'vitest';

import {
  PRODUCT_PAGE_STYLES,
  PRODUCT_SCENE_BACKGROUND,
  PRODUCT_SCENE_CHAIRS,
  UPHOLSTERY_OPTIONS,
  WOOD_OPTIONS,
  addProductToCart,
  dragHintForInput,
  toggleAccordion,
} from '../components/evironn/product/productPageState';

test('keeps the reference style order and labels', () => {
  expect(PRODUCT_PAGE_STYLES.map((item) => item.id)).toEqual([
    'scandinavian',
    'loft',
    'neoclassicism',
    'minimalism',
    '360',
  ]);
  expect(PRODUCT_PAGE_STYLES[0].label).toBe('Скандинавский');
  expect(PRODUCT_PAGE_STYLES[4].label).toBe('360°');
});

test('toggles one accordion at a time', () => {
  expect(toggleAccordion(null, 'description')).toBe('description');
  expect(toggleAccordion('description', 'description')).toBeNull();
  expect(toggleAccordion('description', 'care')).toBe('care');
});

test('increments the local cart count', () => {
  expect(addProductToCart(0)).toBe(1);
  expect(addProductToCart(3)).toBe(4);
});

test('chooses a touch-friendly drag hint for coarse or touch input', () => {
  expect(dragHintForInput({ isCoarse: false, maxTouchPoints: 0 })).toBe('Потяни кресло мышью');
  expect(dragHintForInput({ isCoarse: true, maxTouchPoints: 0 })).toBe('Потяни кресло');
  expect(dragHintForInput({ isCoarse: false, maxTouchPoints: 1 })).toBe('Потяни кресло');
});

test('uses one fixed room background with six selectable chair layers', () => {
  expect(PRODUCT_SCENE_BACKGROUND).toBe('/assets/products/05-graphite-walnut-room-background-fixed.webp');
  expect(PRODUCT_SCENE_CHAIRS).toEqual({
    ivory: {
      walnut: '/assets/products/05-ivory-walnut-chair-fixed-alpha.webp',
      pine: '/assets/products/05-ivory-pine-chair-fixed-alpha.webp',
    },
    charcoal: {
      walnut: '/assets/products/05-graphite-walnut-chair-fixed-alpha.webp',
      pine: '/assets/products/05-graphite-pine-chair-fixed-alpha.webp',
    },
    terracotta: {
      walnut: '/assets/products/05-terracotta-walnut-chair-fixed-alpha.webp',
      pine: '/assets/products/05-terracotta-pine-chair-fixed-alpha.webp',
    },
  });
});

test('keeps all upholstery and wood choices selectable', () => {
  expect(UPHOLSTERY_OPTIONS.map(({ id, disabled }) => ({ id, disabled }))).toEqual([
    { id: 'ivory', disabled: false },
    { id: 'charcoal', disabled: false },
    { id: 'terracotta', disabled: false },
  ]);
  expect(WOOD_OPTIONS.map(({ id, disabled }) => ({ id, disabled }))).toEqual([
    { id: 'pine', disabled: false },
    { id: 'walnut', disabled: false },
  ]);
});
