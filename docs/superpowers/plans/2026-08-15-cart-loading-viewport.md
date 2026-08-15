# Cart Loading Viewport Reservation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the shared cart footer below the first viewport while `app/(shop)/cart/loading.tsx` renders its skeleton.

**Architecture:** Add one scoped `cart-loading` class to the cart route loading wrapper. Define its minimum height in a dedicated global stylesheet imported by the root layout, using `100svh` with `100dvh` as the dynamic viewport override; leave the ready cart, shop layout, and footer untouched. Extend the existing cart source-contract test to protect the loading class, CSS import, and viewport-height declarations.

**Tech Stack:** Next.js App Router, React/TypeScript, global CSS, Vitest source-contract tests, Prettier.

## Global Constraints

- Keep the footer rendered in normal document flow; do not add loading-specific footer visibility or position logic.
- Limit implementation to the cart route loading fallback and its scoped stylesheet.
- Preserve existing skeleton elements, spacing, and `aria-hidden` behavior.
- Do not mix in a Preview loading or performance rewrite.
- Use focused tests and formatting checks only for this small visual fix.

---

### Task 1: Reserve the cart loading viewport

**Files:**
- Modify: `app/(shop)/cart/loading.tsx`
- Create: `styles/evironn/CartLoading.css`
- Modify: `app/layout.tsx`
- Modify: `tests/evironn-cart-source-contract.test.ts`

**Interfaces:**
- Consumes: the existing cart loading wrapper and the root layout's global stylesheet imports.
- Produces: a `cart-loading` class contract with a minimum height of `100svh` and a dynamic `100dvh` override.

- [ ] **Step 1: Write the failing source-contract test**

Add this test to `tests/evironn-cart-source-contract.test.ts`:

```ts
it('keeps the cart loading skeleton above the shared footer', () => {
  const loading = readFileSync('app/(shop)/cart/loading.tsx', 'utf8');
  const layout = readFileSync('app/layout.tsx', 'utf8');
  const css = readFileSync('styles/evironn/CartLoading.css', 'utf8');

  expect(loading).toContain('className="cart-loading mx-auto max-w-[1240px]');
  expect(loading).toContain('aria-hidden');
  expect(layout).toContain("import '../styles/evironn/CartLoading.css';");
  expect(css).toMatch(/\.cart-loading\s*\{[\s\S]*min-height:\s*100svh;[\s\S]*min-height:\s*100dvh;[\s\S]*\}/);
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```bash
npx vitest run tests/evironn-cart-source-contract.test.ts
```

Expected: the existing cart source-contract tests pass, and the new loading test fails because the loading wrapper, stylesheet, and import do not exist yet.

- [ ] **Step 3: Add the scoped loading class and stylesheet**

Update the opening wrapper in `app/(shop)/cart/loading.tsx` by adding `cart-loading` before the existing utility classes. Keep the rest of the component exactly as it is:

```tsx
<div className="cart-loading mx-auto max-w-[1240px] px-4 sm:px-6 pt-8 pb-16" aria-hidden>
```

Create `styles/evironn/CartLoading.css` with:

```css
.cart-loading {
  min-height: 100svh;
  min-height: 100dvh;
}
```

Import the stylesheet in `app/layout.tsx` alongside the other Evironn styles:

```ts
import '../styles/evironn/CartLoading.css';
```

The header is fixed, so the loading wrapper must reserve the full viewport rather than subtracting a header height. `100svh` supplies the stable fallback; the later `100dvh` declaration follows browsers whose dynamic viewport tracks mobile browser UI.

- [ ] **Step 4: Run focused tests to verify the implementation passes**

Run:

```bash
npx vitest run tests/evironn-cart-source-contract.test.ts
```

Expected: all tests in the file pass with exit code 0.

- [ ] **Step 5: Run formatting and diff checks**

Run:

```bash
npx prettier --check "app/(shop)/cart/loading.tsx" "app/layout.tsx" "styles/evironn/CartLoading.css" "tests/evironn-cart-source-contract.test.ts"
git diff --check
```

Expected: Prettier reports that all four files use the required style, and `git diff --check` produces no output.

- [ ] **Step 6: Review the final diff and commit**

Run:

```bash
git diff -- "app/(shop)/cart/loading.tsx" "app/layout.tsx" "styles/evironn/CartLoading.css" "tests/evironn-cart-source-contract.test.ts"
git status --short --branch
git add -- "app/(shop)/cart/loading.tsx" "app/layout.tsx" "styles/evironn/CartLoading.css" "tests/evironn-cart-source-contract.test.ts"
git commit -m "fix: keep cart loading footer below viewport"
```

Expected: only the four listed files are staged for this fix; the two pre-existing untracked Phase 2 plan files remain untouched.

## Self-review checklist

- The spec's context and goal are covered by the loading wrapper class and dedicated stylesheet.
- The footer remains mounted and no shared footer or shop-layout behavior changes.
- The `100svh` fallback and `100dvh` override are asserted by the focused source-contract test.
- Existing skeleton markup and accessibility attributes remain unchanged apart from the wrapper class.
- No placeholder steps or unbounded test commands are present.
