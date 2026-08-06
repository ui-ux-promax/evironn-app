import type { HeroProductId } from './heroProductState';
import type { AvailableHeroRoomId } from './heroRoomState';

export type HeroProduct = {
  id: HeroProductId;
  roomId: AvailableHeroRoomId;
  name: string;
  category: string;
  price: string;
  forwardSrc: string;
  reverseSrc: string;
  focusSrc: string;
  playbackRate: number;
  mediaClassName: string;
  hotspotClassName: string;
  href: string | null;
};

export const HERO_PRODUCTS: Record<HeroProductId, HeroProduct> = {
  sofa: {
    id: 'sofa',
    roomId: 'living-room',
    name: 'Диван Linden на два места',
    category: 'Гостиная',
    price: '$1,680',
    forwardSrc: '/assets/hero/sofa-forward.mp4',
    reverseSrc: '/assets/hero/sofa-reverse.mp4',
    focusSrc: '/assets/hero/sofa-focus.webp',
    playbackRate: 1,
    mediaClassName: 'is-living-room is-mirrored',
    hotspotClassName: 'evironn-hero-hotspot-sofa',
    href: null,
  },
  chair: {
    id: 'chair',
    roomId: 'living-room',
    name: 'Плетёное кресло Noma',
    category: 'Мягкая мебель',
    price: '$1,240',
    forwardSrc: '/assets/hero/chair-forward.mp4',
    reverseSrc: '/assets/hero/chair-reverse.mp4',
    focusSrc: '/assets/hero/chair-focus.webp',
    playbackRate: 1,
    mediaClassName: 'is-living-room is-mirrored',
    hotspotClassName: 'evironn-hero-hotspot-chair',
    href: null,
  },
  'kitchen-dining': {
    id: 'kitchen-dining',
    roomId: 'kitchen',
    name: 'Обеденный стул Arden',
    category: 'Столовая',
    price: '$620',
    forwardSrc: '/assets/hero/kitchen-dining-forward.mp4',
    reverseSrc: '/assets/hero/kitchen-dining-reverse.mp4',
    focusSrc: '/assets/hero/kitchen-dining-focus.webp',
    playbackRate: 1,
    mediaClassName: 'is-kitchen',
    hotspotClassName: 'evironn-hero-hotspot-kitchen-dining',
    href: null,
  },
  'kitchen-island': {
    id: 'kitchen-island',
    roomId: 'kitchen',
    name: 'Барный стул Aster',
    category: 'Кухня',
    price: '$490',
    forwardSrc: '/assets/hero/kitchen-island-forward.mp4',
    reverseSrc: '/assets/hero/kitchen-island-reverse.mp4',
    focusSrc: '/assets/hero/kitchen-island-focus.webp',
    playbackRate: 1.2,
    mediaClassName: 'is-kitchen',
    hotspotClassName: 'evironn-hero-hotspot-kitchen-island',
    href: null,
  },
  'bedroom-chair': {
    id: 'bedroom-chair',
    roomId: 'bedroom',
    name: 'Кресло Elara Bouclé',
    category: 'Мебель для спальни',
    price: '$980',
    forwardSrc: '/assets/hero/bedroom-chair-forward.mp4',
    reverseSrc: '/assets/hero/bedroom-chair-reverse.mp4',
    focusSrc: '/assets/hero/bedroom-chair-focus.webp',
    playbackRate: 1,
    mediaClassName: 'is-bedroom',
    hotspotClassName: 'evironn-hero-hotspot-bedroom-chair',
    href: null,
  },
  'bedroom-bed': {
    id: 'bedroom-bed',
    roomId: 'bedroom',
    name: 'Кровать Maren на платформе',
    category: 'Спальня',
    price: '$2,480',
    forwardSrc: '/assets/hero/bedroom-bed-forward.mp4',
    reverseSrc: '/assets/hero/bedroom-bed-reverse.mp4',
    focusSrc: '/assets/hero/bedroom-bed-focus.webp',
    playbackRate: 1,
    mediaClassName: 'is-bedroom',
    hotspotClassName: 'evironn-hero-hotspot-bedroom-bed',
    href: null,
  },
  'terrace-chair': {
    id: 'terrace-chair',
    roomId: 'terrace',
    name: 'Уличное кресло Sora',
    category: 'Уличная мебель',
    price: '$1,120',
    forwardSrc: '/assets/hero/terrace-chair-forward.mp4',
    reverseSrc: '/assets/hero/terrace-chair-reverse.mp4',
    focusSrc: '/assets/hero/terrace-chair-focus.webp',
    playbackRate: 1,
    mediaClassName: 'is-terrace',
    hotspotClassName: 'evironn-hero-hotspot-terrace-chair',
    href: null,
  },
  'terrace-sofa': {
    id: 'terrace-sofa',
    roomId: 'terrace',
    name: 'Уличный диван Vale',
    category: 'Терраса',
    price: '$1,890',
    forwardSrc: '/assets/hero/terrace-sofa-forward.mp4',
    reverseSrc: '/assets/hero/terrace-sofa-reverse.mp4',
    focusSrc: '/assets/hero/terrace-sofa-focus.webp',
    playbackRate: 1,
    mediaClassName: 'is-terrace',
    hotspotClassName: 'evironn-hero-hotspot-terrace-sofa',
    href: null,
  },
};
