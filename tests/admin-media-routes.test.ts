import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/cloudinary/config', () => ({
  isCloudinaryConfigured: vi.fn(),
  getCloudinaryEnv: vi.fn(),
}));
vi.mock('@/lib/cloudinary/server', () => ({ deleteAsset: vi.fn() }));
vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));
vi.mock('@/lib/prisma-client', () => ({
  prisma: {
    category: { findFirst: vi.fn() },
    productMedia: { findFirst: vi.fn() },
    skuMedia: { findFirst: vi.fn() },
    productImage: { findFirst: vi.fn() },
  },
}));

import { auth } from '@/auth';
import { POST as deleteMedia } from '@/app/api/admin/media/delete/route';
import { POST as signMedia } from '@/app/api/admin/media/sign/route';
import { isCloudinaryConfigured, getCloudinaryEnv } from '@/lib/cloudinary/config';
import { deleteAsset } from '@/lib/cloudinary/server';
import { prisma } from '@/lib/prisma-client';

const authMock = auth as unknown as ReturnType<typeof vi.fn>;
const configuredMock = isCloudinaryConfigured as unknown as ReturnType<typeof vi.fn>;
const envMock = getCloudinaryEnv as unknown as ReturnType<typeof vi.fn>;
const deleteMock = deleteAsset as unknown as ReturnType<typeof vi.fn>;
const findCategory = prisma.category.findFirst as unknown as ReturnType<typeof vi.fn>;
const findProductMedia = prisma.productMedia.findFirst as unknown as ReturnType<typeof vi.fn>;
const findSkuMedia = prisma.skuMedia.findFirst as unknown as ReturnType<typeof vi.fn>;
const findProductImage = prisma.productImage.findFirst as unknown as ReturnType<typeof vi.fn>;

function request(body: unknown): Request {
  return new Request('http://test/api/admin/media', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function requestWithJson(json: ReturnType<typeof vi.fn>): Request {
  return { json } as unknown as Request;
}

beforeEach(() => {
  vi.clearAllMocks();
  authMock.mockResolvedValue({ user: { role: 'ADMIN' } });
  configuredMock.mockReturnValue(true);
  envMock.mockReturnValue({ cloudName: 'cloud', apiKey: 'key', apiSecret: 'test-only-secret' });
  deleteMock.mockResolvedValue({ ok: true });
  findCategory.mockResolvedValue(null);
  findProductMedia.mockResolvedValue(null);
  findSkuMedia.mockResolvedValue(null);
  findProductImage.mockResolvedValue(null);
});

describe('POST /api/admin/media/sign', () => {
  it('checks ADMIN before config and config before parsing the body', async () => {
    authMock.mockResolvedValue(null);
    const deniedJson = vi.fn().mockResolvedValue({ folder: 'ritm/uploads' });
    expect((await signMedia(requestWithJson(deniedJson))).status).toBe(401);
    expect(configuredMock).not.toHaveBeenCalled();
    expect(deniedJson).not.toHaveBeenCalled();

    authMock.mockResolvedValue({ user: { role: 'ADMIN' } });
    configuredMock.mockReturnValue(false);
    const unconfiguredJson = vi.fn().mockResolvedValue({ folder: 'ritm/uploads' });
    expect((await signMedia(requestWithJson(unconfiguredJson))).status).toBe(503);
    expect(unconfiguredJson).not.toHaveBeenCalled();
  });

  it('refuses ritm uploads and signs the default Evironn folder only', async () => {
    expect((await signMedia(request({ folder: 'ritm/uploads' }))).status).toBe(400);

    const response = await signMedia(request({}));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ folder: 'evironn/uploads', cloudName: 'cloud', apiKey: 'key' });
    expect(JSON.stringify(body)).not.toContain('test-only-secret');
  });
});

describe('POST /api/admin/media/delete', () => {
  it('checks ADMIN before config and config before parsing the body', async () => {
    authMock.mockResolvedValue(null);
    const deniedJson = vi.fn().mockResolvedValue({ publicId: 'evironn/products/chair' });
    expect((await deleteMedia(requestWithJson(deniedJson))).status).toBe(401);
    expect(configuredMock).not.toHaveBeenCalled();
    expect(deniedJson).not.toHaveBeenCalled();

    authMock.mockResolvedValue({ user: { role: 'ADMIN' } });
    configuredMock.mockReturnValue(false);
    const unconfiguredJson = vi.fn().mockResolvedValue({ publicId: 'evironn/products/chair' });
    expect((await deleteMedia(requestWithJson(unconfiguredJson))).status).toBe(503);
    expect(unconfiguredJson).not.toHaveBeenCalled();
  });

  it('accepts an Evironn-owned ID and destroys it idempotently', async () => {
    const response = await deleteMedia(request({ publicId: 'evironn/products/chair' }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(deleteMock).toHaveBeenCalledWith('evironn/products/chair');
    expect(findCategory).not.toHaveBeenCalled();
  });

  it('accepts a legacy ID only when an exact database reference exists', async () => {
    findCategory.mockResolvedValueOnce(null);
    findProductMedia.mockResolvedValueOnce(null);
    findSkuMedia.mockResolvedValueOnce(null);
    findProductImage.mockResolvedValueOnce({ id: 'legacy-image' });

    const response = await deleteMedia(request({ publicId: 'ritm/products/old-chair' }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(deleteMock).toHaveBeenCalledWith('ritm/products/old-chair');
  });

  it('refuses foreign and unsafe IDs with the existing error envelope', async () => {
    const foreign = await deleteMedia(request({ publicId: 'foreign/products/chair' }));
    expect(foreign.status).toBe(400);
    expect(await foreign.json()).toEqual({ message: expect.any(String) });
    expect(deleteMock).not.toHaveBeenCalled();

    const unsafe = await deleteMedia(request({ publicId: 'ritm/products/../secret' }));
    expect(unsafe.status).toBe(400);
    expect(await unsafe.json()).toEqual({ message: expect.any(String) });
    expect(deleteMock).not.toHaveBeenCalled();
  });
});
