import { describe, expect, it } from 'vitest';

import {
  HERO_CARD_REVEAL_PROGRESS,
  cancelHeroProduct,
  completeHeroForward,
  completeHeroReturn,
  getHeroProduct,
  isHeroTransitioning,
  recoverHeroMediaFailure,
  selectHeroProduct,
  shouldRevealHeroProduct,
  startHeroReturn,
} from '@/components/evironn/home/hero-product-state';
import {
  INITIAL_HERO_ROOM_STATE,
  completeHeroRoomTransition,
  isAvailableHeroRoom,
  isHeroRoomTransitioning,
  recoverHeroRoomTransition,
  requestHeroRoom,
} from '@/components/evironn/home/hero-room-state';
import {
  createHeroCardContainerVariants,
  createHeroCardItemVariants,
} from '@/components/evironn/home/hero-product-motion';
import { HERO_PRODUCTS } from '@/components/evironn/home/hero-products';
import { HERO_ROOMS } from '@/components/evironn/home/hero-rooms';

describe('Evironn hero pure state', () => {
  it('starts only a ready available room transition and locks competing input', () => {
    expect(requestHeroRoom(INITIAL_HERO_ROOM_STATE, 'kitchen', false)).toEqual(INITIAL_HERO_ROOM_STATE);
    const changing = requestHeroRoom(INITIAL_HERO_ROOM_STATE, 'kitchen', true);
    expect(changing).toEqual({ activeRoom: 'living-room', targetRoom: 'kitchen', phase: 'changing', direct: false });
    expect(requestHeroRoom(changing, 'living-room', true)).toEqual(changing);
    expect(isHeroRoomTransitioning(changing)).toBe(true);
    expect(requestHeroRoom(INITIAL_HERO_ROOM_STATE, 'kitchen', true, true).direct).toBe(true);
  });

  it('commits and recovers room transitions without losing the outgoing stable room', () => {
    const changing = requestHeroRoom(INITIAL_HERO_ROOM_STATE, 'bedroom', true);
    expect(completeHeroRoomTransition(changing)).toEqual({
      activeRoom: 'bedroom',
      targetRoom: null,
      phase: 'idle',
      direct: false,
    });
    expect(recoverHeroRoomTransition(changing)).toEqual(INITIAL_HERO_ROOM_STATE);
  });

  it('preserves product phases, failure recovery, and reveal timing', () => {
    expect(selectHeroProduct('idle', 'sofa')).toBe('entering-sofa');
    expect(selectHeroProduct('entering-sofa', 'chair')).toBe('entering-sofa');
    expect(completeHeroForward('entering-sofa')).toBe('sofa');
    expect(startHeroReturn('sofa')).toBe('returning-sofa');
    expect(completeHeroReturn('returning-sofa')).toBe('idle');
    expect(cancelHeroProduct('returning-sofa')).toBe('idle');
    expect(recoverHeroMediaFailure('returning-chair')).toBe('chair');
    expect(getHeroProduct('idle')).toBeNull();
    expect(getHeroProduct('returning-bedroom-bed')).toBe('bedroom-bed');
    expect(isHeroTransitioning('entering-chair')).toBe(true);
    expect(isHeroTransitioning('chair')).toBe(false);
    expect(HERO_CARD_REVEAL_PROGRESS).toBe(0.72);
    expect(shouldRevealHeroProduct(4.31, 6)).toBe(false);
    expect(shouldRevealHeroProduct(4.32, 6)).toBe(true);
    expect(shouldRevealHeroProduct(1, 0)).toBe(false);
  });

  it('keeps clone product and room registries data-driven with production destinations', () => {
    expect(HERO_ROOMS['living-room'].productIds).toEqual(['chair', 'sofa']);
    expect(HERO_ROOMS.kitchen.productIds).toEqual(['kitchen-dining', 'kitchen-island']);
    expect(HERO_ROOMS.bedroom.productIds).toEqual(['bedroom-chair', 'bedroom-bed']);
    expect(HERO_ROOMS.terrace.productIds).toEqual(['terrace-chair', 'terrace-sofa']);
    expect(HERO_ROOMS['living-room'].idleSrc).toBe('/assets/hero/living-room-idle-5f0f1836.webp');
    expect(HERO_PRODUCTS['kitchen-island'].playbackRate).toBe(1.2);
    expect(HERO_PRODUCTS['kitchen-island'].href).toBe(
      '/product/noma-woven-lounge?option=finish%3Awalnut%2Cupholstery%3Aivory-boucle',
    );
    expect(HERO_PRODUCTS['bedroom-bed'].href).toBe(
      '/product/noma-woven-lounge?option=finish%3Awalnut%2Cupholstery%3Aivory-boucle',
    );
    expect(HERO_PRODUCTS['terrace-sofa'].forwardSrc).toBe('/assets/hero/terrace-sofa-forward.mp4');
  });

  it('removes spatial motion variants when reduced motion is requested', () => {
    expect(createHeroCardContainerVariants(true)).toEqual({
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0 } },
      exit: { opacity: 0, transition: { duration: 0 } },
    });
    expect(createHeroCardItemVariants(true)).toEqual({
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0 } },
    });
  });

  it('keeps every hero media map and production route adapter explicit', () => {
    for (const product of Object.values(HERO_PRODUCTS)) {
      expect(product.forwardSrc).toMatch(/^\/assets\/hero\/.*-forward\.mp4$/);
      expect(product.reverseSrc).toMatch(/^\/assets\/hero\/.*-reverse\.mp4$/);
      expect(product.focusSrc).toMatch(/^\/assets\/hero\/.*-focus\.webp$/);
      expect(product.href).toBe('/product/noma-woven-lounge?option=finish%3Awalnut%2Cupholstery%3Aivory-boucle');
    }
  });

  it('recognizes all four available rooms', () => {
    expect(isAvailableHeroRoom('living-room')).toBe(true);
    expect(isAvailableHeroRoom('kitchen')).toBe(true);
    expect(isAvailableHeroRoom('bedroom')).toBe(true);
    expect(isAvailableHeroRoom('terrace')).toBe(true);
  });
});
