# Extractable components

## AdminShell

- Source: `components/admin/admin-shell.tsx`
- Category: layout
- Description: protected labelled Evironn sidebar and top utility header.
- Extractable props: `activeItem`, `userName`, `userRole`.
- Hardcoded: exact Evironn logo asset, Russian navigation labels, Material Symbol language, core shell geometry.

## CatalogTabs

- Source: `app/(admin)/admin/catalog/_components/catalog-tabs.tsx`
- Category: layout
- Description: catalog destination tabs.
- Extractable props: `activeTab`.
- Hardcoded: five labels and paths from `ADMIN_CATALOG_TABS`.

## AdminPageHeader

- Source: `components/admin/admin-page-header.tsx`
- Category: basic
- Description: section kicker, title, subtitle, and actions.
- Extractable props: `kicker`, `title`, `subtitle`, `action`.

## AdminPanel

- Source: `components/admin/admin-panel.tsx`
- Category: basic
- Description: titled operational surface with note and header actions.
- Extractable props: `title`, `note`, `actions`.

## Button, Input, Select, status badge, table

- Sources: `components/admin/ui/*.tsx`.
- Category: basic.
- Description: existing controls must keep the current Evironn tokens and accessibility patterns.
- Extractable props: ordinary labels, selected state, disabled state, status tone.
