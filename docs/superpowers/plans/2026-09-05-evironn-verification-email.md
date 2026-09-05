# Evironn Verification Email Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the inherited verification email with the approved Evironn “Quiet Interior” design and remove the remaining RITM-era email copy and fallback host.

**Architecture:** Keep the existing React Email component boundary: `EmailLayout` owns the shared canvas, header, card, and footer, while `VerificationCodeEmail` owns verification-specific hierarchy and the dynamic code. Verify the generated HTML rather than coupling tests only to source strings, and retain the existing welcome-email body while allowing it to inherit the new frame.

**Tech Stack:** React 18, TypeScript, `@react-email/components`, `react-dom/server`, Vitest, Prettier, ESLint

## Global Constraints

- Approved direction: Variant 1 — Quiet Interior.
- Verification-code panel background: Evironn system black `#211F1D`.
- Use React Email components and inline styles only; no remote fonts, CSS variables, gradients, client behavior, or required remote images.
- Preserve `EmailLayout({ preview, children })` and `VerificationCodeEmail({ code })` interfaces and the dynamic preview text.
- Preserve verification-service behavior, rate limits, code lifetime, registration UI, and Resend transport unchanged.
- Keep `emails/welcome.tsx` body content unchanged except for the corrected fallback site host and inherited shared-frame styling.
- Do not run the complete repository gate, build, or E2E suite for this bounded email-only change.

---

### Task 1: Implement and verify the approved email system

**Files:**

- Modify: `tests/email-branding.test.ts`
- Modify: `emails/_layout.tsx`
- Modify: `emails/verification-code.tsx`
- Modify: `emails/welcome.tsx`

**Interfaces:**

- Consumes: `EmailLayout({ preview: string, children: ReactNode }): JSX.Element`
- Produces: the same `EmailLayout` interface with the approved shared Evironn frame
- Consumes: `VerificationCodeEmail({ code: string }): JSX.Element`
- Produces: the same `VerificationCodeEmail` interface with the approved Quiet Interior body and dynamic code

- [ ] **Step 1: Add failing render and legacy-removal assertions**

Extend `tests/email-branding.test.ts` so it renders the verification component and checks both the approved design and removal of inherited content:

```ts
import { createElement } from 'react';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { VerificationCodeEmail } from '../emails/verification-code';

const emailFiles = ['emails/_layout.tsx', 'emails/verification-code.tsx', 'emails/welcome.tsx'];

describe('Evironn email templates', () => {
  it('use current Evironn branding without inherited RITM content', () => {
    for (const file of emailFiles) {
      const source = readFileSync(file, 'utf8');

      expect(source).toContain('Evironn');
      expect(source).not.toContain('STRIDE');
      expect(source).not.toContain('Одежда для вашего ритма.');
      expect(source).not.toContain('cloudd3r.eu.cc');
    }
  });

  it('renders the approved Quiet Interior verification treatment', () => {
    const html = renderToStaticMarkup(createElement(VerificationCodeEmail, { code: '481034' }));

    expect(html).toContain('481034');
    expect(html).toContain('Код подтверждения');
    expect(html).toContain('Подтвердите<br/>почту');
    expect(html).toContain('Никому его не передавайте.');
    expect(html).toContain('Не регистрировались в Evironn?');
    expect(html.toLowerCase()).toContain('background-color:#211f1d');
  });
});
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run:

```powershell
npm test -- tests/email-branding.test.ts
```

Expected: FAIL because the current templates still contain `Одежда для вашего ритма.`, `cloudd3r.eu.cc`, the green code treatment, and no approved safety copy.

- [ ] **Step 3: Replace the shared email frame**

Update `emails/_layout.tsx` to:

- change the fallback `SITE` to `https://evironn-app.vercel.app`;
- use canvas `#F3F1EC`, surface `#FFFFFF`, ink `#2F2D2B`, muted `#817B74`, and line `#E9E4DC`;
- render the text wordmark `Evironn` and the utility label `Ваш аккаунт` above the white surface;
- use a `560px` maximum column, `24px` surface radius, and email-safe Arial/Helvetica typography;
- remove the inherited black top stripe;
- replace the RITM slogan with `Мебель для жизни.` while retaining the configured host text.

Replace the file with:

```tsx
import { Body, Column, Container, Head, Html, Preview, Row, Section, Text } from '@react-email/components';
import type { ReactNode } from 'react';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://evironn-app.vercel.app';

const colors = {
  canvas: '#F3F1EC',
  ink: '#2F2D2B',
  line: '#E9E4DC',
  muted: '#817B74',
  surface: '#FFFFFF',
};

export function EmailLayout({ preview, children }: { preview: string; children: ReactNode }) {
  const host = SITE.replace(/^https?:\/\//, '');

  return (
    <Html lang="ru">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: colors.canvas, fontFamily: 'Arial, Helvetica, sans-serif', margin: 0 }}>
        <Container style={{ margin: '0 auto', maxWidth: 560, padding: '28px 20px 36px' }}>
          <Section style={{ padding: '0 6px 20px' }}>
            <Row>
              <Column>
                <Text style={{ color: colors.ink, fontSize: 28, fontWeight: 700, letterSpacing: '-1.4px', margin: 0 }}>
                  Evironn
                </Text>
              </Column>
              <Column style={{ textAlign: 'right' }}>
                <Text
                  style={{
                    color: colors.muted,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '1.2px',
                    margin: 0,
                    textTransform: 'uppercase',
                  }}
                >
                  Ваш аккаунт
                </Text>
              </Column>
            </Row>
          </Section>
          <Section
            style={{
              backgroundColor: colors.surface,
              border: `1px solid ${colors.line}`,
              borderRadius: 24,
              overflow: 'hidden',
            }}
          >
            <Section style={{ padding: '34px 32px 32px' }}>{children}</Section>
          </Section>
          <Section style={{ padding: '18px 6px 0' }}>
            <Row>
              <Column>
                <Text style={{ color: colors.muted, fontSize: 11, lineHeight: '17px', margin: 0 }}>
                  © 2026 Evironn · {host}
                </Text>
              </Column>
              <Column style={{ textAlign: 'right' }}>
                <Text style={{ color: colors.muted, fontSize: 11, lineHeight: '17px', margin: 0 }}>
                  Мебель для жизни.
                </Text>
              </Column>
            </Row>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
```

- [ ] **Step 4: Implement the approved verification body**

Replace `emails/verification-code.tsx` with the exact approved content and hierarchy:

```tsx
import { Heading, Hr, Section, Text } from '@react-email/components';
import { EmailLayout } from './_layout';

export function VerificationCodeEmail({ code }: { code: string }) {
  return (
    <EmailLayout preview={`Код подтверждения Evironn: ${code}`}>
      <Text
        style={{
          color: '#48564E',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '1.3px',
          margin: '0 0 12px',
          textTransform: 'uppercase',
        }}
      >
        Регистрация
      </Text>
      <Heading style={{ color: '#2F2D2B', fontSize: 28, fontWeight: 500, lineHeight: '31px', margin: '0 0 14px' }}>
        Подтвердите
        <br />
        почту
      </Heading>
      <Text style={{ color: '#6F6A64', fontSize: 15, lineHeight: '23px', margin: '0 0 26px' }}>
        Введите код в окне регистрации, чтобы завершить создание аккаунта.
      </Text>
      <Section style={{ backgroundColor: '#211F1D', borderRadius: 16, margin: '0 0 22px', padding: '18px 14px 17px' }}>
        <Text
          style={{
            color: '#A8AAA7',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '1.2px',
            margin: '0 0 8px',
            textAlign: 'center',
            textTransform: 'uppercase',
          }}
        >
          Код подтверждения
        </Text>
        <Text
          style={{
            color: '#FFFFFF',
            fontSize: 32,
            fontVariantNumeric: 'tabular-nums',
            fontWeight: 700,
            letterSpacing: '7px',
            lineHeight: '38px',
            margin: 0,
            textAlign: 'center',
            textIndent: '7px',
          }}
        >
          {code}
        </Text>
      </Section>
      <Text style={{ color: '#817B74', fontSize: 13, lineHeight: '20px', margin: 0 }}>
        Код действует 10 минут. Никому его не передавайте.
      </Text>
      <Hr style={{ borderColor: '#E9E4DC', margin: '22px 0 16px' }} />
      <Text style={{ color: '#817B74', fontSize: 13, lineHeight: '20px', margin: 0 }}>
        Не регистрировались в Evironn? Просто проигнорируйте это письмо.
      </Text>
    </EmailLayout>
  );
}

export default function Preview() {
  return <VerificationCodeEmail code="123456" />;
}
```

Use `backgroundColor: '#211F1D'`, white code text, `32px` code size, tabular numerals, and restrained letter spacing that keeps six digits within a narrow mobile viewport.

- [ ] **Step 5: Correct the welcome-email fallback only**

Change only the fallback constant in `emails/welcome.tsx`; do not alter the welcome heading, paragraph, or button copy:

```ts
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://evironn-app.vercel.app';
```

- [ ] **Step 6: Run GREEN and focused static checks**

Run:

```powershell
npm test -- tests/email-branding.test.ts
npm exec prettier -- --check emails/_layout.tsx emails/verification-code.tsx emails/welcome.tsx tests/email-branding.test.ts
npm exec eslint -- emails/_layout.tsx emails/verification-code.tsx emails/welcome.tsx tests/email-branding.test.ts
git diff --check -- emails/_layout.tsx emails/verification-code.tsx emails/welcome.tsx tests/email-branding.test.ts
```

Expected: the focused Vitest file passes, Prettier reports all four files formatted, ESLint reports zero errors in the four files, and `git diff --check` produces no output.

- [ ] **Step 7: Render and inspect desktop and mobile previews**

Run the React Email preview server:

```powershell
npm run email:dev
```

Open the verification preview and inspect at approximately `560px` and `320px` content widths. Confirm:

- no horizontal clipping;
- all six digits remain on one line and are visually dominant;
- the code panel is `#211F1D`;
- the message remains understandable without remote images;
- the footer contains only Evironn furniture copy and the current host;
- the welcome preview still renders inside the updated shared frame.

- [ ] **Step 8: Review the bounded diff and commit**

Run:

```powershell
git diff -- emails/_layout.tsx emails/verification-code.tsx emails/welcome.tsx tests/email-branding.test.ts
git status --short
git config user.name
git config user.email
```

Confirm unrelated working-tree files remain unstaged and Git identity remains `ui-ux-promax <gojjoy22@gmail.com>`, then commit only the four task files:

```powershell
git add -- emails/_layout.tsx emails/verification-code.tsx emails/welcome.tsx tests/email-branding.test.ts
git commit -m "feat: redesign verification email"
```
