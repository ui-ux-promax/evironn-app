import { prisma } from '@/lib/prisma-client';
import { productCardInclude, buildProductCardData, type ProductCardData } from '@/lib/product-summary';
import { NEW_PRODUCT_WINDOW_DAYS, LOW_STOCK_THRESHOLD } from '@/constants/config';
import { CartRelatedGrid } from './cart-related-grid';

export async function CartRelated() {
  const now = new Date();
  const raw = await prisma.product.findMany({
    where: { active: true },
    take: 4,
    orderBy: { createdAt: 'desc' },
    include: productCardInclude,
  });
  const items = raw.map((p) =>
    buildProductCardData(p, now, { newWindowDays: NEW_PRODUCT_WINDOW_DAYS, lowStock: LOW_STOCK_THRESHOLD }),
  );
  return <CartRelatedGrid items={items} />;
}
