import { prisma } from '@/lib/prisma-client';
import { isEvironnPublicId, isLegacyPublicId, isSafeMediaPath } from './folders';
import type { UploadedImage } from '@/lib/cloudinary/types';

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

export function shouldDeleteImmediately(image: UploadedImage): boolean {
  return Boolean(image.publicId) && image.persisted !== true;
}

export function removedPersistedPublicIds(before: UploadedImage[], after: UploadedImage[]): string[] {
  const kept = new Set(after.map((image) => image.publicId).filter(Boolean));
  return before
    .filter((image) => image.persisted === true && image.publicId && !kept.has(image.publicId))
    .map((image) => image.publicId);
}
