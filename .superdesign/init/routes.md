# Route map

Framework: Next.js 15 App Router. Protected admin routes are wrapped by `app/(admin)/layout.tsx` and require the ADMIN role before rendering.

## Primary protected admin routes

| URL                         | Entry                                           | Shared layout                  |
| --------------------------- | ----------------------------------------------- | ------------------------------ |
| `/admin`                    | `app/(admin)/admin/page.tsx`                    | protected admin shell          |
| `/admin/catalog/products`   | `app/(admin)/admin/catalog/products/page.tsx`   | protected shell + catalog tabs |
| `/admin/catalog/categories` | `app/(admin)/admin/catalog/categories/page.tsx` | protected shell + catalog tabs |
| `/admin/catalog/options`    | `app/(admin)/admin/catalog/options/page.tsx`    | protected shell + catalog tabs |
| `/admin/catalog/rooms`      | `app/(admin)/admin/catalog/rooms/page.tsx`      | protected shell + catalog tabs |
| `/admin/catalog/stock`      | `app/(admin)/admin/catalog/stock/page.tsx`      | protected shell + catalog tabs |
| `/admin/orders`             | `app/(admin)/admin/orders/page.tsx`             | protected admin shell          |
| `/admin/customers`          | `app/(admin)/admin/customers/page.tsx`          | protected admin shell          |
| `/admin/marketing`          | `app/(admin)/admin/marketing/page.tsx`          | protected admin shell          |

## Design target

`/admin/catalog/products` is an existing rendered target. It currently has a page header, view toggle, add-product action, three live KPI cards, a titled product panel, URL-backed filters, responsive list/table, row action menu, and pagination. Keep its content architecture; the exploration may redesign its desktop composition.
