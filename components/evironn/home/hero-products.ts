import { SHOWCASE_DEFAULT_PRODUCT_PATH } from '@/components/evironn/public-routes';
import type { HeroProductId } from './hero-product-state';
import type { AvailableHeroRoomId } from './hero-room-state';

export type HeroProduct = {
  id: HeroProductId;
  roomId: AvailableHeroRoomId;
  name: string;
  category: string;
  price: string;
  forward: HeroVideoSources;
  reverse: HeroVideoSources;
  focusSrc: string;
  playbackRate: number;
  mediaClassName: string;
  hotspotClassName: string;
  href: string | null;
};

export type HeroVideoSources = Readonly<{ webm: string; mp4: string }>;

export const HERO_PRODUCTS: Record<HeroProductId, HeroProduct> = {
  sofa: {
    id: 'sofa',
    roomId: 'living-room',
    name: 'Диван Linden на два места',
    category: 'Гостиная',
    price: '$1,680',
    forward: { webm: '/assets/hero/sofa-forward.webm', mp4: '/assets/hero/sofa-forward.mp4' },
    reverse: { webm: '/assets/hero/sofa-reverse.webm', mp4: '/assets/hero/sofa-reverse.mp4' },
    focusSrc: '/assets/hero/sofa-focus.webp',
    playbackRate: 1,
    mediaClassName: 'is-living-room is-mirrored',
    hotspotClassName: 'furni-hero-hotspot-sofa',
    href: SHOWCASE_DEFAULT_PRODUCT_PATH,
  },
  chair: {
    id: 'chair',
    roomId: 'living-room',
    name: 'Плетёное кресло Noma',
    category: 'Мягкая мебель',
    price: '$1,240',
    forward: { webm: '/assets/hero/chair-forward.webm', mp4: '/assets/hero/chair-forward.mp4' },
    reverse: { webm: '/assets/hero/chair-reverse.webm', mp4: '/assets/hero/chair-reverse.mp4' },
    focusSrc: '/assets/hero/chair-focus.webp',
    playbackRate: 1,
    mediaClassName: 'is-living-room is-mirrored',
    hotspotClassName: 'furni-hero-hotspot-chair',
    href: SHOWCASE_DEFAULT_PRODUCT_PATH,
  },
  'kitchen-dining': {
    id: 'kitchen-dining',
    roomId: 'kitchen',
    name: 'Обеденный стул Arden',
    category: 'Столовая',
    price: '$620',
    forward: { webm: '/assets/hero/kitchen-dining-forward.webm', mp4: '/assets/hero/kitchen-dining-forward.mp4' },
    reverse: { webm: '/assets/hero/kitchen-dining-reverse.webm', mp4: '/assets/hero/kitchen-dining-reverse.mp4' },
    focusSrc: '/assets/hero/kitchen-dining-focus.webp',
    playbackRate: 1,
    mediaClassName: 'is-kitchen',
    hotspotClassName: 'furni-hero-hotspot-kitchen-dining',
    href: SHOWCASE_DEFAULT_PRODUCT_PATH,
  },
  'kitchen-island': {
    id: 'kitchen-island',
    roomId: 'kitchen',
    name: 'Барный стул Aster',
    category: 'Кухня',
    price: '$490',
    forward: { webm: '/assets/hero/kitchen-island-forward.webm', mp4: '/assets/hero/kitchen-island-forward.mp4' },
    reverse: { webm: '/assets/hero/kitchen-island-reverse.webm', mp4: '/assets/hero/kitchen-island-reverse.mp4' },
    focusSrc: '/assets/hero/kitchen-island-focus.webp',
    playbackRate: 1.2,
    mediaClassName: 'is-kitchen',
    hotspotClassName: 'furni-hero-hotspot-kitchen-island',
    href: SHOWCASE_DEFAULT_PRODUCT_PATH,
  },
  'bedroom-chair': {
    id: 'bedroom-chair',
    roomId: 'bedroom',
    name: 'Кресло Elara Bouclé',
    category: 'Мебель для спальни',
    price: '$980',
    forward: { webm: '/assets/hero/bedroom-chair-forward.webm', mp4: '/assets/hero/bedroom-chair-forward.mp4' },
    reverse: { webm: '/assets/hero/bedroom-chair-reverse.webm', mp4: '/assets/hero/bedroom-chair-reverse.mp4' },
    focusSrc: '/assets/hero/bedroom-chair-focus.webp',
    playbackRate: 1,
    mediaClassName: 'is-bedroom',
    hotspotClassName: 'furni-hero-hotspot-bedroom-chair',
    href: SHOWCASE_DEFAULT_PRODUCT_PATH,
  },
  'bedroom-bed': {
    id: 'bedroom-bed',
    roomId: 'bedroom',
    name: 'Кровать Maren на платформе',
    category: 'Спальня',
    price: '$2,480',
    forward: { webm: '/assets/hero/bedroom-bed-forward.webm', mp4: '/assets/hero/bedroom-bed-forward.mp4' },
    reverse: { webm: '/assets/hero/bedroom-bed-reverse.webm', mp4: '/assets/hero/bedroom-bed-reverse.mp4' },
    focusSrc: '/assets/hero/bedroom-bed-focus.webp',
    playbackRate: 1,
    mediaClassName: 'is-bedroom',
    hotspotClassName: 'furni-hero-hotspot-bedroom-bed',
    href: SHOWCASE_DEFAULT_PRODUCT_PATH,
  },
  'terrace-chair': {
    id: 'terrace-chair',
    roomId: 'terrace',
    name: 'Уличное кресло Sora',
    category: 'Уличная мебель',
    price: '$1,120',
    forward: { webm: '/assets/hero/terrace-chair-forward.webm', mp4: '/assets/hero/terrace-chair-forward.mp4' },
    reverse: { webm: '/assets/hero/terrace-chair-reverse.webm', mp4: '/assets/hero/terrace-chair-reverse.mp4' },
    focusSrc: '/assets/hero/terrace-chair-focus.webp',
    playbackRate: 1,
    mediaClassName: 'is-terrace',
    hotspotClassName: 'furni-hero-hotspot-terrace-chair',
    href: SHOWCASE_DEFAULT_PRODUCT_PATH,
  },
  'terrace-sofa': {
    id: 'terrace-sofa',
    roomId: 'terrace',
    name: 'Уличный диван Vale',
    category: 'Терраса',
    price: '$1,890',
    forward: { webm: '/assets/hero/terrace-sofa-forward.webm', mp4: '/assets/hero/terrace-sofa-forward.mp4' },
    reverse: { webm: '/assets/hero/terrace-sofa-reverse.webm', mp4: '/assets/hero/terrace-sofa-reverse.mp4' },
    focusSrc: '/assets/hero/terrace-sofa-focus.webp',
    playbackRate: 1,
    mediaClassName: 'is-terrace',
    hotspotClassName: 'furni-hero-hotspot-terrace-sofa',
    href: SHOWCASE_DEFAULT_PRODUCT_PATH,
  },
};
