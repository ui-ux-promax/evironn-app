import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

describe('profile wishlist DTO boundary', () => {
  it('renders the production Profile Variant A from the protected canonical DTO route', () => {
    const source = readFileSync('app/(shop)/profile/page.tsx', 'utf8');

    expect(source).toContain("import { ProfileVariantA } from '@/components/evironn/profile/profile-variant-a'");
    expect(source).toContain("import { getProfilePageDto } from '@/lib/profile-page'");
    expect(source).toContain('const dto = await getProfilePageDto(session.user.id);');
    expect(source).toContain('<ProfileVariantA dto={dto} />');
    expect(source).not.toContain('ProfileView');
  });
});
