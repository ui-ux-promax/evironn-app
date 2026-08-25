import { prisma } from '@/lib/prisma-client';
import { isEvironnPublicId, isLegacyPublicId, isSafeMediaPath } from './folders';

export type MediaDeleteDecision =
  | { allowed: true; reason: 'evironn-folder' | 'db-referenced-legacy' }
  | { allowed: false; reason: 'unsafe-path' | 'foreign-public-id' };

export async function resolveMediaDeleteDecision(publicId: string): Promise<MediaDeleteDecision> {
  if (!isSafeMediaPath(publicId)) return { allowed: false, reason: 'unsafe-path' };
  if (isEvironnPublicId(publicId)) return { allowed: true, reason: 'evironn-folder' };
  if (!isLegacyPublicId(publicId)) return { allowed: false, reason: 'foreign-public-id' };

  const category = await prisma.category.findFirst({
    where: { coverImagePublicId: publicId },
    select: { id: true },
  });
  if (category) return { allowed: true, reason: 'db-referenced-legacy' };

  const productMedia = await prisma.productMedia.findFirst({
    where: { publicId },
    select: { id: true },
  });
  if (productMedia) return { allowed: true, reason: 'db-referenced-legacy' };

  const skuMedia = await prisma.skuMedia.findFirst({
    where: { publicId },
    select: { id: true },
  });
  if (skuMedia) return { allowed: true, reason: 'db-referenced-legacy' };

  const productImage = await prisma.productImage.findFirst({
    where: { publicId },
    select: { id: true },
  });
  if (productImage) return { allowed: true, reason: 'db-referenced-legacy' };

  return { allowed: false, reason: 'foreign-public-id' };
}
