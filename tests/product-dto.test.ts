import { describe, it, expect } from 'vitest';
import { furnitureProductSchema } from '@/services/dto/product.dto';

describe('furnitureProductSchema', () => {
  it('accepts normalized option groups and SKU selections', () => {
    const result = furnitureProductSchema.safeParse({
      name: 'Noma Woven Lounge',
      slug: 'noma-woven-lounge',
      categoryId: 'armchairs',
      roomIds: ['living'],
      description: 'Lounge chair',
      specs: [{ key: 'Материал', value: 'Букле' }],
      active: true,
      sortOrder: 1,
      optionGroups: [
        { name: 'Отделка', slug: 'finish', sortOrder: 1, values: [{ name: 'Дуб', slug: 'oak', sortOrder: 0 }] },
        {
          name: 'Обивка',
          slug: 'upholstery',
          sortOrder: 2,
          values: [{ name: 'Кремовая букле', slug: 'ivory-boucle', sortOrder: 0 }],
        },
      ],
      skus: [
        {
          articleNumber: 'EV-NWL-OAK',
          combinationKey: 'finish=oak|upholstery=ivory-boucle',
          selectedOptions: [
            { groupSlug: 'finish', valueSlug: 'oak' },
            { groupSlug: 'upholstery', valueSlug: 'ivory-boucle' },
          ],
          price: 124000,
          oldPrice: null,
          stock: 3,
          active: true,
        },
      ],
      media: [],
    });

    expect(result.success).toBe(true);
  });

  it('rejects an SKU selecting two values from one option group', () => {
    const result = furnitureProductSchema.safeParse({
      name: 'Chair',
      slug: 'chair',
      categoryId: 'chairs',
      roomIds: ['dining'],
      specs: [],
      active: false,
      sortOrder: 1,
      optionGroups: [
        {
          name: 'Отделка',
          slug: 'finish',
          sortOrder: 1,
          values: [
            { name: 'Дуб', slug: 'oak', sortOrder: 0 },
            { name: 'Орех', slug: 'walnut', sortOrder: 1 },
          ],
        },
      ],
      skus: [
        {
          articleNumber: 'EV-CHAIR',
          combinationKey: 'finish=oak',
          selectedOptions: [
            { groupSlug: 'finish', valueSlug: 'oak' },
            { groupSlug: 'finish', valueSlug: 'walnut' },
          ],
          price: 100,
          oldPrice: null,
          stock: 1,
          active: true,
        },
      ],
      media: [],
    });

    expect(result.success).toBe(false);
  });

  it('rejects an SKU that omits one product option group', () => {
    const result = furnitureProductSchema.safeParse({
      name: 'Chair',
      slug: 'chair',
      categoryId: 'chairs',
      roomIds: ['dining'],
      specs: [],
      active: false,
      sortOrder: 1,
      optionGroups: [
        { name: 'Отделка', slug: 'finish', sortOrder: 1, values: [{ name: 'Дуб', slug: 'oak', sortOrder: 0 }] },
        {
          name: 'Обивка',
          slug: 'upholstery',
          sortOrder: 2,
          values: [{ name: 'Букле', slug: 'boucle', sortOrder: 0 }],
        },
      ],
      skus: [
        {
          articleNumber: 'EV-CHAIR',
          combinationKey: 'finish=oak',
          selectedOptions: [{ groupSlug: 'finish', valueSlug: 'oak' }],
          price: 100,
          oldPrice: null,
          stock: 1,
          active: true,
        },
      ],
      media: [],
    });

    expect(result.success).toBe(false);
  });

  it('validates one complete turntable media set', () => {
    const result = furnitureProductSchema.safeParse({
      name: 'Noma Woven Lounge',
      slug: 'noma-woven-lounge',
      categoryId: 'armchairs',
      roomIds: ['living'],
      specs: [],
      active: false,
      sortOrder: 1,
      turntable: true,
      optionGroups: [
        { name: 'Отделка', slug: 'finish', sortOrder: 1, values: [{ name: 'Дуб', slug: 'oak', sortOrder: 0 }] },
      ],
      skus: [
        {
          articleNumber: 'EV-NWL-OAK',
          combinationKey: 'finish=oak',
          selectedOptions: [{ groupSlug: 'finish', valueSlug: 'oak' }],
          price: 100,
          oldPrice: null,
          stock: 1,
          active: true,
        },
      ],
      media: [
        { kind: 'IMAGE', url: 'https://cdn.example.com/noma.jpg', alt: 'Noma', sortOrder: 0 },
        { kind: 'TURN_TABLE_VIDEO', url: 'https://cdn.example.com/noma.webm', alt: '360', sortOrder: 0 },
        { kind: 'TURN_TABLE_POSTER', url: 'https://cdn.example.com/noma-poster.jpg', alt: '360 poster', sortOrder: 0 },
        {
          kind: 'TURN_TABLE_FALLBACK',
          url: 'https://cdn.example.com/noma-fallback.jpg',
          alt: 'fallback',
          sortOrder: 0,
        },
      ],
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.media[1].kind).toBe('TURN_TABLE_VIDEO');
  });
});
