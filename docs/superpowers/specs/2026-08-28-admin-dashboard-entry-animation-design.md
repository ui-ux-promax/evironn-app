# Admin Dashboard Entry Animation Design

## Scope

Add lightweight entrance motion to the accepted `/admin` dashboard's order funnel and revenue chart. The animation runs when the dashboard presentation mounts and does not change data, navigation, loading, or interaction behavior.

## Animation contract

- Funnel stages fade and rise into place in top-to-bottom order.
- Funnel arrows appear after their corresponding stage, followed by the conversion footer.
- The revenue curve draws from left to right with a short opacity reveal for the area fill; chart labels and grid remain stable.
- Motion is CSS-only and remains inside the existing `DashboardReferenceView` presentation boundary.
- `prefers-reduced-motion: reduce` disables transitions and animations while leaving the final visual state visible.

## Implementation

Add semantic animation classes to the existing funnel stage rows/arrows/footer and revenue chart SVG elements in `app/(admin)/admin/_components/dashboard-reference-view.tsx`. Define keyframes, stagger delays, and reduced-motion overrides in `app/(admin)/admin/_components/dashboard-reference-view.module.css`. Keep the current markup, data mapping, SVG path generation, and responsive geometry intact.

Focused tests will assert that the presentation exposes the funnel/chart animation hooks, the CSS defines the required keyframes and staggered delays, and a reduced-motion media query is present. No client component, animation library, new API, or data source is introduced.

## Verification

Follow TDD by adding the focused contract first and observing it fail against the current presentation. Then implement the smallest JSX/CSS change, rerun dashboard render tests, run touched-file Prettier, and run `git diff --check`. Do not run the full gate, build, complete Vitest suite, E2E, reviewer workflow, or commit.
