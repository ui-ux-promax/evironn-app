import { catalogRoomPath, PUBLIC_ROUTES } from '@/components/evironn/public-routes';

export type HeaderNavLink = {
  /** Canonical visible label. Kept identical across every variant so the
   *  storefront shell contract (label + href order) stays reusable. */
  label: string;
  href: string;
};

export type HeaderRoomLink = HeaderNavLink & {
  /** Two-digit editorial index used by the typographic variants. */
  index: string;
  /** Short supporting line shown by the variants that have room for it. */
  caption: string;
  /** Existing hero poster reused as the room thumbnail. */
  poster: string;
};

/** Desktop primary navigation, in the order the approved header already uses. */
export const HEADER_PRIMARY_LINKS: readonly HeaderNavLink[] = [
  { label: 'Вся мебель', href: PUBLIC_ROUTES.catalog },
  { label: 'Гостиная', href: catalogRoomPath('living') },
  { label: 'Столовая', href: catalogRoomPath('dining') },
  { label: 'Спальня', href: catalogRoomPath('bedroom') },
  { label: 'Терраса', href: catalogRoomPath('terrace') },
];

/** Room entries with the extra editorial metadata the drawers use. */
export const HEADER_ROOM_LINKS: readonly HeaderRoomLink[] = [
  {
    index: '01',
    label: 'Гостиная',
    caption: 'Диваны, кресла, столики',
    href: catalogRoomPath('living'),
    poster: '/assets/hero/living-room-idle-5f0f1836.webp',
  },
  {
    index: '02',
    label: 'Столовая',
    caption: 'Столы, стулья, буфеты',
    href: catalogRoomPath('dining'),
    poster: '/assets/hero/kitchen-idle.webp',
  },
  {
    index: '03',
    label: 'Спальня',
    caption: 'Кровати, комоды, свет',
    href: catalogRoomPath('bedroom'),
    poster: '/assets/hero/bedroom-idle.webp',
  },
  {
    index: '04',
    label: 'Терраса',
    caption: 'Мебель для улицы',
    href: catalogRoomPath('terrace'),
    poster: '/assets/hero/terrace-idle.webp',
  },
];

export const HEADER_CATALOG_LINK: HeaderNavLink = { label: 'Вся мебель', href: PUBLIC_ROUTES.catalog };
export const HEADER_SEARCH_LINK: HeaderNavLink = { label: 'Поиск', href: PUBLIC_ROUTES.catalog };
export const HEADER_ACCOUNT_LINK: HeaderNavLink = { label: 'Аккаунт', href: PUBLIC_ROUTES.profile };
export const HEADER_CART_HREF = PUBLIC_ROUTES.cart;

export const HEADER_TAGLINE = 'Мебель для тихих, наполненных жизнью интерьеров.';

export const cartLabel = (count: number) => `Корзина (${count})`;
