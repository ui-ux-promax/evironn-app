import { describe, expect, it } from 'vitest';
import {
  addProductToCart,
  dragHintForInput,
  PRODUCT_SCENE_CHAIRS,
  toggleAccordion,
  UPHOLSTERY_OPTIONS,
  WOOD_OPTIONS,
} from '../src/components/productPageState';
import {
  coalesceVideoSeek,
  pingPongPosition,
  videoTimeFromDrag,
} from '../src/components/productVideo360';

describe('product selectors and cart state', () => {
  it('keeps every upholstery and wood combination selectable', () => {
    expect(UPHOLSTERY_OPTIONS.every(({ disabled }) => !disabled)).toBe(true);
    expect(WOOD_OPTIONS.every(({ disabled }) => !disabled)).toBe(true);
    expect(
      Object.values(PRODUCT_SCENE_CHAIRS).flatMap(Object.values),
    ).toHaveLength(6);
  });

  it('toggles one accordion and increments local cart state', () => {
    expect(toggleAccordion(null, 'description')).toBe('description');
    expect(toggleAccordion('description', 'description')).toBeNull();
    expect(toggleAccordion('description', 'care')).toBe('care');
    expect(addProductToCart(3)).toBe(4);
  });

  it('uses touch-friendly drag instructions for coarse input', () => {
    expect(dragHintForInput({ isCoarse: false, maxTouchPoints: 0 })).toBe(
      'Потяни кресло мышью',
    );
    expect(dragHintForInput({ isCoarse: true, maxTouchPoints: 0 })).toBe(
      'Потяни кресло',
    );
  });
});

describe('product turntable state', () => {
  it('wraps horizontal drag through the video loop', () => {
    expect(videoTimeFromDrag(9.5, 180, 720, 10)).toBe(7);
    expect(videoTimeFromDrag(0.5, -180, 720, 10)).toBe(3);
  });

  it('coalesces pending seeks while the video is decoding', () => {
    expect(coalesceVideoSeek(true, 1.25, 4.5)).toEqual({
      shouldSeek: false,
      time: 4.5,
    });
    expect(coalesceVideoSeek(false, null, 4.5)).toEqual({
      shouldSeek: true,
      time: 4.5,
    });
  });

  it('normalizes a ping-pong cycle across both clips', () => {
    expect(pingPongPosition(0, 3)).toEqual({ clip: 'forward', time: 0 });
    expect(pingPongPosition(3, 3)).toEqual({ clip: 'reverse', time: 0 });
    expect(pingPongPosition(6, 3)).toEqual({ clip: 'forward', time: 0 });
  });
});
