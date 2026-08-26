import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/cloudinary/config', () => ({ isCloudinaryConfigured: vi.fn() }));
vi.mock('@/lib/cloudinary/server', () => ({ deleteAsset: vi.fn() }));
vi.mock('@/lib/prisma-client', () => ({
  prisma: {
    category: { findFirst: vi.fn() },
    productMedia: { findFirst: vi.fn() },
    skuMedia: { findFirst: vi.fn() },
    productImage: { findFirst: vi.fn() },
  },
}));
vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { POST } from '@/app/api/admin/media/delete/route';
import { auth } from '@/auth';
import { isCloudinaryConfigured } from '@/lib/cloudinary/config';
import { deleteAsset } from '@/lib/cloudinary/server';
import { prisma } from '@/lib/prisma-client';

const authMock = auth as unknown as ReturnType<typeof vi.fn>;
const configuredMock = isCloudinaryConfigured as unknown as ReturnType<typeof vi.fn>;
const deleteMock = deleteAsset as unknown as ReturnType<typeof vi.fn>;
const findCategory = prisma.category.findFirst as unknown as ReturnType<typeof vi.fn>;
const findProductMedia = prisma.productMedia.findFirst as unknown as ReturnType<typeof vi.fn>;
const findSkuMedia = prisma.skuMedia.findFirst as unknown as ReturnType<typeof vi.fn>;
const findProductImage = prisma.productImage.findFirst as unknown as ReturnType<typeof vi.fn>;

function req(body: unknown) {
  return new Request('http://test/api/admin/media/delete', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  configuredMock.mockReturnValue(true);
  deleteMock.mockResolvedValue({ ok: true });
  findCategory.mockResolvedValue(null);
  findProductMedia.mockResolvedValue(null);
  findSkuMedia.mockResolvedValue(null);
  findProductImage.mockResolvedValue(null);
});

describe('POST /api/admin/media/delete', () => {
  it('anon → 401', async () => {
    authMock.mockResolvedValue(null);
    const res = await POST(req({ publicId: 'p' }));
    expect(res.status).toBe(401);
  });

  it('CUSTOMER → 403', async () => {
    authMock.mockResolvedValue({ user: { role: 'CUSTOMER' } });
    const res = await POST(req({ publicId: 'p' }));
    expect(res.status).toBe(403);
  });

  it('ADMIN not configured → 503', async () => {
    authMock.mockResolvedValue({ user: { role: 'ADMIN' } });
    configuredMock.mockReturnValue(false);
    const res = await POST(req({ publicId: 'p' }));
    expect(res.status).toBe(503);
  });

  it('ADMIN + missing publicId → 400', async () => {
    authMock.mockResolvedValue({ user: { role: 'ADMIN' } });
    const res = await POST(req({}));
    expect(res.status).toBe(400);
  });

  it('ADMIN + valid → 200 { ok:true } and calls deleteAsset', async () => {
    authMock.mockResolvedValue({ user: { role: 'ADMIN' } });
    const res = await POST(req({ publicId: 'evironn/uploads/x' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(deleteMock).toHaveBeenCalledWith('evironn/uploads/x');
  });

  it('deleteAsset throws → 200 { ok:false } (best-effort, not blocking)', async () => {
    authMock.mockResolvedValue({ user: { role: 'ADMIN' } });
    deleteMock.mockRejectedValue(new Error('cloudinary down'));
    const res = await POST(req({ publicId: 'evironn/uploads/p' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: false });
  });
});
