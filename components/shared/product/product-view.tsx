import type { ResolvedProductSelection } from '@/lib/product-selection';
import { Breadcrumbs } from './breadcrumbs';
import { ProductMediaStage } from './product-media-stage';
import { PurchasePanel } from './purchase-panel';

export interface ProductViewProps {
  product: {
    name: string;
    slug: string;
    description: string | null;
    specs: Record<string, string> | null;
    category: { name: string; slug: string };
  };
  selection: ResolvedProductSelection;
}

export function ProductView({ product, selection }: ProductViewProps): React.JSX.Element {
  return (
    <>
      <div className="mt-[26px]">
        <Breadcrumbs
          items={[
            { label: 'Главная', href: '/' },
            { label: 'Каталог', href: '/catalog' },
            { label: product.category.name, href: `/catalog?category=${product.category.slug}` },
            { label: product.name },
          ]}
        />
      </div>

      <div className="mt-5 grid min-w-0 grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)] lg:gap-8">
        <div className="min-w-0">
          <ProductMediaStage images={selection.images} turntable={selection.turntable} />
        </div>
        <PurchasePanel
          productSlug={product.slug}
          productName={product.name}
          categoryName={product.category.name}
          description={product.description}
          specs={product.specs}
          selection={selection}
        />
      </div>
    </>
  );
}
