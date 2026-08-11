export type DemoOrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface DemoProductRow {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  active: boolean;
}

export interface DemoCustomerRow {
  id: string;
  name: string;
  email: `${string}.invalid`;
  orderCount: number;
  totalSpent: number;
  registeredLabel: string;
}

export interface DemoOrderRow {
  id: string;
  number: string;
  customerId: string;
  customerName: string;
  status: DemoOrderStatus;
  totalAmount: number;
  createdLabel: string;
}

export interface DemoCouponRow {
  id: string;
  code: string;
  percent: number;
  active: boolean;
  expiresLabel: string;
}

export interface DemoAdminSnapshot {
  generatedLabel: string;
  kpis: {
    revenue: number;
    orders: number;
    averageOrder: number;
    conversion: number;
  };
  revenueSeries: ReadonlyArray<{ label: string; revenue: number }>;
  products: ReadonlyArray<DemoProductRow>;
  orders: ReadonlyArray<DemoOrderRow>;
  customers: ReadonlyArray<DemoCustomerRow>;
  coupons: ReadonlyArray<DemoCouponRow>;
}
