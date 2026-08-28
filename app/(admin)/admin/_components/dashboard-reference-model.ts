export type DashboardReferenceTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export type DashboardReferenceKpi = {
  id: string;
  icon: string;
  label: string;
  value: string;
  trend?: string | null;
};

export type DashboardReferenceFunnelStage = {
  id: string;
  icon: string;
  label: string;
  value: string;
};

export type DashboardReferenceInventoryItem = {
  id: string;
  name: string;
  imageUrl: string | null;
  availability: string;
  stock: string;
  href: string;
};

export type DashboardReferenceCategory = {
  id: string;
  name: string;
  icon: string;
  share: number;
};

export type DashboardReferenceStatus = {
  label: string;
  tone: DashboardReferenceTone;
};

export type DashboardReferenceOrder = {
  id: string;
  href: string;
  number: string;
  date: string;
  customer: string;
  email?: string | null;
  products: { name: string; imageUrl: string | null }[];
  overflowCount: number;
  itemCount?: number;
  total: string;
  orderStatus: DashboardReferenceStatus;
  paymentStatus: DashboardReferenceStatus;
  fulfillmentStatus: DashboardReferenceStatus;
};

export type DashboardReferenceModel = {
  period: 7 | 30 | 90;
  revenue: { label: string; value: string; trend?: string | null };
  kpis: DashboardReferenceKpi[];
  revenueSeries: { label: string; value: number }[];
  funnel: {
    stages: DashboardReferenceFunnelStage[];
    footerLabel: string;
    footerValue: string;
    footerTrend?: string | null;
  };
  inventory: DashboardReferenceInventoryItem[];
  categories: DashboardReferenceCategory[];
  categoryOther?: { label: string; share: number } | null;
  orders: DashboardReferenceOrder[];
};
