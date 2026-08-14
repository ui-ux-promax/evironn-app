export interface CartConfigurationItemDto {
  groupSlug: string;
  groupName: string;
  valueSlug: string;
  valueName: string;
  swatchHex: string | null;
}

export interface CartLineDto {
  id: string;
  skuId?: string | null;
  productVariantId?: string | null;
  articleNumber?: string;
  productId: string;
  productName?: string;
  name: string;
  productSlug: string;
  quantity: number;
  configuration?: CartConfigurationItemDto[];
  colorwayName: string;
  size: string;
  imageUrl: string | null;
  imageAlt?: string;
  unitPrice: number;
  oldUnitPrice?: number | null;
  lineTotal: number;
  compareAtLineTotal?: number;
  stock: number;
  active?: boolean;
  available: boolean;
  disabled?: boolean;
}

export interface CartTotalsDto {
  subtotal: number;
  compareAtSubtotal: number;
  saleDiscount: number;
  couponDiscount: number;
  total: number;
  itemCount: number;
  lineCount: number;
}

export interface CartDto {
  items: CartLineDto[];
  totals: CartTotalsDto;
}

export type CartApiErrorCode =
  | 'CART_INVALID'
  | 'CART_QUANTITY_LIMIT'
  | 'CART_OWNER_REQUIRED'
  | 'CART_SKU_NOT_FOUND'
  | 'CART_ITEM_NOT_FOUND'
  | 'CART_UNAVAILABLE'
  | 'CART_OUT_OF_STOCK'
  | 'CART_CONFLICT'
  | 'CART_INTERNAL';

export interface CartApiError {
  code: CartApiErrorCode;
  message: string;
  issues?: unknown;
}

export const EMPTY_CART_DTO: CartDto = {
  items: [],
  totals: {
    subtotal: 0,
    compareAtSubtotal: 0,
    saleDiscount: 0,
    couponDiscount: 0,
    total: 0,
    itemCount: 0,
    lineCount: 0,
  },
};
