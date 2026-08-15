export interface CartConfigurationItemDto {
  groupSlug: string;
  groupLabel: string;
  valueSlug: string;
  valueLabel: string;
  swatchHex: string | null;
}

export interface CartLineDto {
  id: string;
  skuId: string;
  isLegacy?: boolean;
  productId: string;
  productSlug: string;
  name: string;
  articleNumber: string;
  configuration: CartConfigurationItemDto[];
  imageUrl: string | null;
  imageAlt: string;
  quantity: number;
  unitPrice: number;
  oldUnitPrice: number | null;
  lineTotal: number;
  oldLineTotal: number | null;
  stock: number;
  available: boolean;
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
  | 'INVALID_INPUT'
  | 'SKU_NOT_FOUND'
  | 'OUT_OF_STOCK'
  | 'QUANTITY_EXCEEDS_STOCK'
  | 'CART_ITEM_NOT_FOUND'
  | 'CART_CONFLICT';

export interface CartApiError {
  error: {
    code: CartApiErrorCode;
    message: string;
    stock?: number;
  };
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
