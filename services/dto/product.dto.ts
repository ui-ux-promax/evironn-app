import { z } from 'zod';
import { buildCombinationKey } from '@/lib/furniture-sku';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export const GENDER_VALUES = ['MEN', 'WOMEN', 'UNISEX', 'KIDS'] as const;

const specEntrySchema = z.object({
  key: z.string().trim().min(1).max(60),
  value: z.string().trim().min(1).max(200),
});

export type SpecEntry = z.infer<typeof specEntrySchema>;

const furnitureSelectionSchema = z.object({
  groupSlug: z.string().trim().min(1).regex(SLUG_RE),
  valueSlug: z.string().trim().min(1).regex(SLUG_RE),
});

const furnitureOptionValueSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1).max(80),
  slug: z.string().trim().min(1).regex(SLUG_RE),
  swatchHex: z.string().regex(HEX_RE).optional(),
  sortOrder: z.number().int().min(0),
});

const furnitureOptionGroupSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1).max(80),
  slug: z.string().trim().min(1).regex(SLUG_RE),
  sortOrder: z.number().int().min(0),
  values: z.array(furnitureOptionValueSchema).min(1),
});

const furnitureMediaSchema = z.object({
  id: z.string().optional(),
  kind: z.enum(['IMAGE', 'TURN_TABLE_VIDEO', 'TURN_TABLE_POSTER', 'TURN_TABLE_FALLBACK']),
  url: z.string().url('Некорректный URL медиа'),
  publicId: z.string().optional(),
  alt: z.string().trim().max(200).optional(),
  sortOrder: z.number().int().min(0),
});

export type AdminMediaInput = {
  id: string | null;
  kind: z.infer<typeof furnitureMediaSchema>['kind'];
  url: string;
  publicId: string | null;
  alt: string | null;
  sortOrder: number;
};

const furnitureSkuSchema = z
  .object({
    id: z.string().optional(),
    articleNumber: z.string().trim().min(1).max(64),
    combinationKey: z.string().trim().min(1).max(500),
    selectedOptions: z.array(furnitureSelectionSchema).min(1),
    price: z.number().int().min(0),
    oldPrice: z.number().int().min(0).nullable(),
    stock: z.number().int().min(0),
    active: z.boolean(),
    media: z.array(furnitureMediaSchema).optional(),
  })
  .refine((sku) => sku.oldPrice == null || sku.oldPrice > sku.price, {
    message: 'Старая цена должна быть больше текущей',
    path: ['oldPrice'],
  });

export const furnitureProductSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().trim().min(1).max(160),
    slug: z.string().trim().min(1).max(160).regex(SLUG_RE),
    brand: z.string().trim().min(1).max(80).default('Evironn'),
    categoryId: z.string().min(1),
    roomIds: z.array(z.string().trim().min(1).regex(SLUG_RE)),
    description: z.string().trim().max(4000).optional(),
    specs: z.array(specEntrySchema),
    isBestseller: z.boolean().default(false),
    active: z.boolean(),
    sortOrder: z.number().int().min(0),
    optionGroups: z.array(furnitureOptionGroupSchema).min(1),
    skus: z.array(furnitureSkuSchema).min(1),
    media: z.array(furnitureMediaSchema),
    turntable: z.boolean().optional(),
  })
  .superRefine((product, ctx) => {
    const groups = new Set(product.optionGroups.map((group) => group.slug));
    if (groups.size !== product.optionGroups.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Группы опций не должны повторяться',
        path: ['optionGroups'],
      });
    }

    for (const [groupIndex, group] of product.optionGroups.entries()) {
      const values = new Set(group.values.map((value) => value.slug));
      if (values.size !== group.values.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Значения опции не должны повторяться',
          path: ['optionGroups', groupIndex, 'values'],
        });
      }
    }

    const articles = new Set<string>();
    const combinations = new Set<string>();
    for (const [skuIndex, sku] of product.skus.entries()) {
      if (articles.has(sku.articleNumber)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Артикулы SKU должны быть уникальными',
          path: ['skus', skuIndex, 'articleNumber'],
        });
      }
      articles.add(sku.articleNumber);
      if (combinations.has(sku.combinationKey)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Комбинации SKU должны быть уникальными',
          path: ['skus', skuIndex, 'combinationKey'],
        });
      }
      combinations.add(sku.combinationKey);

      try {
        const expectedKey = buildCombinationKey(sku.selectedOptions);
        if (expectedKey !== sku.combinationKey) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Ключ комбинации не соответствует выбранным опциям',
            path: ['skus', skuIndex, 'combinationKey'],
          });
        }
      } catch (error) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: error instanceof Error ? error.message : 'Некорректная комбинация SKU',
          path: ['skus', skuIndex, 'selectedOptions'],
        });
      }

      const selectedGroups = new Set<string>();
      for (const selection of sku.selectedOptions) {
        if (selectedGroups.has(selection.groupSlug)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'SKU может выбрать только одно значение группы',
            path: ['skus', skuIndex, 'selectedOptions'],
          });
        }
        selectedGroups.add(selection.groupSlug);
        const group = product.optionGroups.find((candidate) => candidate.slug === selection.groupSlug);
        if (!group || !group.values.some((value) => value.slug === selection.valueSlug)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Значение SKU отсутствует в группе товара',
            path: ['skus', skuIndex, 'selectedOptions'],
          });
        }
      }
      if (selectedGroups.size !== groups.size) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'SKU должен выбрать ровно одно значение каждой группы товара',
          path: ['skus', skuIndex, 'selectedOptions'],
        });
      }
    }

    if (product.active && !product.skus.some((sku) => sku.active)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Активный товар требует активный SKU', path: ['active'] });
    }

    const turntableKinds = ['TURN_TABLE_VIDEO', 'TURN_TABLE_POSTER', 'TURN_TABLE_FALLBACK'] as const;
    for (const kind of turntableKinds) {
      const count = product.media.filter((media) => media.kind === kind).length;
      if (product.turntable && count !== 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Для 360-медиа требуется ровно один ресурс ${kind}`,
          path: ['media'],
        });
      }
      if (!product.turntable && count > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '360-медиа разрешено только для turntable товара',
          path: ['media'],
        });
      }
    }
  });

export type FurnitureProductValues = z.infer<typeof furnitureProductSchema>;
