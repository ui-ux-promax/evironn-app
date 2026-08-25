import { describe, expect, it } from 'vitest';
import { optionGroupSchema, optionValueSchema } from '@/services/dto/option-group.dto';

const value = { name: ' Дуб ', slug: ' oak ', swatchHex: '#Aa7733', sortOrder: 9 };

describe('option group DTO', () => {
  it('trims names and slugs while accepting nullable valid swatches', () => {
    const result = optionGroupSchema.safeParse({
      name: ' Отделка ',
      slug: ' finish ',
      sortOrder: 4,
      values: [value, { name: ' Ткань ', slug: ' fabric ', swatchHex: null, sortOrder: 2 }],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        name: 'Отделка',
        slug: 'finish',
        sortOrder: 4,
        values: [
          { name: 'Дуб', slug: 'oak', swatchHex: '#Aa7733', sortOrder: 9 },
          { name: 'Ткань', slug: 'fabric', swatchHex: null, sortOrder: 2 },
        ],
      });
    }
  });

  it('rejects duplicate value slugs inside one group', () => {
    const result = optionGroupSchema.safeParse({
      name: 'Отделка',
      slug: 'finish',
      sortOrder: 0,
      values: [value, { ...value, name: 'Дуб светлый' }],
    });

    expect(result.success).toBe(false);
  });

  it('rejects invalid slugs, swatches, ordering, and empty values', () => {
    expect(optionValueSchema.safeParse({ ...value, slug: 'Oak Wood' }).success).toBe(false);
    expect(optionValueSchema.safeParse({ ...value, swatchHex: '#fff' }).success).toBe(false);
    expect(optionValueSchema.safeParse({ ...value, sortOrder: -1 }).success).toBe(false);
    expect(optionGroupSchema.safeParse({ name: 'Отделка', slug: 'finish', sortOrder: 0, values: [] }).success).toBe(
      false,
    );
  });
});
