import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('CI quality workflow', () => {
  it('runs the safe quality commands without database mutations or e2e', async () => {
    const workflow = await readFile(path.join(process.cwd(), '.github', 'workflows', 'ci.yml'), 'utf8');

    expect(workflow).toContain('npm ci');
    expect(workflow).toContain('npm run prisma:generate');
    expect(workflow).toContain('npm run typecheck');
    expect(workflow).toContain('npm run test');
    expect(workflow).toContain('npm run build');
    expect(workflow).toMatch(/uses:\s*actions\/checkout@v6\s*\n\s*with:\s*\n\s*lfs:\s*true/);
    expect(workflow).not.toContain('https://ritm-app-eight.vercel.app');
    expect(workflow).not.toMatch(/prisma db push/);
    expect(workflow).not.toMatch(/prisma db seed/);
    expect(workflow).not.toMatch(/npm run e2e/);
  });
});
