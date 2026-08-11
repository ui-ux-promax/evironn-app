import { describe, it, expect, vi } from 'vitest';
import { furnitureProductSchema, productSchema } from '@/services/dto/product.dto';

const variant = { size: 'M', sku: 'RITM-TEE-BLK-M', price: 12990, compareAtPrice: null, stock: 5, active: true };
const colorway = { name: 'Чёрный', slug: 'black', isDefault: true, images: [], variants: [variant] };
const base = {
  name: 'Oversize Tee',
  slug: 'oversize-tee',
  brand: 'RITM',
  gender: 'UNISEX',
  categoryId: 'cat1',
  description: '',
  fitNote: '',
  specs: [],
  isBestseller: false,
  active: false,
  sortOrder: 0,
  colorways: [colorway],
};

describe('productSchema', () => {
  it('accepts a valid product', () => {
    expect(productSchema.safeParse(base).success).toBe(true);
  });

  it('draft: active=false with empty colorways is valid', () => {
    expect(productSchema.safeParse({ ...base, colorways: [] }).success).toBe(true);
  });

  it('active=true without any active variant is rejected', () => {
    const cw = { ...colorway, variants: [{ ...variant, active: false }] };
    expect(productSchema.safeParse({ ...base, active: true, colorways: [cw] }).success).toBe(false);
  });

  it('active=true with an active variant is accepted', () => {
    expect(productSchema.safeParse({ ...base, active: true }).success).toBe(true);
  });

  it('rejects bad slug', () => {
    expect(productSchema.safeParse({ ...base, slug: 'Air Max' }).success).toBe(false);
  });

  it('rejects sizes outside the clothing size grid', () => {
    expect(
      productSchema.safeParse({ ...base, colorways: [{ ...colorway, variants: [{ ...variant, size: '42' }] }] })
        .success,
    ).toBe(false);
    expect(
      productSchema.safeParse({ ...base, colorways: [{ ...colorway, variants: [{ ...variant, size: 'XXXL' }] }] })
        .success,
    ).toBe(false);
  });

  it('derives sizeOrder from clothing size', () => {
    const parsed = productSchema.parse(base);
    expect(parsed.colorways[0].variants[0].sizeOrder).toBe(30);
  });

  it('rejects empty sku', () => {
    expect(
      productSchema.safeParse({ ...base, colorways: [{ ...colorway, variants: [{ ...variant, sku: '' }] }] }).success,
    ).toBe(false);
  });

  it('rejects compareAtPrice not greater than price', () => {
    expect(
      productSchema.safeParse({
        ...base,
        colorways: [{ ...colorway, variants: [{ ...variant, compareAtPrice: 100 }] }],
      }).success,
    ).toBe(false);
  });

  it('rejects when not exactly one default colorway', () => {
    const two = [
      { ...colorway, slug: 'a', isDefault: true },
      { ...colorway, slug: 'b', isDefault: true },
    ];
    expect(productSchema.safeParse({ ...base, colorways: two }).success).toBe(false);
    const none = [{ ...colorway, isDefault: false }];
    expect(productSchema.safeParse({ ...base, colorways: none }).success).toBe(false);
  });

  it('rejects duplicate colorway slugs', () => {
    const dup = [
      { ...colorway, slug: 'x', isDefault: true },
      { ...colorway, slug: 'x', isDefault: false },
    ];
    expect(productSchema.safeParse({ ...base, colorways: dup }).success).toBe(false);
  });

  it('rejects duplicate size within a colorway', () => {
    const cw = { ...colorway, variants: [variant, { ...variant, sku: 'OTHER' }] };
    expect(productSchema.safeParse({ ...base, colorways: [cw] }).success).toBe(false);
  });

  it('accepts specs as key/value entries', () => {
    expect(productSchema.safeParse({ ...base, specs: [{ key: 'Материал', value: 'Сетка' }] }).success).toBe(true);
  });

  it('rejects duplicate spec keys', () => {
    expect(
      productSchema.safeParse({
        ...base,
        specs: [
          { key: 'Материал', value: 'Сетка' },
          { key: 'Материал', value: 'Кожа' },
        ],
      }).success,
    ).toBe(false);
  });

  it('accepts Cloudinary product image URLs for the configured cloud', () => {
    vi.stubEnv('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME', 'ritm-cloud');
    const image = {
      url: 'https://res.cloudinary.com/ritm-cloud/image/upload/v1700000000/ritm/uploads/pair.jpg',
      publicId: 'ritm/uploads/pair',
    };
    expect(productSchema.safeParse({ ...base, colorways: [{ ...colorway, images: [image] }] }).success).toBe(true);
  });

  it('accepts product images uploaded through the admin product uploader folder', () => {
    vi.stubEnv('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME', 'ritm-cloud');
    const image = {
      url: 'https://res.cloudinary.com/ritm-cloud/image/upload/v1700000000/ritm/products/pair.jpg',
      publicId: 'ritm/products/pair',
    };
    expect(productSchema.safeParse({ ...base, colorways: [{ ...colorway, images: [image] }] }).success).toBe(true);
  });

  it('rejects third-party product image URLs', () => {
    vi.stubEnv('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME', 'ritm-cloud');
    const image = { url: 'https://tracker.example/pixel.jpg', publicId: 'ritm/uploads/pair' };
    expect(productSchema.safeParse({ ...base, colorways: [{ ...colorway, images: [image] }] }).success).toBe(false);
  });
});

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
