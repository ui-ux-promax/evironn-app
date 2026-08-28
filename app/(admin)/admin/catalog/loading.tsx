/** /admin/catalog — фоллбэк сегмента для redirect → /admin/catalog/products. */
import { CatalogProductsSkeleton } from './_components/catalog-products-skeleton';

export default function CatalogLoading() {
  return <CatalogProductsSkeleton />;
}
