import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

describe('legacy checkout form boundary', () => {
  it('cannot submit a fabricated partial placement payload', () => {
    const source = fs.readFileSync(path.join(root, 'components/shared/checkout/checkout-form.tsx'), 'utf8');

    expect(source).not.toContain("from './checkout-submit'");
    expect(source).not.toContain('placeOrder');
    expect(source).not.toContain('submitCheckoutValues');
    expect(source).not.toContain('onSubmit=');
    expect(source).toMatch(/<button\s+[\s\S]*?type="button"[\s\S]*?disabled/);
  });

  it('removes the legacy server-action wrapper', () => {
    expect(fs.existsSync(path.join(root, 'components/shared/checkout/checkout-submit.ts'))).toBe(false);
    expect(fs.existsSync(path.join(root, 'tests/checkout-form-submit.test.ts'))).toBe(false);
  });
});
