import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (file: string) => readFileSync(join(root, file), 'utf8');

describe('production Auth Variant B source contract', () => {
  it('uses production route boundaries and safe verification state', () => {
    const login = read('app/(auth)/login/page.tsx');
    const register = read('app/(auth)/register/page.tsx');
    const controller = read('components/evironn/auth/auth-variant-b-controller.tsx');
    const shell = read('components/evironn/auth/auth-variant-b.tsx');
    const layout = read('app/(auth)/layout.tsx');

    expect(login).toMatch(/safeCallbackUrl/);
    expect(register).toMatch(/safeCallbackUrl/);
    expect(login).toMatch(/readPending/);
    expect(register).toMatch(/readPending/);
    expect(controller).toMatch(/signIn\(['"]google['"]/);
    expect(controller).toMatch(/signIn\(['"]credentials['"]/);
    expect(controller).toMatch(/registerUser/);
    expect(controller).toMatch(/ensureVerificationGate/);
    expect(controller).toMatch(/verifyEmailCode/);
    expect(controller).toMatch(/resendVerificationCode/);
    expect(shell).toMatch(/auth-page auth-page--b/);
    expect(shell).toMatch(/auth-page__stage/);
    expect(shell).toMatch(/auth-page__composition/);
    expect(layout).toMatch(/StorefrontHeader/);
    expect(layout).toMatch(/StorefrontFooter/);
    expect(layout).toMatch(/getInitialCartCount/);
    expect(layout).not.toMatch(/VerificationGateHost/);
  });

  it('keeps shell server-boundary isolation and bans clone auth paths', () => {
    const login = read('app/(auth)/login/page.tsx');
    const register = read('app/(auth)/register/page.tsx');
    const controller = read('components/evironn/auth/auth-variant-b-controller.tsx');
    const shell = read('components/evironn/auth/auth-variant-b.tsx');
    const state = read('components/evironn/auth/auth-variant-b-state.ts');
    const forbidden =
      /useAuth|authState|mock|123456|phone|SMS|sms|recover|VK|Yandex|Telegram|guest checkout|window\.location\.search/i;

    expect(shell).not.toMatch(forbidden);
    expect(state).not.toMatch(forbidden);
    for (const source of [controller, login, register]) expect(source).not.toMatch(forbidden);
    expect(shell).not.toMatch(/@\/auth|@\/lib\/prisma|cookies\(/);
  });

  it('imports auth styles at root and assets use normative clone hashes', () => {
    const rootLayout = read('app/layout.tsx');
    const expected = {
      'public/assets/products/05-graphite-walnut-room-integrated-v2.png':
        '77AD814923CEA3E2381F5596C9A50FBA3B07E8446625DCDEA90FCECE25FC80D7',
      'public/assets/products/05-ivory-walnut-chair-alpha.png':
        '75106ABA76F8C121ADC3A9D5497A6566655A53320EE519267CBE86CAC6EF66F1',
      'public/assets/products/05-terracotta-walnut-chair-alpha.png':
        '19F4717415537D49BBF6195D79A2ED35AB5A7AF240A538A03B9FDED5203D385D',
    };

    expect(rootLayout).toMatch(/styles\/evironn\/FormPrimitives\.css/);
    expect(rootLayout).toMatch(/styles\/evironn\/AuthPage\.css/);
    for (const [file, hash] of Object.entries(expected)) {
      expect(existsSync(join(root, file))).toBe(true);
      const digest = createHash('sha256')
        .update(readFileSync(join(root, file)))
        .digest('hex')
        .toUpperCase();
      expect(digest).toBe(hash);
    }
  });
});
