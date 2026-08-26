import type { DemoOrderStatus } from '@/lib/demo-admin/types';

const STATUS_LABELS: Record<DemoOrderStatus, string> = {
  PENDING: 'Новый',
  PROCESSING: 'В работе',
  SHIPPED: 'В доставке',
  DELIVERED: 'Доставлен',
  CANCELLED: 'Отменён',
};

export function DemoStatus({ status }: { status: DemoOrderStatus }) {
  return <span className={'demo-admin-status is-' + status.toLowerCase()}>{STATUS_LABELS[status]}</span>;
}
