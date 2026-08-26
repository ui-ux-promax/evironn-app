import { z } from 'zod';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const roomSchema: z.ZodType<{
  id?: string;
  name: string;
  slug: string;
  sortOrder: number;
}> = z.object({
  id: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1, 'Укажите название комнаты').max(100, 'Название до 100 символов'),
  slug: z
    .string()
    .trim()
    .min(1, 'Укажите slug комнаты')
    .max(100, 'Slug до 100 символов')
    .regex(SLUG_RE, 'Slug: только латиница, цифры и дефис'),
  sortOrder: z.number().int('Порядок должен быть целым').nonnegative('Порядок не может быть отрицательным'),
});

export type RoomValues = z.infer<typeof roomSchema>;
