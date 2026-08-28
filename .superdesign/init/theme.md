# Theme

## Compact token summary

- Framework styling: Tailwind CSS 3 + CSS variables + CSS Modules.
- Fonts: `Golos Text` for Evironn display and body (`--ev-font-display`, `--ev-font-body`).
- Page background: `--ev-bg: hsl(40 20% 97%)`; surfaces: white / `hsl(40 14% 94%)`.
- Ink: `hsl(30 6% 18%)`; muted ink: `hsl(30 4% 50%)`.
- Primary operational accent: `--ev-accent: hsl(150 8% 30%)`; success `hsl(145 25% 40%)`; warning `hsl(38 80% 48%)`; danger `hsl(4 68% 50%)`; info `hsl(205 65% 45%)`.
- Borders: subtle `hsl(30 6% 91%)`; strong `hsl(30 6% 84%)`.
- Radii: 14 px, 20 px, 28 px, and 999 px pills.
- Shadows: soft but restrained; `0 2px 8px hsl(var(--ev-text) / .04)` through `0 12px 32px hsl(var(--ev-text) / .08)`.
- Admin surfaces mirror Evironn tokens through `--admin-*`; page-level cards use warm white, thin borders, 20–28 px radii and quiet shadows.
- Responsive breakpoint: shell collapses around 820 px; product table changes to cards below the `md` breakpoint.

## Raw token source

`styles/evironn/tokens.css` defines the Evironn token contract and font faces. `app/globals.css` maps those values into `.admin-root` as `--admin-bg`, `--admin-surface`, `--admin-primary`, `--admin-outline-variant`, `--admin-radius-*`, and `--admin-shadow-*`.

Tailwind extends semantic colors (`admin.*`), `font-admin-head/body`, and 12/16 px named border radii in `tailwind.config.ts`. The design must use these existing tokens only.
