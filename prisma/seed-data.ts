import type { Gender } from '@prisma/client';
import type { ClothingSize } from '../constants/config';

// Плоские демо-данные для seed. Структура НЕ использует Prisma nested-create
// (`{ create: [...] }`), потому что Neon HTTP-адаптер исторически требовал плоские записи.
// seed.ts создает сущности идемпотентно: product -> colorway -> images/variants.

export interface SeedVariant {
  size: ClothingSize;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
}

export interface SeedColorway {
  name: string;
  slug: string;
  swatchHex: string;
  isDefault: boolean;
  sortOrder: number;
  images: { url: string; alt: string; sortOrder: number }[];
  variants: SeedVariant[];
}

export interface SeedProduct {
  name: string;
  slug: string;
  brand: string;
  gender: Gender;
  description: string;
  fitNote: string;
  specs: Record<string, string>;
  isBestseller: boolean;
  sortOrder: number;
  categorySlug: string;
  colorways: SeedColorway[];
}

export const categories = [
  { name: 'Футболки', slug: 'tees', tagline: 'База на каждый день', sortOrder: 1 },
  { name: 'Худи', slug: 'hoodies', tagline: 'Мягкие слои для города', sortOrder: 2 },
  { name: 'Верхняя одежда', slug: 'outerwear', tagline: 'Легкие куртки и пальто', sortOrder: 3 },
  { name: 'Брюки', slug: 'pants', tagline: 'Свободная посадка и чистый силуэт', sortOrder: 4 },
  { name: 'Аксессуары', slug: 'accessories', tagline: 'Финальные детали образа', sortOrder: 5 },
];

type Row = { size: ClothingSize; stock: number };

const FULL: Row[] = [
  { size: 'XS', stock: 3 },
  { size: 'S', stock: 5 },
  { size: 'M', stock: 7 },
  { size: 'L', stock: 12 },
  { size: 'XL', stock: 4 },
  { size: 'XXL', stock: 0 },
];

const RELAXED: Row[] = [
  { size: 'XS', stock: 2 },
  { size: 'S', stock: 4 },
  { size: 'M', stock: 6 },
  { size: 'L', stock: 5 },
  { size: 'XL', stock: 3 },
  { size: 'XXL', stock: 0 },
];

const LIMITED: Row[] = [
  { size: 'XS', stock: 1 },
  { size: 'S', stock: 2 },
  { size: 'M', stock: 0 },
  { size: 'L', stock: 3 },
  { size: 'XL', stock: 1 },
  { size: 'XXL', stock: 0 },
];

const ONE_SIZE: Row[] = [
  { size: 'XS', stock: 0 },
  { size: 'S', stock: 0 },
  { size: 'M', stock: 8 },
  { size: 'L', stock: 8 },
  { size: 'XL', stock: 0 },
  { size: 'XXL', stock: 0 },
];

const mk = (skuBase: string, price: number, compareAtPrice: number | null, rows: Row[]): SeedVariant[] =>
  rows.map((r) => ({
    size: r.size,
    sku: `${skuBase}-${r.size}`,
    price,
    compareAtPrice,
    stock: r.stock,
  }));

export const products: SeedProduct[] = [
  {
    name: 'RITM Белая футболка Oversize',
    slug: 'ritm-white-tee-oversize',
    brand: 'RITM',
    gender: 'UNISEX',
    description:
      'Плотная белая футболка свободного силуэта из мягкого хлопка. База для капсулы, которую легко носить отдельно или первым слоем.',
    fitNote: 'Свободная посадка. Если нужен более собранный силуэт, выбирайте на размер меньше.',
    specs: { Материал: '100% хлопок', Плотность: '240 г/м2', Посадка: 'Oversize', Сезон: 'Всесезон' },
    isBestseller: true,
    sortOrder: 1,
    categorySlug: 'tees',
    colorways: [
      {
        name: 'Молочный',
        slug: 'milk',
        swatchHex: '#f4efe7',
        isDefault: true,
        sortOrder: 1,
        images: [
          { url: '/products/product-white-tee.png', alt: 'Белая футболка RITM Oversize, цвет Молочный', sortOrder: 0 },
          { url: '/products/product-white-tee-2.png', alt: 'Белая футболка RITM Oversize на модели', sortOrder: 1 },
        ],
        variants: mk('RITM-TEE-MILK', 3990, null, FULL),
      },
      {
        name: 'Черный',
        slug: 'black',
        swatchHex: '#111111',
        isDefault: false,
        sortOrder: 2,
        images: [{ url: '/products/product-black-tee.png', alt: 'Черная футболка RITM Oversize', sortOrder: 0 }],
        variants: mk('RITM-TEE-BLK', 3990, null, RELAXED),
      },
    ],
  },
  {
    name: 'RITM Худи Soft Loop',
    slug: 'ritm-soft-loop-hoodie',
    brand: 'RITM',
    gender: 'UNISEX',
    description:
      'Мягкое худи с плотной петлей внутри, объемным капюшоном и аккуратной посадкой по плечу. Подходит для прохладных вечеров и поездок по городу.',
    fitNote: 'Relaxed fit. Размер L оставлен с высоким запасом для e2e checkout-сценариев.',
    specs: {
      Материал: '80% хлопок, 20% полиэстер',
      Плотность: '360 г/м2',
      Капюшон: 'Двойной',
      Уход: 'Деликатная стирка 30C',
    },
    isBestseller: true,
    sortOrder: 2,
    categorySlug: 'hoodies',
    colorways: [
      {
        name: 'Светло-серый',
        slug: 'soft-grey',
        swatchHex: '#d9d8d2',
        isDefault: true,
        sortOrder: 1,
        images: [
          { url: '/products/product-soft-hoodie.png', alt: 'Худи RITM Soft Loop светло-серого цвета', sortOrder: 0 },
        ],
        variants: mk('RITM-HOOD-SGR', 7990, 8990, FULL),
      },
    ],
  },
  {
    name: 'RITM Куртка Pink Cloud',
    slug: 'ritm-pink-cloud-jacket',
    brand: 'RITM',
    gender: 'WOMEN',
    description:
      'Легкая стеганая куртка с мягким объемом и приглушенным розовым оттенком. Работает как акцентный верхний слой для межсезонья.',
    fitNote: 'Прямой силуэт, рассчитан на тонкий свитер или худи под низ.',
    specs: {
      Верх: 'Полиэстер с водоотталкивающей пропиткой',
      Утеплитель: 'Легкий синтетический слой',
      Подкладка: 'Вискоза',
      Сезон: 'Весна-осень',
    },
    isBestseller: false,
    sortOrder: 3,
    categorySlug: 'outerwear',
    colorways: [
      {
        name: 'Розовый',
        slug: 'dusty-pink',
        swatchHex: '#d8a7b0',
        isDefault: true,
        sortOrder: 1,
        images: [{ url: '/products/product-pink-outer.png', alt: 'Розовая куртка RITM Pink Cloud', sortOrder: 0 }],
        variants: mk('RITM-JKT-PNK', 12990, 14990, LIMITED),
      },
    ],
  },
  {
    name: 'RITM Лонгслив Japan Green',
    slug: 'ritm-japan-green-longsleeve',
    brand: 'RITM',
    gender: 'UNISEX',
    description:
      'Лонгслив с графикой в зеленой палитре и плотной горловиной. Спокойный акцент для повседневного образа.',
    fitNote: 'Стандартная посадка. Для oversize-эффекта выбирайте на размер больше.',
    specs: { Материал: 'Хлопок с эластаном', Принт: 'Шелкография', Рукав: 'Длинный', Сезон: 'Всесезон' },
    isBestseller: true,
    sortOrder: 4,
    categorySlug: 'tees',
    colorways: [
      {
        name: 'Шалфей',
        slug: 'sage',
        swatchHex: '#6f8b73',
        isDefault: true,
        sortOrder: 1,
        images: [
          { url: '/products/product-japan-green.png', alt: 'Лонгслив RITM Japan Green цвета Шалфей', sortOrder: 0 },
        ],
        variants: mk('RITM-LS-SAGE', 4990, null, RELAXED),
      },
    ],
  },
  {
    name: 'RITM Брюки Easy Wide',
    slug: 'ritm-easy-wide-pants',
    brand: 'RITM',
    gender: 'UNISEX',
    description:
      'Свободные брюки с мягкой талией и чистой линией ноги. Подходят к футболкам, худи и легким курткам RITM.',
    fitNote: 'Wide fit. Пояс регулируется шнуром, посадка средняя.',
    specs: { Материал: 'Хлопок и лиоцелл', Посадка: 'Средняя', Крой: 'Wide leg', Карманы: '4' },
    isBestseller: false,
    sortOrder: 5,
    categorySlug: 'pants',
    colorways: [
      {
        name: 'Хаки',
        slug: 'khaki',
        swatchHex: '#77745f',
        isDefault: true,
        sortOrder: 1,
        images: [{ url: '/products/product-japan-green.png', alt: 'Брюки RITM Easy Wide цвета Хаки', sortOrder: 0 }],
        variants: mk('RITM-PANT-KHK', 6990, null, RELAXED),
      },
      {
        name: 'Черный',
        slug: 'black',
        swatchHex: '#111111',
        isDefault: false,
        sortOrder: 2,
        images: [{ url: '/products/product-black-tee.png', alt: 'Брюки RITM Easy Wide черного цвета', sortOrder: 0 }],
        variants: mk('RITM-PANT-BLK', 6990, 7990, RELAXED),
      },
    ],
  },
  {
    name: 'RITM Шоппер Daily Canvas',
    slug: 'ritm-daily-canvas-tote',
    brand: 'RITM',
    gender: 'UNISEX',
    description: 'Плотный хлопковый шоппер для ноутбука, формы и покупок. Длинные ручки удобно носить на плече.',
    fitNote: 'One size. В каталоге представлен через размер M/L для совместимости с текущей variant-моделью.',
    specs: { Материал: 'Хлопковый канвас', Размер: '42 x 38 см', Ручки: '70 см', Уход: 'Ручная стирка' },
    isBestseller: false,
    sortOrder: 6,
    categorySlug: 'accessories',
    colorways: [
      {
        name: 'Молочный',
        slug: 'milk',
        swatchHex: '#f4efe7',
        isDefault: true,
        sortOrder: 1,
        images: [
          { url: '/products/product-white-tee-2.png', alt: 'Шоппер RITM Daily Canvas молочного цвета', sortOrder: 0 },
        ],
        variants: mk('RITM-TOTE-MILK', 2490, null, ONE_SIZE),
      },
    ],
  },
  {
    name: 'RITM Футболка Black Core',
    slug: 'ritm-black-core-tee',
    brand: 'RITM',
    gender: 'UNISEX',
    description: 'Черная футболка прямого силуэта с плотным воротом. Минимальная вещь для ежедневной ротации.',
    fitNote: 'Regular fit. Если между размерами, берите больший.',
    specs: { Материал: '100% хлопок', Плотность: '220 г/м2', Посадка: 'Regular', Сезон: 'Всесезон' },
    isBestseller: false,
    sortOrder: 7,
    categorySlug: 'tees',
    colorways: [
      {
        name: 'Черный',
        slug: 'black',
        swatchHex: '#111111',
        isDefault: true,
        sortOrder: 1,
        images: [{ url: '/products/product-black-tee.png', alt: 'Футболка RITM Black Core', sortOrder: 0 }],
        variants: mk('RITM-TEE-CORE-BLK', 3490, null, FULL),
      },
    ],
  },
  {
    name: 'RITM Худи Sage Zip',
    slug: 'ritm-sage-zip-hoodie',
    brand: 'RITM',
    gender: 'UNISEX',
    description: 'Худи на молнии в спокойном зеленом оттенке. Удобно как самостоятельный слой или под легкую куртку.',
    fitNote: 'Relaxed fit, длина до линии бедра.',
    specs: { Материал: 'Футер 3-нитка', Молния: 'Металл', Карманы: 'Кенгуру', Сезон: 'Всесезон' },
    isBestseller: false,
    sortOrder: 8,
    categorySlug: 'hoodies',
    colorways: [
      {
        name: 'Шалфей',
        slug: 'sage',
        swatchHex: '#6f8b73',
        isDefault: true,
        sortOrder: 1,
        images: [{ url: '/products/product-soft-hoodie.png', alt: 'Худи RITM Sage Zip', sortOrder: 0 }],
        variants: mk('RITM-HOOD-ZIP-SAGE', 8990, null, LIMITED),
      },
    ],
  },
];

export const coupons = [
  { code: 'RITM10', percent: 10, active: true, expiresAt: null },
  { code: 'WELCOME15', percent: 15, active: true, expiresAt: null },
  { code: 'EXPIRED', percent: 50, active: true, expiresAt: new Date('2020-01-01') },
] as const;
