import type { OrderStatus } from '@prisma/client';
import type { CatalogBCard } from '@/components/evironn/catalog/catalog-variant-b-adapter';

export type ProfileSection = 'overview' | 'orders' | 'favorites' | 'profile' | 'addresses';

export interface ProfileAddressDto {
  id: string;
  label: string;
  city: string;
  street: string;
  comment: string | null;
  isDefault: boolean;
}

export interface ProfileOrderLineDto {
  id: string;
  name: string;
  configuration: string;
  imageUrl: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface ProfileOrderDto {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  createdAt: string;
  shippingMethod: string;
  paymentMethod: string;
  city: string;
  addressLine: string;
  deliveryDate?: string | null;
  deliveryWindow?: string | null;
  itemsTotal: number;
  discountAmount: number;
  shippingAmount: number;
  totalAmount: number;
  items: ProfileOrderLineDto[];
}

export interface ProfilePageDto {
  user: {
    name: string;
    email: string;
    phone: string;
    birthdate: string;
    createdAt: string;
    initials: string;
  };
  stats: { orders: number; favorites: number; addresses: number };
  loyalty?: { balance: number; nextLevel: number };
  orders: ProfileOrderDto[];
  favorites: CatalogBCard[];
  addresses: ProfileAddressDto[];
}
