import livingRoomImage from '../assets/evironn-hero-room.png';
import type { HeroProductId } from './heroProductState';
import type { AvailableHeroRoomId, HeroRoomId } from './heroRoomState';

export type HeroRoomOption = {
  id: HeroRoomId;
  label: string;
  available: boolean;
};

export type HeroRoom = {
  id: AvailableHeroRoomId;
  label: string;
  idleSrc: string;
  mediaClassName: string;
  productIds: HeroProductId[];
};

export const HERO_ROOM_OPTIONS: HeroRoomOption[] = [
  { id: 'living-room', label: 'ГОСТИНАЯ', available: true },
  { id: 'kitchen', label: 'КУХНЯ', available: true },
  { id: 'bedroom', label: 'СПАЛЬНЯ', available: true },
  { id: 'terrace', label: 'ТЕРРАСА', available: true },
];

export const HERO_ROOMS: Record<AvailableHeroRoomId, HeroRoom> = {
  'living-room': {
    id: 'living-room',
    label: 'ГОСТИНАЯ',
    idleSrc: livingRoomImage,
    mediaClassName: 'is-living-room is-mirrored',
    productIds: ['chair', 'sofa'],
  },
  kitchen: {
    id: 'kitchen',
    label: 'КУХНЯ',
    idleSrc: '/assets/hero/kitchen-idle.jpg',
    mediaClassName: 'is-kitchen',
    productIds: ['kitchen-dining', 'kitchen-island'],
  },
  bedroom: {
    id: 'bedroom',
    label: 'СПАЛЬНЯ',
    idleSrc: '/assets/hero/bedroom-idle.jpg',
    mediaClassName: 'is-bedroom',
    productIds: ['bedroom-chair', 'bedroom-bed'],
  },
  terrace: {
    id: 'terrace',
    label: 'ТЕРРАСА',
    idleSrc: '/assets/hero/terrace-idle.jpg',
    mediaClassName: 'is-terrace',
    productIds: ['terrace-chair', 'terrace-sofa'],
  },
};
