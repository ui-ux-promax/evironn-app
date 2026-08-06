import type { Category, Product } from './types';

export const mockCategories = [
  {
    id: 'category-seating',
    slug: 'seating',
    name: 'Seating',
    imageSrc: '/assets/editorial/images/category-reading-chair.png',
    showcaseProductId: 'product-noma-chair',
  },
  {
    id: 'category-sofas',
    slug: 'sofas',
    name: 'Sofas',
    imageSrc: '/assets/editorial/images/category-sofa.png',
  },
] as const satisfies readonly Category[];

export const mockProducts = [
  {
    id: 'product-noma-chair',
    slug: 'noma-chair',
    name: 'Noma Lounge Chair',
    description:
      'A rounded lounge chair with tactile upholstery and a calm silhouette.',
    categoryId: 'category-seating',
    priceFrom: 1240,
    optionGroups: [
      {
        id: 'option-upholstery',
        productId: 'product-noma-chair',
        axis: 'upholstery',
        label: 'Upholstery',
        order: 1,
        values: [
          {
            id: 'upholstery-ivory',
            value: 'Ivory boucle',
            order: 1,
            swatch: 'var(--ev-ds-color-surface-soft)',
          },
          {
            id: 'upholstery-graphite',
            value: 'Graphite weave',
            order: 2,
            swatch: 'var(--ev-ds-color-text)',
          },
        ],
      },
      {
        id: 'option-frame',
        productId: 'product-noma-chair',
        axis: 'frame',
        label: 'Frame',
        order: 2,
        values: [
          {
            id: 'frame-walnut',
            value: 'Walnut',
            order: 1,
            mediaId: 'media-noma-walnut',
          },
        ],
      },
    ],
    variants: [
      {
        id: 'variant-noma-graphite-walnut',
        sku: 'NOMA-GRAPHITE-WALNUT',
        price: 1240,
        stock: 8,
        optionValues: [
          { groupId: 'option-upholstery', valueId: 'upholstery-graphite' },
          { groupId: 'option-frame', valueId: 'frame-walnut' },
        ],
        mediaId: 'media-noma-walnut',
      },
    ],
    media: [
      {
        id: 'media-noma-walnut',
        kind: 'image',
        src: '/assets/products/05-graphite-walnut-chair-fixed-alpha.png',
        alt: 'Graphite Noma lounge chair with walnut frame',
        order: 1,
        variantId: 'variant-noma-graphite-walnut',
      },
    ],
    turntable: {
      id: '360-noma-walnut',
      webmSrc:
        '/assets/products/05-graphite-walnut-lounge-chair-turntable-alpha.webm',
      posterSrc:
        '/assets/products/05-graphite-walnut-lounge-chair-turntable-poster.png',
      width: 1200,
      height: 1200,
      frameCount: 48,
      variantId: 'variant-noma-graphite-walnut',
    },
  },
] as const satisfies readonly Product[];
