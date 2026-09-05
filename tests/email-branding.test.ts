import { readFileSync } from 'node:fs';
import { createElement } from 'react';
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
