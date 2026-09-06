# Catalog Empty-State Spacing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the storefront catalog empty-result panel the same `1.4rem` vertical gap from filters as the populated product grid.

**Architecture:** The catalog already owns its populated-grid rhythm in `catalog-variant-b.css`; the empty panel is styled separately in `catalog-primitives.css`. Add the missing margin to that semantic empty-state class and lock the value in the existing Catalog Variant B contract test.

**Tech Stack:** Next.js, React, Vitest, CSS.

## Global Constraints

- Change only the storefront empty state at `/catalog`.
- Use the existing `1.4rem` grid rhythm; do not introduce a new token or dependency.
- Do not change filtering, URLs, loading states, the filter bar, product grid, copy, or responsive breakpoints.
- Preserve the two protected untracked Phase 2 plan files.

---

## File Structure

- Modify `styles/evironn/catalog-primitives.css`: add empty-state top spacing.
- Modify `tests/evironn-catalog-variant-b.test.tsx`: assert the exact CSS contract.

### Task 1: Preserve catalog empty-state spacing

**Files:**

- Modify: `tests/evironn-catalog-variant-b.test.tsx`
- Modify: `styles/evironn/catalog-primitives.css`

**Interfaces:**

- Consumes: `.cat-b__grid` uses `margin-top: 1.4rem` in `styles/evironn/catalog-variant-b.css`.
- Produces: `.cat-empty` has `margin-top: 1.4rem` for the no-results rendering path.

- [ ] **Step 1: Write the failing regression assertion**

In `tests/evironn-catalog-variant-b.test.tsx`, extend `keeps exact shell and route contracts` immediately after the existing `css` constant:

```ts
const primitivesCss = readFileSync('styles/evironn/catalog-primitives.css', 'utf8');
expect(primitivesCss).toMatch(/\.cat-empty\s*\{[\s\S]*?margin-top:\s*1\.4rem;/);
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```powershell
npx vitest run tests/evironn-catalog-variant-b.test.tsx
```

Expected: FAIL because `.cat-empty` has no `margin-top: 1.4rem` declaration.

- [ ] **Step 3: Add the minimum CSS declaration**

In `styles/evironn/catalog-primitives.css`, add this declaration to the existing `.cat-empty` rule directly after `gap: 0.6rem;`:

```css
margin-top: 1.4rem;
```

The final start of the rule must be:

```css
.cat-empty {
  display: grid;
  justify-items: center;
  gap: 0.6rem;
  margin-top: 1.4rem;
```

- [ ] **Step 4: Run focused verification and verify GREEN**

Run:

```powershell
npx vitest run tests/evironn-catalog-variant-b.test.tsx
npx prettier --check styles/evironn/catalog-primitives.css tests/evironn-catalog-variant-b.test.tsx
npx eslint tests/evironn-catalog-variant-b.test.tsx
git diff --check
```

Expected: Vitest passes with zero failures; Prettier, ESLint, and `git diff --check` exit 0.

- [ ] **Step 5: Commit only the implementation and regression test**

Run:

```powershell
git add -- styles/evironn/catalog-primitives.css tests/evironn-catalog-variant-b.test.tsx
git commit -m "fix: space catalog empty state"
```

Expected: commit contains exactly the CSS declaration and matching test assertion; it excludes protected plans and local temporary files.

## Self-Review

- Spec coverage: Task 1 adds the requested `1.4rem` gap and checks it with a regression assertion.
- Scope: no route, data, filter, responsive, or populated-grid code is changed.
- Placeholder scan: no TODOs or unspecified implementation steps remain.
- Type consistency: no interfaces or types change.
