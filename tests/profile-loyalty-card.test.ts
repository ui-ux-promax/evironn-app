import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const profileView = readFileSync(resolve(process.cwd(), 'components/shared/profile/profile-view.tsx'), 'utf8');

describe('profile loyalty card watermark', () => {
  it('uses the Ritm wordmark instead of the old line illustration', () => {
    expect(profileView).toMatch(/aria-hidden="true"[\s\S]*>\s*Ritm\s*<\/span>/);
    expect(profileView).not.toContain('M6 25L17 8L27 25L36 8L46 25');
  });
});
