# Key page dependency trees

## `/admin/catalog/products`

Entry: `app/(admin)/admin/catalog/products/page.tsx`

Dependencies:

- `app/(admin)/layout.tsx`
  - `lib/admin/require-admin.ts`
  - `components/admin/admin-shell.tsx`
  - `components/admin/admin-shell.module.css`
  - `components/admin/admin-mobile-menu.tsx`
  - `components/admin/icon.tsx`
  - `lib/admin/nav.ts`
- `app/(admin)/admin/catalog/layout.tsx`
  - `app/(admin)/admin/catalog/_components/catalog-tabs.tsx`
  - `lib/admin/nav.ts`
- `app/(admin)/admin/catalog/products/page.tsx`
  - `components/admin/admin-kpi-card.tsx`
  - `components/admin/admin-page-header.tsx`
  - `components/admin/admin-panel.tsx`
  - `components/admin/ui/button.tsx`
  - `components/admin/icon.tsx`
  - `app/(admin)/admin/catalog/products/_components/product-filters.tsx`
    - `components/admin/ui/input.tsx`
    - `components/admin/ui/select.tsx`
  - `app/(admin)/admin/catalog/products/_components/product-table.tsx`
    - `components/admin/ui/dropdown-menu.tsx`
    - `components/admin/ui/dialog.tsx`
    - `components/admin/ui/alert-modal.tsx`
  - `app/(admin)/admin/catalog/products/_components/view-toggle.tsx`
  - `lib/admin/catalog.ts`
  - `lib/format.ts`

## `/admin`

Entry: `app/(admin)/admin/page.tsx`

Uses the same protected shell and current screenshot-first dashboard reference view. It is the authoritative style anchor for this catalogue exploration.

## Other sibling route families

- `/admin/catalog/categories`, `/options`, `/rooms`, `/stock`: same catalog tabs and operational table/form vocabulary.
- `/admin/orders`: order filters, table, detail and status actions.
- `/admin/customers`: filters, table, customer detail and role action.
- `/admin/marketing`: coupon filters, table and form.
