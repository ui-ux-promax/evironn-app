# Evironn protected admin design system

## Product context

Evironn is a Russian furniture commerce project. The protected admin is an operational workspace for furniture products, SKU variants, stock, orders, customers, and promotions. Interfaces must privilege quick scanning, clear state, and trustworthy dense data over decorative SaaS styling.

## Visual rules

- Use `Golos Text` only for display and body text.
- Background: warm off-white `hsl(40 20% 97%)`; surfaces: white and warm soft white.
- Text: warm near-black `hsl(30 6% 18%)`; muted copy `hsl(30 4% 50%)`.
- Primary: muted forest green `hsl(150 8% 30%)`; positive `hsl(145 25% 40%)`; warning amber and danger red only for actual states.
- Borders are thin and warm. Shadows are restrained and diffuse.
- Card geometry uses 20–28 px radii; controls use 14 px or pill geometry when they are filter-like.
- The desktop shell is a labelled Evironn sidebar plus a wide utility bar. Use the exact Evironn wordmark, never initials or a substitute logo.
- The utility bar is part of the document flow: it must not be sticky or fixed, and scrolls away with page content.
- UI copy is Russian; dates, order numbers, stock and rubles look operational and real.

## Shared behaviour

- Keep the existing Material Symbol icon language.
- Preserve focus-visible states, semantic tables, readable tables at desktop scale, and reduced-motion compatibility.
- Use white operational panels with one clear visual hierarchy; do not introduce gradients, neon, glassmorphism, purple/blue SaaS colors, or new typography.

## Catalog design target

The `/admin/catalog/products` exploration may freely choose its desktop composition, but must visibly include: page title, primary add action, five catalog destinations, search, category/availability filters, sorting, product image/name, category, variant or SKU quantity, article, price, stock, active/inactive state, row actions, and pagination. It must fit a dense furniture backoffice workflow without inventing analytics or product properties.
