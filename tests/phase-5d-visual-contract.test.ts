import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const matrixPath = resolve(process.cwd(), '.superpowers/sdd/phase-5d-visual-matrix.md');
const evidenceRoot = resolve(process.cwd(), '.superpowers/sdd/phase-5d-visual-evidence');

const expectedRoutes = [
  '/admin',
  '/admin/catalog/products',
  '/admin/catalog/products/new',
  '/admin/catalog/categories/{ownedCategoryId}/edit',
  '/admin/catalog/options/{ownedOptionGroupId}/edit',
  '/admin/catalog/stock',
  '/admin/orders/{ownedOrderId}',
  '/admin/customers/{ownedCustomerId}',
  '/admin/marketing/{ownedCouponId}/edit',
  '/demo-admin',
  '/demo-admin/catalog',
  '/demo-admin/orders',
] as const;

type VisualEvidence = {
  routeTemplate: string;
  resolvedUrl: string;
  fixtureIds: Record<string, string>;
  desktopCapture: string;
  mobileCapture: string;
  overflow: { desktop: boolean; mobile: boolean };
  focusKeyboard: { desktop: string; mobile: string };
  navigation: { expected: string; actual: string };
  consoleErrors: string[];
  cleanup: { allZero: boolean; remainingOwnedRows: Record<string, number> };
};

function readEvidence(): VisualEvidence[] {
  if (!existsSync(matrixPath)) return [];
  const source = readFileSync(matrixPath, 'utf8');
  const block = source.match(/```json\r?\n([\s\S]*?)\r?\n```/);
  if (!block) return [];
  return JSON.parse(block[1]) as VisualEvidence[];
}

describe('Phase 5D representative visual evidence', () => {
  it('records all approved templates with paired captures and interaction evidence', () => {
    const evidence = readEvidence();

    expect(evidence).toHaveLength(expectedRoutes.length);
    expect(evidence.map((item) => item.routeTemplate)).toEqual([...expectedRoutes]);

    for (const item of evidence) {
      expect(item.resolvedUrl).toMatch(/^https?:\/\//);
      expect(item.fixtureIds).toEqual(expect.any(Object));
      expect(item.desktopCapture).toMatch(/phase-5d-visual-evidence[\\/].+\.png$/);
      expect(item.mobileCapture).toMatch(/phase-5d-visual-evidence[\\/].+\.png$/);
      expect(existsSync(resolve(process.cwd(), item.desktopCapture))).toBe(true);
      expect(existsSync(resolve(process.cwd(), item.mobileCapture))).toBe(true);
      expect(item.overflow.desktop).toBe(false);
      expect(item.overflow.mobile).toBe(false);
      expect(item.focusKeyboard.desktop.length).toBeGreaterThan(0);
      expect(item.focusKeyboard.mobile.length).toBeGreaterThan(0);
      expect(item.navigation.expected.length).toBeGreaterThan(0);
      expect(item.navigation.actual.length).toBeGreaterThan(0);
      expect(item.consoleErrors).toEqual(expect.any(Array));
      expect(item.cleanup.allZero).toBe(true);
      expect(Object.values(item.cleanup.remainingOwnedRows).every((count) => count === 0)).toBe(true);
    }

    const captures = evidence.flatMap((item) => [item.desktopCapture, item.mobileCapture]);
    expect(captures).toHaveLength(24);
    expect(new Set(captures).size).toBe(24);
    expect(existsSync(evidenceRoot)).toBe(true);
  });
});
