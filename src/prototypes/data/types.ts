export type ProductOptionAxis =
  'upholstery' | 'frame' | 'size' | 'configuration';
export type ProductMediaKind = 'image' | 'video';

export interface ProductOptionValue {
  readonly id: string;
  readonly value: string;
  readonly order: number;
  readonly swatch?: string;
  readonly mediaId?: string;
}

export interface ProductOptionGroup {
  readonly id: string;
  readonly productId: string;
  readonly axis: ProductOptionAxis;
  readonly label: string;
  readonly order: number;
  readonly values: readonly ProductOptionValue[];
}

export interface ProductVariantOption {
  readonly groupId: string;
  readonly valueId: string;
}

export interface ProductVariant {
  readonly id: string;
  readonly sku: string;
  readonly price: number;
  readonly stock: number;
  readonly optionValues: readonly ProductVariantOption[];
  readonly mediaId?: string;
}

export interface ProductMedia {
  readonly id: string;
  readonly kind: ProductMediaKind;
  readonly src: string;
  readonly alt: string;
  readonly order: number;
  readonly variantId?: string;
  readonly optionValueId?: string;
}

export interface Product360Asset {
  readonly id: string;
  readonly webmSrc: string;
  readonly posterSrc: string;
  readonly width: number;
  readonly height: number;
  readonly frameCount: number;
}

export interface Category {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly imageSrc: string;
  readonly showcaseProductId?: string;
}

export interface Product {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly categoryId: string;
  readonly priceFrom: number;
  readonly optionGroups: readonly ProductOptionGroup[];
  readonly variants: readonly ProductVariant[];
  readonly media: readonly ProductMedia[];
  readonly turntable?: Product360Asset;
}
