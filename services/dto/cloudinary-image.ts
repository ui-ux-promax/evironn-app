import { z } from 'zod';
import {
  EVIRONN_CATEGORIES_FOLDER,
  EVIRONN_PRODUCTS_FOLDER,
  EVIRONN_UPLOADS_FOLDER,
  LEGACY_MEDIA_PREFIX,
} from '@/lib/cloudinary/folders';

const CLOUDINARY_HOST = 'res.cloudinary.com';
const ALLOWED_PUBLIC_ID_PREFIXES = [
  `${EVIRONN_UPLOADS_FOLDER}/`,
  `${EVIRONN_CATEGORIES_FOLDER}/`,
  `${EVIRONN_PRODUCTS_FOLDER}/`,
  `${LEGACY_MEDIA_PREFIX}uploads/`,
  `${LEGACY_MEDIA_PREFIX}categories/`,
  `${LEGACY_MEDIA_PREFIX}products/`,
] as const;

function configuredCloudName(): string | undefined {
  return process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim() || undefined;
}

export function isAllowedCloudinaryPublicId(publicId: string | undefined): boolean {
  if (!publicId) return false;
  return ALLOWED_PUBLIC_ID_PREFIXES.some((prefix) => publicId.startsWith(prefix));
}

export function isAllowedCloudinaryImageUrl(url: string, publicId: string | undefined): boolean {
  const cloudName = configuredCloudName();
  if (!cloudName || !isAllowedCloudinaryPublicId(publicId)) return false;

  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === 'https:' &&
      parsed.hostname === CLOUDINARY_HOST &&
      parsed.pathname.startsWith(`/${cloudName}/`)
    );
  } catch {
    return false;
  }
}

export function cloudinaryImageIssue(path: (string | number)[]) {
  return {
    code: z.ZodIssueCode.custom,
    path,
    message: 'Изображение должно быть загружено через Cloudinary Evironn',
  } as const;
}
