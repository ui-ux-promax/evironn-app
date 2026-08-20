import { buildCombinationKey, type SkuOptionSelection } from '../lib/furniture-sku';

export type FurnitureMediaKind = 'IMAGE' | 'TURN_TABLE_VIDEO' | 'TURN_TABLE_POSTER' | 'TURN_TABLE_FALLBACK';

export interface SeedMedia {
  kind: FurnitureMediaKind;
  url: string;
  alt: string;
  sortOrder: number;
}

export interface SeedOptionValue {
  name: string;
  slug: string;
  swatchHex?: string;
  sortOrder: number;
}

export interface SeedOptionGroup {
  name: string;
  slug: string;
  sortOrder: number;
  values: SeedOptionValue[];
}

export interface SeedSku {
  articleNumber: string;
  combinationKey: string;
  selectedOptions: SkuOptionSelection[];
  price: number;
  oldPrice: number | null;
  stock: number;
  active: boolean;
  media?: SeedMedia[];
}

export interface SeedProduct {
  name: string;
  slug: string;
  categorySlug: string;
  roomSlugs: string[];
  description: string;
  specs: Record<string, string>;
  isBestseller: boolean;
  sortOrder: number;
  optionGroups: SeedOptionGroup[];
  skus: SeedSku[];
  media: SeedMedia[];
  turntable?: boolean;
}

export interface SeedCategory {
  name: string;
  slug: string;
  tagline: string;
  sortOrder: number;
  turntableProductSlug?: string;
}

export interface SeedRoom {
  name: string;
  slug: string;
  sortOrder: number;
}

const image = (url: string, alt: string, sortOrder = 0): SeedMedia => ({ kind: 'IMAGE', url, alt, sortOrder });

const optionGroup = (
  name: string,
  slug: string,
  values: Array<Pick<SeedOptionValue, 'name' | 'slug' | 'swatchHex'>>,
  sortOrder: number,
): SeedOptionGroup => ({
  name,
  slug,
  sortOrder,
  values: values.map((value, index) => ({ ...value, sortOrder: index })),
});

const finish = (values: Array<Pick<SeedOptionValue, 'name' | 'slug' | 'swatchHex'>>) =>
  optionGroup('Отделка', 'finish', values, 1);
const upholstery = (values: Array<Pick<SeedOptionValue, 'name' | 'slug' | 'swatchHex'>>) =>
  optionGroup('Обивка', 'upholstery', values, 2);
const dimensions = (values: Array<Pick<SeedOptionValue, 'name' | 'slug' | 'swatchHex'>>) =>
  optionGroup('Размер', 'dimensions', values, 3);

const sku = (
  articleNumber: string,
  selectedOptions: SkuOptionSelection[],
  price: number,
  stock: number,
  oldPrice: number | null = null,
): SeedSku => ({
  articleNumber,
  combinationKey: buildCombinationKey(selectedOptions),
  selectedOptions,
  price,
  oldPrice,
  stock,
  active: true,
});

export const rooms: SeedRoom[] = [
  { name: 'Гостиная', slug: 'living', sortOrder: 1 },
  { name: 'Столовая', slug: 'dining', sortOrder: 2 },
  { name: 'Спальня', slug: 'bedroom', sortOrder: 3 },
  { name: 'Терраса', slug: 'terrace', sortOrder: 4 },
  { name: 'Кабинет', slug: 'study', sortOrder: 5 },
];

export const furnitureCategories: SeedCategory[] = [
  { name: 'Диваны', slug: 'sofas', tagline: 'Мягкая архитектура для гостиной', sortOrder: 1 },
  {
    name: 'Кресла',
    slug: 'armchairs',
    tagline: 'Личные места для тишины',
    sortOrder: 2,
    turntableProductSlug: 'noma-woven-lounge',
  },
  { name: 'Кресла-качалки', slug: 'rocking', tagline: 'Ритм отдыха в каждом движении', sortOrder: 3 },
  { name: 'Барные стулья', slug: 'bar-stools', tagline: 'Высота, в которой удобно жить', sortOrder: 4 },
  { name: 'Стулья', slug: 'chairs', tagline: 'Ежедневные формы с характером', sortOrder: 5 },
];

export const furnitureProducts: SeedProduct[] = [
  {
    name: 'Aster Bar Stool',
    slug: 'aster-bar-stool',
    categorySlug: 'bar-stools',
    roomSlugs: ['dining'],
    description: 'Барный стул из массива дуба с мягкой геометрией спинки.',
    specs: { Материал: 'Массив дуба', Высота: '76 см', Уход: 'Сухая мягкая ткань' },
    isBestseller: false,
    sortOrder: 1,
    optionGroups: [
      finish([
        { name: 'Песочный дуб', slug: 'oak', swatchHex: '#c8a97e' },
        { name: 'Орех', slug: 'walnut', swatchHex: '#6b4a30' },
      ]),
      dimensions([{ name: 'Барный', slug: 'bar' }]),
    ],
    skus: [
      sku(
        'EV-ASB-OAK',
        [
          { groupSlug: 'finish', valueSlug: 'oak' },
          { groupSlug: 'dimensions', valueSlug: 'bar' },
        ],
        34900,
        8,
      ),
      sku(
        'EV-ASB-WAL',
        [
          { groupSlug: 'finish', valueSlug: 'walnut' },
          { groupSlug: 'dimensions', valueSlug: 'bar' },
        ],
        36900,
        5,
      ),
    ],
    media: [image('/assets/products/01-bar-stool-idle.webp', 'Aster Bar Stool')],
  },
  {
    name: 'Terra Rocking Chair',
    slug: 'terra-rocking-chair',
    categorySlug: 'rocking',
    roomSlugs: ['living'],
    description: 'Кресло-качалка с плетёным ротангом и ясенной рамой.',
    specs: { Материал: 'Ротанг, ясень', Ширина: '72 см', Нагрузка: '120 кг' },
    isBestseller: true,
    sortOrder: 2,
    optionGroups: [
      finish([{ name: 'Ясень', slug: 'ash', swatchHex: '#c9b99f' }]),
      upholstery([
        { name: 'Кремовый', slug: 'ivory-boucle', swatchHex: '#efe7d8' },
        { name: 'Песочный', slug: 'sand-linen', swatchHex: '#d8c7a4' },
      ]),
    ],
    skus: [
      sku(
        'EV-TRC-IVR',
        [
          { groupSlug: 'finish', valueSlug: 'ash' },
          { groupSlug: 'upholstery', valueSlug: 'ivory-boucle' },
        ],
        78900,
        4,
        92900,
      ),
      sku(
        'EV-TRC-SND',
        [
          { groupSlug: 'finish', valueSlug: 'ash' },
          { groupSlug: 'upholstery', valueSlug: 'sand-linen' },
        ],
        78900,
        2,
        92900,
      ),
    ],
    media: [image('/assets/products/02-rocking-chair-idle.webp', 'Terra Rocking Chair')],
  },
  {
    name: 'Noma Woven Lounge',
    slug: 'noma-woven-lounge',
    categorySlug: 'armchairs',
    roomSlugs: ['living'],
    description: 'Глубокое lounge-кресло с объёмной букле и съёмным чехлом.',
    specs: { Материал: 'Букле, дуб', Ширина: '84 см', Глубина: '90 см' },
    isBestseller: true,
    sortOrder: 3,
    turntable: true,
    optionGroups: [
      finish([
        { name: 'Натуральный дуб', slug: 'oak', swatchHex: '#c8a97e' },
        { name: 'Орех', slug: 'walnut', swatchHex: '#6b4a30' },
      ]),
      upholstery([
        { name: 'Кремовая букле', slug: 'ivory-boucle', swatchHex: '#efe7d8' },
        { name: 'Graphite', slug: 'graphite', swatchHex: '#31312f' },
        { name: 'Terracotta', slug: 'terracotta', swatchHex: '#a85b43' },
      ]),
    ],
    skus: [
      sku(
        'EV-NWL-OAK',
        [
          { groupSlug: 'finish', valueSlug: 'oak' },
          { groupSlug: 'upholstery', valueSlug: 'ivory-boucle' },
        ],
        89990,
        3,
        109990,
      ),
      sku(
        'EV-NWL-WAL',
        [
          { groupSlug: 'finish', valueSlug: 'walnut' },
          { groupSlug: 'upholstery', valueSlug: 'ivory-boucle' },
        ],
        89990,
        3,
        109990,
      ),
      sku(
        'EV-NWL-GPH-OAK',
        [
          { groupSlug: 'finish', valueSlug: 'oak' },
          { groupSlug: 'upholstery', valueSlug: 'graphite' },
        ],
        89990,
        3,
        109990,
      ),
      sku(
        'EV-NWL-GPH-WAL',
        [
          { groupSlug: 'finish', valueSlug: 'walnut' },
          { groupSlug: 'upholstery', valueSlug: 'graphite' },
        ],
        89990,
        3,
        109990,
      ),
      sku(
        'EV-NWL-TER-OAK',
        [
          { groupSlug: 'finish', valueSlug: 'oak' },
          { groupSlug: 'upholstery', valueSlug: 'terracotta' },
        ],
        89990,
        3,
        109990,
      ),
      sku(
        'EV-NWL-TER-WAL',
        [
          { groupSlug: 'finish', valueSlug: 'walnut' },
          { groupSlug: 'upholstery', valueSlug: 'terracotta' },
        ],
        89990,
        3,
        109990,
      ),
    ],
    media: [
      image('/assets/products/05-graphite-walnut-lounge-chair-turntable-poster.png', 'Noma Woven Lounge'),
      {
        kind: 'TURN_TABLE_VIDEO',
        url: '/assets/products/05-graphite-walnut-lounge-chair-turntable-alpha.webm',
        alt: 'Noma Woven Lounge 360',
        sortOrder: 0,
      },
      {
        kind: 'TURN_TABLE_POSTER',
        url: '/assets/products/05-graphite-walnut-lounge-chair-turntable-poster.png',
        alt: 'Noma Woven Lounge 360 poster',
        sortOrder: 0,
      },
      {
        kind: 'TURN_TABLE_FALLBACK',
        url: '/assets/products/05-graphite-walnut-lounge-chair-turntable-poster.png',
        alt: 'Noma Woven Lounge static view',
        sortOrder: 0,
      },
    ],
  },
  {
    name: 'Sora Accent Chair',
    slug: 'sora-accent-chair',
    categorySlug: 'armchairs',
    roomSlugs: ['study'],
    description: 'Компактное кресло с графитовым металлом и мягким велюром.',
    specs: { Материал: 'Велюр, металл', Ширина: '68 см', Высота: '79 см' },
    isBestseller: false,
    sortOrder: 4,
    optionGroups: [
      finish([{ name: 'Графит', slug: 'graphite', swatchHex: '#3a3937' }]),
      upholstery([{ name: 'Графитовый велюр', slug: 'graphite-velour', swatchHex: '#3a3937' }]),
    ],
    skus: [
      sku(
        'EV-SAC-GPH',
        [
          { groupSlug: 'finish', valueSlug: 'graphite' },
          { groupSlug: 'upholstery', valueSlug: 'graphite-velour' },
        ],
        96500,
        3,
      ),
    ],
    media: [image('/assets/products/04-dark-accent-idle.webp', 'Sora Accent Chair')],
  },
  {
    name: 'Linden Two-Seat Sofa',
    slug: 'linden-two-seat-sofa',
    categorySlug: 'sofas',
    roomSlugs: ['living'],
    description: 'Двухместный диван с льняной обивкой и пуховыми подушками.',
    specs: { Материал: 'Лён, бук', Ширина: '184 см', Глубина: '96 см' },
    isBestseller: true,
    sortOrder: 5,
    optionGroups: [
      finish([{ name: 'Светлый дуб', slug: 'oak', swatchHex: '#c8a97e' }]),
      upholstery([
        { name: 'Кремовый лён', slug: 'ivory-linen', swatchHex: '#efe7d8' },
        { name: 'Шалфейный лён', slug: 'sage-linen', swatchHex: '#7f8d79' },
      ]),
      dimensions([{ name: 'Два места', slug: 'two-seat' }]),
    ],
    skus: [
      sku(
        'EV-LTS-IVR',
        [
          { groupSlug: 'finish', valueSlug: 'oak' },
          { groupSlug: 'upholstery', valueSlug: 'ivory-linen' },
          { groupSlug: 'dimensions', valueSlug: 'two-seat' },
        ],
        168000,
        2,
        189000,
      ),
      sku(
        'EV-LTS-SGE',
        [
          { groupSlug: 'finish', valueSlug: 'oak' },
          { groupSlug: 'upholstery', valueSlug: 'sage-linen' },
          { groupSlug: 'dimensions', valueSlug: 'two-seat' },
        ],
        168000,
        1,
        189000,
      ),
    ],
    media: [image('/assets/products/05-two-seat-sofa-idle.webp', 'Linden Two-Seat Sofa')],
  },
  {
    name: 'Aster Counter Chair',
    slug: 'aster-counter-chair',
    categorySlug: 'chairs',
    roomSlugs: ['dining'],
    description: 'Лаконичный стул для кухонного острова с дубовой спинкой.',
    specs: { Материал: 'Дуб', Высота: '65 см', Сиденье: 'Фанера, шпон' },
    isBestseller: false,
    sortOrder: 6,
    optionGroups: [
      finish([
        { name: 'Орех', slug: 'walnut', swatchHex: '#6b4a30' },
        { name: 'Дуб', slug: 'oak', swatchHex: '#c8a97e' },
      ]),
      dimensions([{ name: 'Полубарный', slug: 'counter' }]),
    ],
    skus: [
      sku(
        'EV-ACC-WAL',
        [
          { groupSlug: 'finish', valueSlug: 'walnut' },
          { groupSlug: 'dimensions', valueSlug: 'counter' },
        ],
        28900,
        7,
      ),
      sku(
        'EV-ACC-OAK',
        [
          { groupSlug: 'finish', valueSlug: 'oak' },
          { groupSlug: 'dimensions', valueSlug: 'counter' },
        ],
        28900,
        4,
      ),
    ],
    media: [image('/assets/products/01-bar-stool-cutout.png', 'Aster Counter Chair')],
  },
  {
    name: 'Terra Rocking Chair Dark',
    slug: 'terra-rocking-chair-dark',
    categorySlug: 'rocking',
    roomSlugs: ['terrace'],
    description: 'Тёмная версия кресла-качалки с влагостойкой рамой.',
    specs: { Материал: 'Ротанг, ясень', Отделка: 'Графит', Нагрузка: '120 кг' },
    isBestseller: false,
    sortOrder: 7,
    optionGroups: [
      finish([{ name: 'Графит', slug: 'graphite', swatchHex: '#3a3937' }]),
      upholstery([{ name: 'Графитовый текстиль', slug: 'graphite-velour', swatchHex: '#3a3937' }]),
    ],
    skus: [
      sku(
        'EV-TRD-GPH',
        [
          { groupSlug: 'finish', valueSlug: 'graphite' },
          { groupSlug: 'upholstery', valueSlug: 'graphite-velour' },
        ],
        82400,
        2,
      ),
    ],
    media: [image('/assets/products/04-dark-accent-idle.webp', 'Terra Rocking Chair Dark')],
  },
  {
    name: 'Noma Lounge Sage',
    slug: 'noma-lounge-sage',
    categorySlug: 'armchairs',
    roomSlugs: ['living'],
    description: 'Мягкое кресло Noma в шалфейной букле и дубовой базе.',
    specs: { Материал: 'Букле, дуб', Ширина: '84 см', Цвет: 'Шалфей' },
    isBestseller: false,
    sortOrder: 8,
    optionGroups: [
      finish([{ name: 'Дуб', slug: 'oak', swatchHex: '#c8a97e' }]),
      upholstery([{ name: 'Шалфейная букле', slug: 'sage-boucle', swatchHex: '#7f8d79' }]),
    ],
    skus: [
      sku(
        'EV-NLS-OAK',
        [
          { groupSlug: 'finish', valueSlug: 'oak' },
          { groupSlug: 'upholstery', valueSlug: 'sage-boucle' },
        ],
        129000,
        2,
      ),
    ],
    media: [image('/assets/products/03-ivory-lounge-idle.webp', 'Noma Lounge Sage')],
  },
  {
    name: 'Sora Accent Terracotta',
    slug: 'sora-accent-terracotta',
    categorySlug: 'armchairs',
    roomSlugs: ['bedroom'],
    description: 'Акцентное кресло в терракотовом велюре.',
    specs: { Материал: 'Велюр, металл', Ширина: '68 см', Цвет: 'Терракота' },
    isBestseller: false,
    sortOrder: 9,
    optionGroups: [
      finish([{ name: 'Графит', slug: 'graphite', swatchHex: '#3a3937' }]),
      upholstery([{ name: 'Терракотовый велюр', slug: 'terracotta-velour', swatchHex: '#a9684e' }]),
    ],
    skus: [
      sku(
        'EV-SAT-GPH',
        [
          { groupSlug: 'finish', valueSlug: 'graphite' },
          { groupSlug: 'upholstery', valueSlug: 'terracotta-velour' },
        ],
        99900,
        2,
        112000,
      ),
    ],
    media: [image('/assets/products/05-terracotta-walnut-chair-alpha.png', 'Sora Accent Terracotta')],
  },
  {
    name: 'Linden Sofa Sage',
    slug: 'linden-sofa-sage',
    categorySlug: 'sofas',
    roomSlugs: ['living'],
    description: 'Просторный трёхместный диван в шалфейном льне.',
    specs: { Материал: 'Лён, бук', Ширина: '226 см', Глубина: '98 см' },
    isBestseller: true,
    sortOrder: 10,
    optionGroups: [
      finish([{ name: 'Дуб', slug: 'oak', swatchHex: '#c8a97e' }]),
      upholstery([{ name: 'Шалфейный лён', slug: 'sage-linen', swatchHex: '#7f8d79' }]),
      dimensions([{ name: 'Три места', slug: 'three-seat' }]),
    ],
    skus: [
      sku(
        'EV-LSS-OAK',
        [
          { groupSlug: 'finish', valueSlug: 'oak' },
          { groupSlug: 'upholstery', valueSlug: 'sage-linen' },
          { groupSlug: 'dimensions', valueSlug: 'three-seat' },
        ],
        184000,
        2,
      ),
    ],
    media: [image('/assets/products/05-two-seat-sofa-idle.webp', 'Linden Sofa Sage')],
  },
  {
    name: 'Aster Stool Graphite',
    slug: 'aster-stool-graphite',
    categorySlug: 'bar-stools',
    roomSlugs: ['dining'],
    description: 'Компактный барный стул с графитовым металлическим основанием.',
    specs: { Материал: 'Кожа, сталь', Высота: '76 см', Цвет: 'Графит' },
    isBestseller: false,
    sortOrder: 11,
    optionGroups: [
      finish([{ name: 'Графит', slug: 'graphite', swatchHex: '#3a3937' }]),
      upholstery([{ name: 'Графитовая кожа', slug: 'graphite-leather', swatchHex: '#3a3937' }]),
      dimensions([{ name: 'Барный', slug: 'bar' }]),
    ],
    skus: [
      sku(
        'EV-ASG-GPH',
        [
          { groupSlug: 'finish', valueSlug: 'graphite' },
          { groupSlug: 'upholstery', valueSlug: 'graphite-leather' },
          { groupSlug: 'dimensions', valueSlug: 'bar' },
        ],
        41200,
        5,
      ),
    ],
    media: [image('/assets/products/01-bar-stool-idle.webp', 'Aster Stool Graphite')],
  },
  {
    name: 'Terra Chair Ivory',
    slug: 'terra-chair-ivory',
    categorySlug: 'chairs',
    roomSlugs: ['bedroom'],
    description: 'Светлое кресло с ротангом и мягкой подушкой.',
    specs: { Материал: 'Ротанг, текстиль', Ширина: '70 см', Цвет: 'Кремовый' },
    isBestseller: false,
    sortOrder: 12,
    optionGroups: [
      finish([{ name: 'Ротанг', slug: 'rattan', swatchHex: '#b79a73' }]),
      upholstery([{ name: 'Кремовый', slug: 'ivory-boucle', swatchHex: '#efe7d8' }]),
    ],
    skus: [
      sku(
        'EV-TCI-RTN',
        [
          { groupSlug: 'finish', valueSlug: 'rattan' },
          { groupSlug: 'upholstery', valueSlug: 'ivory-boucle' },
        ],
        74500,
        3,
      ),
    ],
    media: [image('/assets/products/02-rocking-chair-idle.webp', 'Terra Chair Ivory')],
  },
];

export const categories = furnitureCategories;
export const products = furnitureProducts;

export const coupons = [
  { code: 'WELCOME10', percent: 10, active: true, expiresAt: null },
  { code: 'EVIRONN15', percent: 15, active: true, expiresAt: null },
];
