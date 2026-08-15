import { z } from 'zod';

export const wishlistToggleSchema = z.object({
  productId: z.string().min(1),
});
export type WishlistToggleValues = z.infer<typeof wishlistToggleSchema>;

export type WishlistMutationResult = { ok: true; active: boolean } | { ok: false; error: string };
