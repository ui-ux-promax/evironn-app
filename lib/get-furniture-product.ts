import { prisma } from '@/lib/prisma-client';
import { productDetailInclude, type FurnitureProductDetail } from '@/lib/product-selection';

export { productDetailInclude } from '@/lib/product-selection';
export type { FurnitureProductDetail } from '@/lib/product-selection';

export function getFurnitureProductBySlug(slug: string): Promise<FurnitureProductDetail | null> {
  return prisma.product.findFirst({ where: { slug, active: true }, include: productDetailInclude });
}
