# Admin Dashboard Loading Skeleton Design

## Scope

Improve the loading presentation for `/admin` so its placeholder silhouettes match the currently accepted live dashboard presentation. The change is limited to the dashboard loading boundary and focused regression coverage.

## Current visual contract

The live dashboard is rendered by `DashboardReferenceView` and uses five visible regions:

1. A sales panel containing a header, period control, revenue summary, three KPI cards, and a revenue chart.
2. A five-stage order funnel with a footer summary.
3. An inventory panel with four product cards.
4. A popular-categories panel with four ring items and an optional "other" row.
5. A full-width recent-orders panel with a header and four table rows.

The skeleton must preserve the same desktop two-column arrangement, full-width orders row, panel proportions, internal spacing, and responsive single-column mobile composition. The existing admin shell remains responsible for the utility bar and navigation.

## Implementation

Replace the obsolete generic dashboard body inside `components/admin/skeleton/dashboard-skeleton.tsx` with a server-rendered structural skeleton that mirrors the five live regions. It will use the existing `Skeleton` primitive and keep `role="status"`, `aria-busy="true"`, and the loading label. It will not render live names, values, IDs, images, links, or new controls.

The route file `app/(admin)/admin/loading.tsx` remains unchanged and continues to import `DashboardSkeleton`. No dashboard data adapter, live dashboard component, shared shell, DTO, action, API, or provider code changes are in scope.

## Responsive behavior

At desktop widths, sales and funnel occupy the first grid row, inventory and categories occupy the second grid row, and recent orders spans the full width. At mobile widths, all five panels stack in the same order as the live dashboard. The chart placeholder may use the same bounded horizontal chart treatment as the live dashboard without increasing document width.

## Verification

Add focused assertions covering the loading boundary and the five structural regions, including three KPI placeholders, five funnel stages, four inventory cards, four category items, and four order rows. Follow TDD: observe the new contract fail against the current skeleton, implement the smallest replacement, then rerun the focused dashboard loading/render checks. Finish with touched-file Prettier and `git diff --check`; do not run the full gate, build, complete Vitest suite, E2E, or reviewer workflow.

## Constraints

The skeleton is decorative only. It must not copy fixture values or introduce data reads, mutations, backend behavior, or changes to the accepted dashboard presentation.
