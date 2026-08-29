# Admin Dashboard Entry Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a restrained CSS-only entrance animation to the live dashboard funnel and revenue chart.

**Architecture:** Keep `DashboardReferenceView` server-rendered and preserve its data/model/SVG geometry. Add semantic animation class hooks in the existing JSX and define keyframes, stagger delays, and reduced-motion overrides in the existing CSS module.

**Tech Stack:** React 18 server components, CSS Modules, SVG, Vitest, Prettier.

## Global Constraints

- Change only `app/(admin)/admin/_components/dashboard-reference-view.tsx`, its CSS module, focused dashboard tests, and `.superpowers/sdd/progress.md`.
- Do not add a client boundary, animation dependency, data read, API, action, or behavior change.
- Keep final visual state visible when `prefers-reduced-motion: reduce` is active.
- Run only focused dashboard tests, touched-file Prettier, and `git diff --check`.
- Do not run full gate, build, complete Vitest suite, E2E, reviewer workflow, or commit.

---

### Task 1: Add the failing animation contract

**Files:**

- Modify: `tests/admin-dashboard-render.test.ts`
- Read-only reference: `app/(admin)/admin/_components/dashboard-reference-view.tsx`
- Read-only reference: `app/(admin)/admin/_components/dashboard-reference-view.module.css`

- [ ] **Step 1: Write the failing assertions**

Extend the existing dashboard composition test with source and markup assertions:

```ts
const css = readFileSync('app/(admin)/admin/_components/dashboard-reference-view.module.css', 'utf8');

expect(markup).toContain('data-testid="reference-funnel-animation"');
expect(markup).toContain('data-testid="reference-chart-animation"');
expect(css).toContain('@keyframes dashboardFunnelReveal');
expect(css).toContain('@keyframes dashboardChartDraw');
expect(css).toContain('prefers-reduced-motion: reduce');
expect(css).toContain('.funnelStageAnimated');
expect(css).toContain('.chartLineAnimated');
```

- [ ] **Step 2: Run the focused test to verify RED**

Run:

```bash
npm test -- tests/admin-dashboard-render.test.ts
```

Expected: the new animation assertions fail because the current JSX/CSS has no animation hooks or keyframes.

### Task 2: Add funnel and chart entrance motion

**Files:**

- Modify: `app/(admin)/admin/_components/dashboard-reference-view.tsx`
- Modify: `app/(admin)/admin/_components/dashboard-reference-view.module.css`

- [ ] **Step 1: Add semantic JSX hooks**

Add `data-testid="reference-funnel-animation"` to the funnel list, `data-testid="reference-chart-animation"` to the chart wrapper, and animation classes to the existing funnel rows/stages/arrows/footer and chart area/path. Do not alter model mapping, SVG path generation, labels, or geometry.

- [ ] **Step 2: Add minimal CSS animation**

Define `dashboardFunnelReveal`, `dashboardFunnelArrowReveal`, `dashboardChartDraw`, and `dashboardChartAreaReveal`. Apply a short base reveal to funnel rows, use `:nth-child` delays for top-to-bottom cascade, and set the SVG path's `stroke-dasharray`/`stroke-dashoffset` from the existing path while keeping the chart visible after the animation. Animate the area opacity separately. Add `@media (prefers-reduced-motion: reduce)` overrides that set animation duration to `0s`, delay to `0s`, and final opacity/offset values.

- [ ] **Step 3: Run focused tests to verify GREEN**

Run:

```bash
npm test -- tests/admin-dashboard-render.test.ts tests/admin-dashboard-analytics.test.ts
```

Expected: all selected dashboard tests pass.

### Task 3: Record and verify the bounded change

**Files:**

- Modify: `.superpowers/sdd/progress.md`

- [ ] **Step 1: Run formatting and diff checks**

```bash
npx prettier --check -- 'app/(admin)/admin/_components/dashboard-reference-view.tsx' 'app/(admin)/admin/_components/dashboard-reference-view.module.css' 'tests/admin-dashboard-render.test.ts'
git diff --check
```

- [ ] **Step 2: Append the progress entry**

Record the animation mapping, CSS-only/reduced-motion constraints, TDD RED/GREEN result, and focused checks in normal technical English. Do not claim screenshot acceptance unless a browser capture is made.

- [ ] **Step 3: Rerun final focused checks**

```bash
npm test -- tests/admin-dashboard-render.test.ts tests/admin-dashboard-analytics.test.ts
npx prettier --check -- 'app/(admin)/admin/_components/dashboard-reference-view.tsx' 'app/(admin)/admin/_components/dashboard-reference-view.module.css' 'tests/admin-dashboard-render.test.ts' '.superpowers/sdd/progress.md'
git diff --check
```

Expected: focused tests pass, formatting matches, and no whitespace errors are reported.
