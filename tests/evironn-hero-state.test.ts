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
  completeHeroRoomPreparation,
  completeHeroRoomTransition,
  dismissHeroRoomError,
  failHeroRoomPreparation,
  isAvailableHeroRoom,
  isHeroRoomTransitioning,
  recoverHeroRoomTransition,
  restartHeroRoomPreparation,
  requestHeroRoom,
} from '@/components/evironn/home/hero-room-state';
import {
  createHeroCardContainerVariants,
  createHeroCardItemVariants,
} from '@/components/evironn/home/hero-product-motion';
import { HERO_PRODUCTS } from '@/components/evironn/home/hero-products';
import { HERO_ROOMS } from '@/components/evironn/home/hero-rooms';
import { selectHeroVideoSource } from '@/components/evironn/home/hero-product-media';

describe('Evironn hero pure state', () => {
  it('bootstraps living room before accepting a kitchen request', () => {
    expect(INITIAL_HERO_ROOM_STATE).toEqual({
      activeRoom: 'living-room',
      targetRoom: 'living-room',
      phase: 'preparing',
      direct: false,
      operationId: 0,
      error: null,
    });

    const ready = completeHeroRoomPreparation(INITIAL_HERO_ROOM_STATE, 0);
    expect(ready).toEqual({
      activeRoom: 'living-room',
      targetRoom: null,
      phase: 'idle',
      direct: false,
      operationId: 0,
      error: null,
    });
    expect(requestHeroRoom(INITIAL_HERO_ROOM_STATE, 'kitchen', true)).toBe(INITIAL_HERO_ROOM_STATE);

    const changing = requestHeroRoom(ready, 'kitchen', true);
    expect(changing).toEqual({
      activeRoom: 'living-room',
      targetRoom: 'kitchen',
      phase: 'changing',
      direct: false,
      operationId: 1,
      error: null,
    });
    expect(requestHeroRoom(changing, 'living-room', true)).toBe(changing);
    expect(isHeroRoomTransitioning(changing)).toBe(true);
    expect(isHeroRoomTransitioning(INITIAL_HERO_ROOM_STATE)).toBe(false);
    expect(requestHeroRoom(ready, 'kitchen', true, true, 1).direct).toBe(true);
  });

  it('commits and recovers room transitions without losing the outgoing stable room', () => {
    const ready = completeHeroRoomPreparation(INITIAL_HERO_ROOM_STATE, 0);
    const changing = requestHeroRoom(ready, 'kitchen', true, false, 1);
    expect(completeHeroRoomTransition(changing)).toEqual({
      activeRoom: 'kitchen',
      targetRoom: null,
      phase: 'idle',
      direct: false,
      operationId: 1,
      error: null,
    });
    expect(recoverHeroRoomTransition(changing)).toEqual({ ...ready, operationId: 1 });
  });

  it('waits for the matching complete kitchen bundle', () => {
    const ready = completeHeroRoomPreparation(INITIAL_HERO_ROOM_STATE, 0);
    const pending = requestHeroRoom(ready, 'kitchen', false, false, 1);
    expect(pending.phase).toBe('preparing');
    expect(pending.activeRoom).toBe('living-room');
    expect(completeHeroRoomPreparation(pending, 0)).toBe(pending);
    expect(completeHeroRoomPreparation(pending, 1).phase).toBe('changing');
    expect(requestHeroRoom(ready, 'bedroom', true)).toBe(ready);
    expect(requestHeroRoom(ready, 'terrace', true)).toBe(ready);
  });

  it('supports same-room preparation retry with monotonic operation IDs', () => {
    const ready = completeHeroRoomPreparation(INITIAL_HERO_ROOM_STATE, 0);
    const retry = requestHeroRoom(ready, 'living-room', false, false, 1);

    expect(retry).toEqual({
      activeRoom: 'living-room',
      targetRoom: 'living-room',
      phase: 'preparing',
      direct: false,
      operationId: 1,
      error: null,
    });
    expect(requestHeroRoom(retry, 'kitchen', true, false, 1)).toBe(retry);
    expect(requestHeroRoom(retry, 'kitchen', true, false, 0)).toBe(retry);
    expect(requestHeroRoom(retry, 'kitchen', true, false, 2)).toBe(retry);
  });

  it('ignores stale preparation callbacks after a motion restart', () => {
    const ready = completeHeroRoomPreparation(INITIAL_HERO_ROOM_STATE, 0);
    const pending = requestHeroRoom(ready, 'kitchen', false, true, 1);
    const restarted = restartHeroRoomPreparation(pending, 2);

    expect(restarted).toEqual({ ...pending, phase: 'preparing', operationId: 2 });
    expect(completeHeroRoomPreparation(restarted, 1)).toBe(restarted);
    expect(failHeroRoomPreparation(restarted, 1, 'Late failure')).toBe(restarted);
    expect(completeHeroRoomPreparation(restarted, 2).phase).toBe('changing');
    expect(restartHeroRoomPreparation(restarted, 2)).toBe(restarted);
  });

  it('dismisses failed kitchen on living selection and ignores stale completion', () => {
    const ready = completeHeroRoomPreparation(INITIAL_HERO_ROOM_STATE, 0);
    const pending = requestHeroRoom(ready, 'kitchen', false, false, 1);
    const failed = failHeroRoomPreparation(pending, 1, 'Kitchen failed');
    expect(failed).toEqual({
      activeRoom: 'living-room',
      targetRoom: null,
      phase: 'error',
      direct: false,
      operationId: 1,
      error: { room: 'kitchen', message: 'Kitchen failed' },
    });
    expect(requestHeroRoom(failed, 'living-room', true)).toBe(failed);
    const dismissed = dismissHeroRoomError(failed, 'living-room', true);
    expect(dismissed).toEqual({
      activeRoom: 'living-room',
      targetRoom: null,
      phase: 'idle',
      direct: false,
      operationId: 2,
      error: null,
    });
    expect(completeHeroRoomPreparation(dismissed, 1)).toBe(dismissed);
    expect(failHeroRoomPreparation(dismissed, 1, 'Late failure')).toBe(dismissed);
    const retry = requestHeroRoom(dismissed, 'kitchen', false, false, 3);
    expect(retry.phase).toBe('preparing');
    expect(completeHeroRoomPreparation(retry, 1)).toBe(retry);
    const changing = completeHeroRoomPreparation(retry, 3);
    expect(changing.phase).toBe('changing');
    expect(completeHeroRoomTransition(changing).activeRoom).toBe('kitchen');

    expect(dismissHeroRoomError(failed, 'living-room', false)).toBe(failed);
    expect(dismissHeroRoomError(failed, 'kitchen', true)).toBe(failed);
    expect(dismissHeroRoomError(ready, 'living-room', true)).toBe(ready);
  });

  it('retries failed preparation and accepts an alternate pilot room from error', () => {
    const ready = completeHeroRoomPreparation(INITIAL_HERO_ROOM_STATE, 0);
    const failedKitchen = failHeroRoomPreparation(
      requestHeroRoom(ready, 'kitchen', false, false, 1),
      1,
      'Kitchen failed',
    );

    const retry = requestHeroRoom(failedKitchen, 'kitchen', false, false, 2);
    expect(retry).toEqual({
      activeRoom: 'living-room',
      targetRoom: 'kitchen',
      phase: 'preparing',
      direct: false,
      operationId: 2,
      error: null,
    });
    expect(requestHeroRoom(failedKitchen, 'living-room', true, false, 2)).toBe(failedKitchen);
    expect(requestHeroRoom(failedKitchen, 'bedroom', true, false, 2)).toBe(failedKitchen);

    const failedLiving = failHeroRoomPreparation(
      requestHeroRoom(ready, 'living-room', false, false, 1),
      1,
      'Living failed',
    );
    const alternate = requestHeroRoom(failedLiving, 'kitchen', true, false, 2);
    expect(alternate).toEqual({
      activeRoom: 'living-room',
      targetRoom: 'kitchen',
      phase: 'changing',
      direct: false,
      operationId: 2,
      error: null,
    });
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
    expect(HERO_PRODUCTS['terrace-sofa'].forward.mp4).toBe('/assets/hero/terrace-sofa-forward.mp4');
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
      expect(product.forward.webm).toMatch(/^\/assets\/hero\/.*-forward\.webm$/);
      expect(product.forward.mp4).toMatch(/^\/assets\/hero\/.*-forward\.mp4$/);
      expect(product.reverse.webm).toMatch(/^\/assets\/hero\/.*-reverse\.webm$/);
      expect(product.reverse.mp4).toMatch(/^\/assets\/hero\/.*-reverse\.mp4$/);
      expect(product.focusSrc).toMatch(/^\/assets\/hero\/.*-focus\.webp$/);
      expect(product.href).toBe('/product/noma-woven-lounge?option=finish%3Awalnut%2Cupholstery%3Aivory-boucle');
    }
  });

  it('maps every hero direction to its exact WebM and MP4 production pair', () => {
    const expected = [
      'bedroom-bed-forward',
      'bedroom-bed-reverse',
      'bedroom-chair-forward',
      'bedroom-chair-reverse',
      'chair-forward',
      'chair-reverse',
      'kitchen-dining-forward',
      'kitchen-dining-reverse',
      'kitchen-island-forward',
      'kitchen-island-reverse',
      'sofa-forward',
      'sofa-reverse',
      'terrace-chair-forward',
      'terrace-chair-reverse',
      'terrace-sofa-forward',
      'terrace-sofa-reverse',
    ];
    const actual = Object.values(HERO_PRODUCTS).flatMap((product) => [
      `${product.forward.webm}|${product.forward.mp4}`,
      `${product.reverse.webm}|${product.reverse.mp4}`,
    ]);

    expect(actual.sort()).toEqual(
      expected.map((basename) => `/assets/hero/${basename}.webm|/assets/hero/${basename}.mp4`).sort(),
    );
    expect(actual.some((pair) => pair.includes('/assets/products/'))).toBe(false);
  });

  it('selects WebM only when browser reports VP9 support', () => {
    const sources = { webm: '/assets/hero/sofa-forward.webm', mp4: '/assets/hero/sofa-forward.mp4' };
    const canPlayType = (mime: string) => {
      expect(mime).toBe('video/webm; codecs="vp9"');
      return 'probably';
    };

    expect(selectHeroVideoSource(sources, canPlayType)).toEqual({ format: 'webm', src: sources.webm });
    expect(selectHeroVideoSource(sources, () => 'maybe')).toEqual({ format: 'webm', src: sources.webm });
    expect(selectHeroVideoSource(sources, () => '')).toEqual({ format: 'mp4', src: sources.mp4 });
    expect(selectHeroVideoSource({ webm: '', mp4: sources.mp4 }, () => 'probably')).toEqual({
      format: 'mp4',
      src: sources.mp4,
    });
  });

  it('limits runtime room availability to the living room and kitchen pilot', () => {
    expect(isAvailableHeroRoom('living-room')).toBe(true);
    expect(isAvailableHeroRoom('kitchen')).toBe(true);
    expect(isAvailableHeroRoom('bedroom')).toBe(false);
    expect(isAvailableHeroRoom('terrace')).toBe(false);
  });
});
