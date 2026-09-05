# Catalog Empty-State Spacing

**Status:** User-approved design on 2026-09-05.
**Target:** Storefront catalog empty state at `/catalog`.

## Goal

Give the empty-result panel the same vertical separation from the filter/chip controls as the populated product grid.

## Design

- Add the existing catalog rhythm of `1.4rem` above `.cat-empty`.
- Apply it only when the catalog renders no products.
- Keep the filter bar, selected chips, pagination, card grid, typography, and empty-state content unchanged.
- Preserve responsive behavior because the value is already used by `.cat-b__grid` across the same layout.

## Verification

- Add a regression assertion that the empty-state style preserves the shared `1.4rem` top gap.
- Run the focused catalog test and formatting/lint checks for touched files.

## Non-goals

- No catalog data, filtering, URL, or navigation changes.
- No visual redesign or changes to the populated product-grid spacing.
