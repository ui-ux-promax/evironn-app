# P1 Design-System Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the reusable Evironn prototype foundation while preserving approved `/` and `/product` output.

**Architecture:** Keep approved P0 application code in place. Add canonical tokens, route/data contracts, and reusable prototype components under isolated `src/design-system` and `src/prototypes` boundaries; use a source-only top-level `prototypes` workspace contract. Scope the automated visual-value audit to P1-owned files so legacy approved CSS remains untouched.

**Tech Stack:** React 18, TypeScript 5, Vite 5, Vitest, `react-dom/server`, Playwright, CSS custom properties.

## Global Constraints

- `D:\Projects\evironn-app` is the clean destination repository.
- `C:\Users\010726Admin\Downloads\prototypes-furni` remains a read-only archive.
- `design-system.html` is the primary visual authority for new pages.
- Approved `/` and `/product` output is preserved; it is not redesigned for later uniformity.
- Only approved storefront/admin routes ship; `/demo-admin` is excluded.
- No new colors, radii, shadows, typography, or motion patterns without a phase specification.
- No public captures, prompts, generator artifacts, logs, screenshots, source maps, local absolute paths, or reference-site URLs.
- English Conventional Commits; no AI/tool attribution or co-author trailers.
- `gate` is required before every commit; `gate:full` is required before phase closure.

---

### Task 1: Normalize and document P1 foundation boundary

**Files:**
- Create: `docs/specs/2026-08-06-p1-design-system-foundation.md`
- Create: `prototypes/README.md`
- Test: `tests/prototypes-workspace-contract.test.ts`

**Interfaces:**
- Produces: source-only prototype workspace contract consumed by Tasks 2–5.

- [ ] **Step 1: Write failing workspace contract test**

```ts
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const root = resolve(import.meta.dirname, '..');

test('prototype workspace is source-only and documents public-entry boundary', () => {
  const readmePath = resolve(root, 'prototypes/README.md');
  expect(existsSync(readmePath)).toBe(true);
  const readme = readFileSync(readmePath, 'utf8');
  expect(readme).toContain('source-only');
  expect(readme).toContain('not a public route');
});
```

- [ ] **Step 2: Run test and verify expected failure**

Run: `npx vitest run tests/prototypes-workspace-contract.test.ts`

Expected: FAIL because `prototypes/README.md` does not exist.

- [ ] **Step 3: Add workspace contract**

Create `prototypes/README.md` with exact scope:

```md
# Evironn prototype workspace

Source-only workspace for reusable Vite prototype contracts and components.
It is not a public route and does not add a standalone Vite entry.

Approved storefront output remains in the root application. New phase pages
consume `src/design-system` and `src/prototypes` contracts.
```

- [ ] **Step 4: Run focused test**

Run: `npx vitest run tests/prototypes-workspace-contract.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

Run: `git add docs/specs/2026-08-06-p1-design-system-foundation.md prototypes/README.md tests/prototypes-workspace-contract.test.ts && git commit -m "docs: define P1 prototype workspace"`

### Task 2: Extract canonical tokens and enforce visual-value audit

**Files:**
- Create: `src/design-system/tokens.css`
- Create: `src/design-system/tokens.ts`
- Create: `scripts/check-design-system.mjs`
- Create: `tests/design-system-contract.test.ts`
- Modify: `package.json`, `src/index.css`

**Interfaces:**
- Produces: `designSystemTokens` typed token metadata; `npm run check:design-system` audit command; `--ev-ds-*` CSS variables for Tasks 3–5.

- [ ] **Step 1: Write failing token and audit tests**

Test required semantic token names and audit command:

```ts
import { execFileSync } from 'node:child_process';
import { describe, expect, test } from 'vitest';
import { designSystemTokens } from '../src/design-system/tokens';

test('exports canonical semantic token groups', () => {
  expect(designSystemTokens.color).toContain('--ev-ds-color-text');
  expect(designSystemTokens.radius).toEqual([
    '--ev-ds-radius-sm',
    '--ev-ds-radius-md',
    '--ev-ds-radius-lg',
    '--ev-ds-radius-pill',
  ]);
  expect(designSystemTokens.motion).toContain('--ev-ds-motion-ease');
});

test('design-system audit rejects raw visual values in prototype-owned files', () => {
  expect(() =>
    execFileSync(process.execPath, ['scripts/check-design-system.mjs'], {
      cwd: process.cwd(),
      stdio: 'pipe',
    }),
  ).not.toThrow();
});
```

Add a temporary fixture assertion inside the script test path so the audit test first fails on missing files/command, not on an implementation-specific snapshot.

- [ ] **Step 2: Run focused test and verify expected failure**

Run: `npx vitest run tests/design-system-contract.test.ts`

Expected: FAIL because `src/design-system/tokens.ts` and `scripts/check-design-system.mjs` do not exist.

- [ ] **Step 3: Add canonical token declarations**

Create `src/design-system/tokens.css` with only canonical declarations:

```css
:root {
  --ev-ds-color-bg: 40 20% 97%;
  --ev-ds-color-surface: 0 0% 100%;
  --ev-ds-color-surface-soft: 40 14% 94%;
  --ev-ds-color-text: 30 6% 18%;
  --ev-ds-color-text-muted: 30 4% 50%;
  --ev-ds-color-primary: 30 6% 18%;
  --ev-ds-color-primary-foreground: 0 0% 100%;
  --ev-ds-color-accent: 150 8% 30%;
  --ev-ds-color-accent-foreground: 0 0% 100%;
  --ev-ds-color-warm-accent: 20 35% 52%;
  --ev-ds-color-warm-accent-foreground: 0 0% 100%;
  --ev-ds-color-border: 30 6% 91%;
  --ev-ds-color-danger: 4 68% 50%;
  --ev-ds-color-success: 145 25% 40%;
  --ev-ds-color-warning: 38 80% 48%;
  --ev-ds-color-info: 205 65% 45%;
  --ev-ds-color-footer: 30 8% 12%;
  --ev-ds-font-display: 'Golos Text', -apple-system, system-ui, sans-serif;
  --ev-ds-font-body: 'Golos Text', -apple-system, system-ui, sans-serif;
  --ev-ds-font-wordmark: 'Fraunces', Georgia, serif;
  --ev-ds-radius-sm: 14px;
  --ev-ds-radius-md: 20px;
  --ev-ds-radius-lg: 28px;
  --ev-ds-radius-pill: 999px;
  --ev-ds-shadow-xs: 0 2px 8px hsl(var(--ev-ds-color-text) / 0.04);
  --ev-ds-shadow-sm: 0 4px 16px hsl(var(--ev-ds-color-text) / 0.06);
  --ev-ds-shadow-md: 0 12px 32px hsl(var(--ev-ds-color-text) / 0.08);
  --ev-ds-shadow-lg: 0 24px 56px hsl(var(--ev-ds-color-text) / 0.1);
  --ev-ds-shadow-xl: 0 40px 80px hsl(var(--ev-ds-color-text) / 0.12);
  --ev-ds-shadow-button: 0 4px 14px hsl(var(--ev-ds-color-text) / 0.12),
    0 2px 6px hsl(var(--ev-ds-color-text) / 0.08);
  --ev-ds-shadow-button-hover: 0 8px 24px hsl(var(--ev-ds-color-text) / 0.16),
    0 4px 10px hsl(var(--ev-ds-color-text) / 0.1);
  --ev-ds-motion-ease: cubic-bezier(0.32, 0.72, 0, 1);
  --ev-ds-motion-fast: 0.18s;
  --ev-ds-motion-base: 0.3s;
  --ev-ds-motion-slow: 0.42s;
}
```

Create `tokens.ts` exporting the exact grouped names used by tests and the audit.

- [ ] **Step 4: Add audit command and wire scripts**

Audit `src/design-system`, `src/prototypes`, and `prototypes` only. Allow raw values in `tokens.css`; reject visual literals elsewhere. Add:

```json
"check:design-system": "node scripts/check-design-system.mjs"
```

Update `gate` to run `check:design-system` after `check:repository`. Import `./design-system/tokens.css` at the top of `src/index.css`; do not rewrite existing approved selectors.

- [ ] **Step 5: Run focused checks**

Run: `npx vitest run tests/design-system-contract.test.ts && npm run check:design-system && npm run gate`

Expected: PASS; audit reports no violations.

- [ ] **Step 6: Commit**

Run: `git add src/design-system scripts/check-design-system.mjs tests/design-system-contract.test.ts package.json src/index.css && git commit -m "feat: add canonical design-system tokens"`

### Task 3: Add typed route registry and mock-data contract

**Files:**
- Create: `src/prototypes/routes.ts`
- Create: `src/prototypes/data/types.ts`
- Create: `src/prototypes/data/fixtures.ts`
- Create: `tests/prototype-contracts.test.ts`

**Interfaces:**
- Produces: `prototypeRoutes`, `findPrototypeRoute(pathname)`, `ProductOptionGroup`, `ProductOptionValue`, `ProductVariant`, `ProductMedia`, `Product360Asset`, `Product`, `Category`.

- [ ] **Step 1: Write failing contract tests**

```ts
import { describe, expect, test } from 'vitest';
import { findPrototypeRoute, prototypeRoutes } from '../src/prototypes/routes';
import { mockCategories, mockProducts } from '../src/prototypes/data/fixtures';

test('route registry contains approved storefront and admin inventory', () => {
  expect(prototypeRoutes.map((route) => route.path)).toContain('/catalog');
  expect(prototypeRoutes.map((route) => route.path)).toContain('/admin');
  expect(prototypeRoutes.map((route) => route.path)).not.toContain('/demo-admin');
  expect(findPrototypeRoute('/demo-admin')).toBeUndefined();
});

test('fixtures satisfy furniture domain contract', () => {
  expect(mockCategories.length).toBeGreaterThan(0);
  expect(mockProducts[0].variants[0]).toMatchObject({
    id: expect.any(String),
    sku: expect.any(String),
    price: expect.any(Number),
    stock: expect.any(Number),
  });
  expect(mockProducts[0].media[0].src).toMatch(/^\/assets\//);
});
```

- [ ] **Step 2: Run test and verify expected failure**

Run: `npx vitest run tests/prototype-contracts.test.ts`

Expected: FAIL because registry, types, and fixtures are absent.

- [ ] **Step 3: Implement route registry**

Use exact route patterns from master plan. `findPrototypeRoute` accepts a pathname, strips a trailing slash except root, matches exact routes and `/product/[slug]`/`/orders/[number]` patterns, returns `undefined` for unapproved paths.

- [ ] **Step 4: Implement domain types and fixtures**

Use immutable readonly arrays. Product variant stores `variantId`-ready identity, SKU, price, stock, option values, and media. Product 360 stores WebM source, poster, and metadata. Use existing local `/assets/...` paths only.

- [ ] **Step 5: Run focused tests and typecheck**

Run: `npx vitest run tests/prototype-contracts.test.ts && npm run typecheck`

Expected: PASS.

- [ ] **Step 6: Commit**

Run: `git add src/prototypes/routes.ts src/prototypes/data tests/prototype-contracts.test.ts && git commit -m "feat: add prototype route and data contracts"`

### Task 4: Build shared shell and UI primitives

**Files:**
- Create: `src/prototypes/ui/Button.tsx`, `src/prototypes/ui/Badge.tsx`, `src/prototypes/ui/Card.tsx`, `src/prototypes/ui/TextField.tsx`, `src/prototypes/ui/StatusMessage.tsx`
- Create: `src/prototypes/ui/primitives.css`
- Create: `src/prototypes/layout/PrototypeShell.tsx`, `src/prototypes/layout/PrototypeHeader.tsx`, `src/prototypes/layout/PrototypeFooter.tsx`, `src/prototypes/layout/layout.css`
- Create: `tests/prototype-components.test.ts`

**Interfaces:**
- `Button({ variant, size, loading, disabled, children, ...buttonProps })`
- `Badge({ tone, children })`
- `Card({ as, children, ...rest })`
- `TextField({ label, error, helperText, id, ...inputProps })`
- `StatusMessage({ kind, title, description, action })`
- `PrototypeShell({ children, activePath })`

- [ ] **Step 1: Write failing server-render tests**

```ts
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { Button } from '../src/prototypes/ui/Button';
import { TextField } from '../src/prototypes/ui/TextField';

test('loading button exposes disabled state and accessible label', () => {
  const html = renderToStaticMarkup(
    <Button loading aria-label="Add to cart">
      Add to cart
    </Button>,
  );
  expect(html).toContain('disabled');
  expect(html).toContain('aria-busy="true"');
  expect(html).toContain('Add to cart');
});

test('text field connects label, helper, and error semantics', () => {
  const html = renderToStaticMarkup(
    <TextField id="email" label="Email" error="Enter a valid email" />,
  );
  expect(html).toContain('for="email"');
  expect(html).toContain('aria-invalid="true"');
  expect(html).toContain('aria-describedby="email-error"');
  expect(html).toContain('id="email-error"');
});
```

- [ ] **Step 2: Run test and verify expected failure**

Run: `npx vitest run tests/prototype-components.test.ts`

Expected: FAIL because primitives are absent.

- [ ] **Step 3: Implement semantic primitives**

Use native elements. `Button` supports `primary`, `dark`, `outline`, `ghost`, `accent`, `warm`, and `danger`; `small`, `medium`, and `large`; loading preserves child label and sets `aria-busy`. `TextField` generates deterministic helper/error IDs. `StatusMessage` uses `role="status"` for loading/success and `role="alert"` for errors.

- [ ] **Step 4: Add token-only primitive CSS**

All visual declarations use `--ev-ds-*`. Add `:focus-visible` ring, disabled state, reduced-motion media rule, pill/button/input/card radii, and documented token shadows. No raw color, radius, shadow, font, or duration literals outside `tokens.css`.

- [ ] **Step 5: Implement shell**

`PrototypeHeader` renders a semantic `<header>` with `<nav>`, approved storefront links, active state, and mobile-safe wrapping/overflow. `PrototypeFooter` renders `<footer>` with approved content groups. `PrototypeShell` composes header/main/footer and accepts page content without changing existing P0 components.

- [ ] **Step 6: Run focused tests and audit**

Run: `npx vitest run tests/prototype-components.test.ts && npm run check:design-system && npm run typecheck`

Expected: PASS.

- [ ] **Step 7: Commit**

Run: `git add src/prototypes/ui src/prototypes/layout tests/prototype-components.test.ts && git commit -m "feat: add reusable prototype shell and primitives"`

### Task 5: Integrate phase gates and verify P0 preservation

**Files:**
- Modify: `tests/application-contract.test.ts` only if route registry integration needs a non-visual assertion.
- Modify: `e2e/approved-routes.spec.ts` only if a new preservation assertion is required.
- Modify: `.github/workflows/quality.yml` only if the new `gate` command requires workflow wiring.

**Interfaces:**
- Consumes: all P1 contracts and components.
- Produces: green phase gate and preservation evidence.

- [ ] **Step 1: Add failing preservation test only for discovered regression**

Run existing P0 focused tests first. Add no snapshot baselines. If route selection or landmarks change, add the smallest assertion that reproduces the regression before changing code.

- [ ] **Step 2: Run full gate**

Run: `npm run gate`

Expected: format-check, repository audit, design-system audit, lint, typecheck, and Vitest all pass.

- [ ] **Step 3: Run full browser gate**

Run: `npm run gate:full`

Expected: Vite build passes; Chromium passes `/` and `/product` at 390x844, 820x1180, and 1440x900 with no console errors or horizontal overflow.

- [ ] **Step 4: Inspect public tree**

Run: `git status --short --branch; git diff --check; rg -n "demo-admin|prototypes-furni|design-system\.html|C:\\\\Users|D:\\\\Projects" src prototypes scripts tests docs`

Expected: only intentional neutral docs references remain; no public capture, prompt, source-map, absolute-path, or forbidden-route artifact is added.

- [ ] **Step 5: Commit final verification changes**

Run: `git add tests e2e .github/workflows/quality.yml && git commit -m "test: verify P1 foundation gates"` only if Step 1 or workflow wiring changed files.

- [ ] **Step 6: Independent review and phase handoff**

Run the independent spec/code review against the branch range from P0 commit `ff54c52`. Fix Critical and Important findings, re-run `npm run gate:full`, then prepare PR sections `Summary`, `User-visible changes`, `Validation`, and `Risks/Follow-ups`. Request user visual approval before P2.

