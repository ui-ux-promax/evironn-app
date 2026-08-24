import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const primitiveFiles = [
  'components/admin/admin-page-header.tsx',
  'components/admin/admin-panel.tsx',
  'components/admin/ui/index.ts',
  'components/admin/ui/status.tsx',
  'components/admin/skeleton/index.ts',
];

function source(file: string): string {
  const path = resolve(file);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

describe('admin primitive contract', () => {
  it('exports the clone-compatible production primitive set', () => {
    const sources = primitiveFiles.map(source).join('\n');

    for (const exportName of [
      'AdminPageHeader',
      'AdminPanel',
      'Button',
      'Input',
      'SelectTrigger',
      'Table',
      'AdminStatusPill',
      'AdminToneBadge',
      'Skeleton',
      'ListPageSkeleton',
      'DetailPageSkeleton',
      'FormPageSkeleton',
      'DashboardSkeleton',
      'TableSkeleton',
    ]) {
      expect(sources, `missing export ${exportName}`).toContain(exportName);
    }
  });

  it('keeps status and tone vocabularies closed and deterministic', () => {
    const statuses = source('components/admin/ui/status.tsx');
    expect(statuses).toMatch(
      /ADMIN_STATUS_VALUES\s*=\s*\['pending', 'processing', 'shipped', 'delivered', 'cancelled'\] as const/,
    );
    expect(statuses).toMatch(/ADMIN_TONE_VALUES\s*=\s*\['neutral', 'info', 'success', 'warning', 'danger'\] as const/);
  });

  it('keeps every admin primitive free of clone runtime imports and stylesheet imports', () => {
    for (const file of primitiveFiles) {
      expect(source(file)).not.toMatch(
        /evironn-clone|AdminPrimitives\.css|AdminShell\.css|useAdmin|adminState|adminData/,
      );
      expect(source(file)).not.toMatch(/from\s+['"][^'"]+\.css['"]/);
    }
  });

  it('uses the existing styling mechanism and keeps skeleton coverage public', () => {
    const componentSources = primitiveFiles.slice(0, 4).map(source).join('\n');
    expect(componentSources).toMatch(/cn\(/);
    expect(source('components/admin/skeleton/index.ts')).toMatch(
      /ListPageSkeleton[\s\S]*DetailPageSkeleton[\s\S]*FormPageSkeleton[\s\S]*DashboardSkeleton[\s\S]*TableSkeleton/,
    );
    expect(source('app/globals.css')).toContain('.admin-root');
  });
});
