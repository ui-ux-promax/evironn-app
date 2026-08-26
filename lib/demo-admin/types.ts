export type DemoOrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export type DemoKpi = { id: string; label: string; value: string; detail: string };
export type DemoRevenuePoint = { label: string; value: number };
export type DemoStatusSlice = { status: DemoOrderStatus; label: string; value: number };
export type DemoTurntableState = 'ready' | 'partial' | 'none';

export type DemoCatalogProduct = {
  id: string;
  name: string;
  category: string;
  rooms: readonly string[];
  skuCount: number;
  priceFrom: number;
  totalStock: number;
  mediaCount: number;
  turntable: DemoTurntableState;
};

export type DemoOptionGroupRow = {
  id: string;
  name: string;
  values: readonly { id: string; label: string }[];
  usedByProducts: number;
};

export type DemoSkuStockRow = {
  id: string;
  productId: string;
  articleNumber: string;
  combinationLabel: string;
  selections: readonly string[];
  price: number;
  oldPrice: number | null;
  stock: number;
  active: boolean;
  mediaCount: number;
  turntable: DemoTurntableState;
};

export type DemoOrderRow = {
  id: string;
  number: string;
  customerName: string;
  status: DemoOrderStatus;
  paymentLabel: string;
  totalAmount: number;
  createdLabel: string;
  lines: readonly {
    productName: string;
    articleNumber: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
};

export type DemoCustomerRow = {
  id: string;
  name: string;
  email: `${string}.invalid`;
  role: 'CUSTOMER' | 'ADMIN';
  orderCount: number;
  totalSpent: number;
  registeredLabel: string;
};

export type DemoCouponRow = {
  id: string;
  code: string;
  type: 'PERCENT';
  value: number;
  windowLabel: string;
  active: boolean;
};

export type DemoAdminFixtures = {
  dashboard: {
    kpis: readonly DemoKpi[];
    revenue: readonly DemoRevenuePoint[];
    statuses: readonly DemoStatusSlice[];
  };
  catalog: {
    products: readonly DemoCatalogProduct[];
    options: readonly DemoOptionGroupRow[];
    skus: readonly DemoSkuStockRow[];
  };
  orders: readonly DemoOrderRow[];
  customers: readonly DemoCustomerRow[];
  coupons: readonly DemoCouponRow[];
};

/** Compatibility shape for the pre-5D route composition; all values remain synthetic furniture data. */
export interface DemoAdminSnapshot {
  generatedLabel: string;
  kpis: { revenue: number; orders: number; averageOrder: number; conversion: number };
  revenueSeries: ReadonlyArray<{ label: string; revenue: number }>;
  products: ReadonlyArray<{
    id: string;
    name: string;
    sku: string;
    category: string;
    price: number;
    stock: number;
    active: boolean;
  }>;
  orders: ReadonlyArray<{
    id: string;
    number: string;
    customerId: string;
    customerName: string;
    status: DemoOrderStatus;
    totalAmount: number;
    createdLabel: string;
  }>;
  customers: ReadonlyArray<DemoCustomerRow>;
  coupons: ReadonlyArray<{ id: string; code: string; percent: number; active: boolean; expiresLabel: string }>;
}
