# Evironn verification email redesign

## Status

Approved visual direction: **Variant 1 — Quiet Interior**, with the verification-code panel changed from green to the Evironn system black `#211F1D`.

## Goal

Replace the inherited RITM-style verification email with a compact, furniture-led Evironn composition that feels consistent with the accepted storefront while remaining robust in Gmail, Mail.ru, Outlook, and common mobile email clients.

## Scope

- Redesign `emails/verification-code.tsx` around the approved Quiet Interior composition.
- Adapt `emails/_layout.tsx` so the shared email frame uses the Evironn mark/wordmark, neutral interior palette, and current furniture copy.
- Remove the legacy RITM line `Одежда для вашего ритма.` from the shared footer.
- Preserve `EmailLayout` and `VerificationCodeEmail` public interfaces and the existing verification flow.
- Keep `emails/welcome.tsx` compatible with the updated shared layout; do not redesign its body content beyond inherited frame changes.

## Visual system

### Palette

- Canvas: `#F3F1EC`
- Surface: `#FFFFFF`
- Primary ink: `#2F2D2B`
- System black / code panel: `#211F1D`
- Muted text: `#817B74`
- Subtle line: `#E9E4DC`
- Restrained Evironn accent: `#48564E`

### Typography

Use an email-safe Arial/Helvetica stack for body copy. Render `Evironn` as a styled text wordmark so branding remains visible when remote images are blocked and no email client must support SVG or web-font delivery. Headings use medium weight, compact leading, and restrained negative letter spacing to echo the storefront.

### Composition

1. A quiet neutral canvas surrounds a centered email column.
2. The text wordmark `Evironn` sits above the message with the utility label `Ваш аккаунт`.
3. A white rounded surface contains the registration eyebrow, two-line heading, instruction, code panel, expiry warning, and unsolicited-request guidance.
4. The six-digit code is the only high-contrast focal point: white digits on system black `#211F1D`.
5. The footer uses `© 2026 Evironn`, the configured site host, and furniture-domain copy. No RITM wording remains.

## Content

- Eyebrow: `Регистрация`
- Heading: `Подтвердите почту`
- Instruction: `Введите код в окне регистрации, чтобы завершить создание аккаунта.`
- Code label: `Код подтверждения`
- Safety line: `Код действует 10 минут. Никому его не передавайте.`
- Unsolicited-request line: `Не регистрировались в Evironn? Просто проигнорируйте это письмо.`
- Footer descriptor: `Мебель для жизни.`

## Technical boundaries

- Use React Email components and inline style objects; do not introduce client-side behavior, remote font dependencies, CSS variables, gradients, or fragile positioning.
- Keep the message readable when border radius or advanced styling is ignored by an email client.
- Preserve the dynamic verification `code` and preview text.
- Preserve the configured site-host rendering without exposing credentials or environment values, and replace the stale fallback host with `evironn-app.vercel.app`.
- Do not add required remote images; the message and brand must remain complete when images are blocked.

## Verification

- Add focused source/render assertions for the approved copy, `#211F1D` code panel, dynamic code, Evironn branding, and absence of the legacy RITM slogan.
- Render the verification email at desktop and narrow/mobile widths and inspect hierarchy, clipping, code legibility, and image-blocked fallback.
- Run formatting/lint only for touched files plus the focused email tests. Do not run the complete project gate for this bounded change.

## Out of scope

- Verification-service logic, rate limits, code lifetime, registration UI, Resend transport, and provider configuration.
- A separate redesign of the welcome-email body.
- New tracking, marketing content, buttons, or links.
