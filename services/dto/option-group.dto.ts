import { z } from 'zod';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SWATCH_RE = /^#[0-9a-fA-F]{6}$/;

export const optionValueSchema: z.ZodType<{
  id?: string;
  name: string;
  slug: string;
  swatchHex: string | null;
  sortOrder: number;
}> = z.object({
  id: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1, 'Укажите название значения').max(100, 'Название до 100 символов'),
  slug: z
    .string()
    .trim()
    .min(1, 'Укажите slug значения')
    .max(100, 'Slug до 100 символов')
    .regex(SLUG_RE, 'Slug: только латиница, цифры и дефис'),
  swatchHex: z.string().regex(SWATCH_RE, 'Swatch: формат #rrggbb').nullable(),
  sortOrder: z.number().int('Порядок должен быть целым').nonnegative('Порядок не может быть отрицательным'),
});

export type OptionValueValues = z.infer<typeof optionValueSchema>;

export const optionGroupSchema: z.ZodType<{
  id?: string;
  name: string;
  slug: string;
  sortOrder: number;
  values: OptionValueValues[];
}> = z
  .object({
    id: z.string().trim().min(1).optional(),
    name: z.string().trim().min(1, 'Укажите название группы').max(100, 'Название до 100 символов'),
    slug: z
      .string()
      .trim()
      .min(1, 'Укажите slug группы')
      .max(100, 'Slug до 100 символов')
      .regex(SLUG_RE, 'Slug: только латиница, цифры и дефис'),
    sortOrder: z.number().int('Порядок должен быть целым').nonnegative('Порядок не может быть отрицательным'),
    values: z.array(optionValueSchema).min(1, 'Добавьте хотя бы одно значение'),
  })
  .superRefine((group, ctx) => {
    const seen = new Set<string>();
    group.values.forEach((value, index) => {
      if (seen.has(value.slug)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['values', index, 'slug'],
          message: 'Slug значения должен быть уникальным',
        });
      }
      seen.add(value.slug);
    });
  });

export type OptionGroupValues = z.infer<typeof optionGroupSchema>;
