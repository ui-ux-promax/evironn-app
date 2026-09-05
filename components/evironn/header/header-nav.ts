import { catalogRoomPath, PUBLIC_ROUTES } from '@/components/evironn/public-routes';

export type HeaderLink = { label: string; href: string };

export type HeaderRoomLink = HeaderLink & {
  /** Hero poster reused as the room card image inside the mobile sheet. */
  poster: string;
};

/** Desktop primary navigation, in the canonical storefront order. */
export const PRIMARY_LINKS: readonly HeaderLink[] = [
  { label: 'Вся мебель', href: PUBLIC_ROUTES.catalog },
  { label: 'Гостиная', href: catalogRoomPath('living') },
  { label: 'Столовая', href: catalogRoomPath('dining') },
  { label: 'Спальня', href: catalogRoomPath('bedroom') },
  { label: 'Терраса', href: catalogRoomPath('terrace') },
];

/** Room cards of the mobile sheet, matching the primary navigation order. */
export const ROOM_LINKS: readonly HeaderRoomLink[] = [
  { label: 'Гостиная', href: catalogRoomPath('living'), poster: '/assets/hero/living-room-idle-5f0f1836.webp' },
  { label: 'Столовая', href: catalogRoomPath('dining'), poster: '/assets/hero/kitchen-idle.webp' },
  { label: 'Спальня', href: catalogRoomPath('bedroom'), poster: '/assets/hero/bedroom-idle.webp' },
  { label: 'Терраса', href: catalogRoomPath('terrace'), poster: '/assets/hero/terrace-idle.webp' },
];

export const CATALOG_LINK: HeaderLink = { label: 'Вся мебель', href: PUBLIC_ROUTES.catalog };
export const SEARCH_LINK: HeaderLink = { label: 'Поиск', href: PUBLIC_ROUTES.catalog };
export const ACCOUNT_LINK: HeaderLink = { label: 'Аккаунт', href: PUBLIC_ROUTES.profile };
export const CART_HREF = PUBLIC_ROUTES.cart;

export const cartLabel = (count: number) => `Корзина (${count})`;
