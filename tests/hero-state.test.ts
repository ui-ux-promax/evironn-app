import { describe, expect, it } from 'vitest';
import {
  cancelHeroProduct,
  completeHeroForward,
  completeHeroReturn,
  getHeroProduct,
  isHeroTransitioning,
  selectHeroProduct,
  startHeroReturn,
} from '../src/components/heroProductState';
import {
  completeHeroRoomTransition,
  INITIAL_HERO_ROOM_STATE,
  isAvailableHeroRoom,
  isHeroRoomTransitioning,
  recoverHeroRoomTransition,
  requestHeroRoom,
} from '../src/components/heroRoomState';

describe('hero product state', () => {
  it('moves each product through enter, active, return, and idle phases', () => {
    for (const product of [
      'sofa',
      'chair',
      'kitchen-dining',
      'bedroom-bed',
      'terrace-chair',
    ] as const) {
      const entering = selectHeroProduct('idle', product);
      const active = completeHeroForward(entering);
      const returning = startHeroReturn(active);

      expect(getHeroProduct(returning)).toBe(product);
      expect(completeHeroReturn(returning)).toBe('idle');
    }
  });

  it('blocks competing product input and cancels focus for room changes', () => {
    expect(selectHeroProduct('entering-sofa', 'chair')).toBe('entering-sofa');
    expect(cancelHeroProduct('returning-sofa')).toBe('idle');
    expect(isHeroTransitioning('entering-chair')).toBe(true);
    expect(isHeroTransitioning('chair')).toBe(false);
  });
});

describe('hero room state', () => {
  it('starts only ready room transitions and commits on completion', () => {
    expect(requestHeroRoom(INITIAL_HERO_ROOM_STATE, 'kitchen', false)).toEqual(
      INITIAL_HERO_ROOM_STATE,
    );
    const changing = requestHeroRoom(INITIAL_HERO_ROOM_STATE, 'bedroom', true);

    expect(isHeroRoomTransitioning(changing)).toBe(true);
    expect(completeHeroRoomTransition(changing)).toEqual({
      activeRoom: 'bedroom',
      targetRoom: null,
      phase: 'idle',
      direct: false,
    });
    expect(recoverHeroRoomTransition(changing)).toEqual(
      INITIAL_HERO_ROOM_STATE,
    );
  });

  it('recognizes all four approved room scenes', () => {
    for (const room of [
      'living-room',
      'kitchen',
      'bedroom',
      'terrace',
    ] as const) {
      expect(isAvailableHeroRoom(room)).toBe(true);
    }
  });
});
