# Superdesign Catalog Exploration

**Status:** User-approved design exploration on 2026-08-27.
**Target:** Protected desktop route `/admin/catalog/products`.

## Intent

Create one freely composed catalog-products design draft in Superdesign. The draft is a visual decision artifact only: it must not alter the current Next.js route, server data, Prisma queries, actions, authorization, or catalog behavior.

The existing catalog product-list reference image is intentionally excluded. The exploration derives its visual language from the accepted Evironn admin dashboard and the current protected application design system, while remaining free to choose a new catalog composition.

## Visual constraints

- Use the approved Evironn admin identity: real Evironn logo, Golos Text, Russian UI copy, warm off-white background, white surfaces, near-black text, and restrained forest-green emphasis.
- Reuse the accepted desktop shell: labelled sidebar and top utility bar.
- Do not introduce a new font, purple/blue SaaS palette, glassmorphism, neon, decorative gradients, invented logo, or unrelated icon set.
- Design for a dense operational desktop workspace at the accepted admin desktop scale.

## Required product-list information

The composition must expose existing catalog functionality without inventing a backend:

1. Page heading and primary `Добавить товар` action.
2. Catalog navigation for `Товары`, `Категории`, `Опции`, `Комнаты`, and `Остатки`.
3. Search, category/availability filters, sorting, and pagination.
4. Product image, name, category, variant/SKU count, article, price, stock, status, and row actions.
5. Honest Russian furniture data and ruble formatting.

The model may choose table, hybrid table/card, or another operational composition, provided all required information remains immediately scannable and accessible.

## Superdesign workflow

1. Initialize design context from `D:\Projects\evironn` and reuse real shell, token, icon, and catalog source context.
2. Create one private baseline reproduction of the current `/admin/catalog/products` UI, as required for an existing rendered target.
3. From that baseline, create one branch-mode design draft using only the Evironn dashboard/design-system direction. Do not upload or reference `07-catalog-products-reference.png`.
4. Surface the canvas and preview URLs for user visual review. No implementation begins until a design direction is selected.

## Non-goals

- No responsive/mobile catalog exploration in this round.
- No product editor, categories, options, rooms, stock, orders, customers, or promo-code screens.
- No code replacement, test run, commit, push, pull request, or deployment.
