# Admin Dashboard Loading Skeleton Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic `/admin` loading placeholder with a skeleton whose silhouettes match the accepted live dashboard at desktop and mobile widths.

**Architecture:** Keep the existing `DashboardSkeleton` public API and `/admin/loading.tsx` boundary. Rebuild only the dashboard skeleton body with the same five panel regions and responsive grid as `DashboardReferenceView`, using the existing server-side `Skeleton` primitive and structural `data-skeleton` markers for focused tests.

**Tech Stack:** Next.js 15, React 18 server components, Tailwind utility classes, Vitest, React server rendering, Prettier.

## Global Constraints

- Keep `role="status"`, `aria-busy="true"`, and the loading label.
- Do not render live names, values, IDs, images, links, fixture data, reads, mutations, or new controls.
- Keep `app/(admin)/admin/loading.tsx`, dashboard data adapters, live dashboard components, shared shell, DTOs, actions, APIs, and providers unchanged.
- Preserve desktop two-column layout, full-width orders row, and mobile single-column panel order.
- Run only focused dashboard loading/render tests, touched-file Prettier, and `git diff --check`.
- Do not commit, run the full gate, build, complete Vitest suite, E2E, or reviewer workflow.

---

### Task 1: Add the failing dashboard loading contract

**Files:**

- Create: `tests/admin-dashboard-loading.test.ts`
- Read-only reference: `app/(admin)/admin/_components/dashboard-reference-view.tsx`
- Read-only reference: `app/(admin)/admin/_components/dashboard-reference-view.module.css`
- Read-only reference: `app/(admin)/admin/loading.tsx`

**Interfaces:**

- Consumes: exported `DashboardLoading` and `DashboardSkeleton` components.
- Produces: focused structural contract for the loading boundary.

- [ ] **Step 1: Write the failing test**

Create a server-rendered test using the existing catalog-loading pattern:

```tsx
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import DashboardLoading from '@/app/(admin)/admin/loading';

describe('admin dashboard loading state', () => {
  it('mirrors the live dashboard panel silhouettes', () => {
    const markup = renderToStaticMarkup(createElement(DashboardLoading));

    expect(markup).toContain('role="status"');
    expect(markup).toContain('aria-busy="true"');
    expect(markup).toContain('aria-label="Загрузка…"');
    expect(markup).toContain('data-skeleton="dashboard-sales"');
    expect(markup).toContain('data-skeleton="dashboard-funnel"');
    expect(markup).toContain('data-skeleton="dashboard-inventory"');
    expect(markup).toContain('data-skeleton="dashboard-categories"');
    expect(markup).toContain('data-skeleton="dashboard-orders"');
    expect(markup.match(/data-skeleton="dashboard-kpi"/g)).toHaveLength(3);
    expect(markup.match(/data-skeleton="dashboard-funnel-stage"/g)).toHaveLength(5);
    expect(markup.match(/data-skeleton="dashboard-inventory-card"/g)).toHaveLength(4);
    expect(markup.match(/data-skeleton="dashboard-category"/g)).toHaveLength(4);
    expect(markup.match(/data-skeleton="dashboard-order-row"/g)).toHaveLength(4);
  });

  it('does not carry the retired dashboard layout contract', () => {
    const markup = renderToStaticMarkup(createElement(DashboardLoading));

    expect(markup).not.toContain('5 KPI');
    expect(markup).not.toContain('Топ продаж');
    expect(markup).not.toContain('Низкий сток');
    expect(markup).not.toContain('Покрытие 360°');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- tests/admin-dashboard-loading.test.ts
```

Expected: the test fails because the current generic skeleton has no `dashboard-sales` region and still contains the retired dashboard copy.

### Task 2: Replace the generic skeleton body

**Files:**

- Modify: `components/admin/skeleton/dashboard-skeleton.tsx`

**Interfaces:**

- Consumes: `Skeleton` from `./skeleton`.
- Produces: unchanged `DashboardSkeleton()` export and a `DashboardBody()` with five structural regions.

- [ ] **Step 1: Implement the minimal approved structure**

Replace the current old dashboard body with these layout rules:

- Root body: `space-y-3.5`, no page title or data copy.
- Main grid: `grid grid-cols-1 gap-3.5 xl:grid-cols-[minmax(0,1.76fr)_minmax(400px,1fr)]`.
- Sales panel: `data-skeleton="dashboard-sales"`, `min-h-[406px]`, header, revenue silhouette, exactly three KPI silhouettes, chart silhouette.
- Funnel panel: `data-skeleton="dashboard-funnel"`, `min-h-[406px]`, exactly five narrowing stage silhouettes and footer silhouette.
- Inventory and categories panels: each `min-h-[212px]`, four item silhouettes matching the live card/ring grids.
- Orders panel: `data-skeleton="dashboard-orders"`, full width, header, table header, exactly four rows, and a bounded mobile `overflow-x-auto` wrapper.
- Add `data-skeleton` markers to every repeated child so the test asserts structure rather than styling implementation.
- Add `max-w-full` and `min-w-0` where needed; do not use any viewport-width values that could create document overflow.
- Keep the existing `DashboardSkeleton` status wrapper unchanged.

- [ ] **Step 2: Run focused test to verify it passes**

Run:

```bash
npm test -- tests/admin-dashboard-loading.test.ts tests/admin-dashboard-render.test.ts
```

Expected: all dashboard loading and render tests pass.

### Task 3: Verify formatting and source boundaries

**Files:**

- Modify: `.superpowers/sdd/progress.md`

- [ ] **Step 1: Run touched-file formatting and diff checks**

Run:

```bash
npx prettier --check -- components/admin/skeleton/dashboard-skeleton.tsx tests/admin-dashboard-loading.test.ts
git diff --check
```

Expected: Prettier reports all files matched and `git diff --check` reports no whitespace errors.

- [ ] **Step 2: Update the durable progress record**

Append a technical-English entry naming the modified skeleton/test files, the five-region mapping to `DashboardReferenceView`, focused test result, formatting/diff checks, and the explicit no-data/no-overflow constraints. Do not claim visual acceptance or add screenshot paths unless a browser capture was actually made.

- [ ] **Step 3: Re-run the focused checks after the progress update**

Run:

```bash
npm test -- tests/admin-dashboard-loading.test.ts tests/admin-dashboard-render.test.ts
npx prettier --check -- components/admin/skeleton/dashboard-skeleton.tsx tests/admin-dashboard-loading.test.ts .superpowers/sdd/progress.md
git diff --check
```

Expected: all focused tests and checks pass; no full gate, build, complete Vitest suite, E2E, reviewer, or commit operation is performed.
