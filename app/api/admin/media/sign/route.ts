import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminApi } from '@/lib/admin/require-admin';
import { apiError, apiZodError, apiInternalError } from '@/lib/admin/api-error';
import { isCloudinaryConfigured, getCloudinaryEnv } from '@/lib/cloudinary/config';
import { assertSignableFolder, EVIRONN_UPLOADS_FOLDER, type EvironnMediaFolder } from '@/lib/cloudinary/folders';
import { buildUploadSignature } from '@/lib/cloudinary/sign';

const bodySchema = z.object({ folder: z.string().optional() });

export async function POST(request: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  if (!isCloudinaryConfigured()) {
    return apiError('Cloudinary не настроен', 503);
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    raw = {};
  }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) return apiZodError(parsed.error);

  const requestedFolder = parsed.data.folder ?? EVIRONN_UPLOADS_FOLDER;
  let folder: EvironnMediaFolder;
  try {
    folder = assertSignableFolder(requestedFolder);
  } catch {
    return apiError('Недопустимая папка', 400);
  }

  try {
    const { apiKey, apiSecret, cloudName } = getCloudinaryEnv();
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = buildUploadSignature({ folder, timestamp }, apiSecret as string);
    return NextResponse.json({ signature, timestamp, apiKey, cloudName, folder });
  } catch (err) {
    return apiInternalError('media_sign', err);
  }
}

export const dynamic = 'force-dynamic';
