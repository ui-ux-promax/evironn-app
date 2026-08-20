import { expect, test } from 'vitest';

import { coalesceVideoSeek, pingPongPosition, videoTimeFromDrag } from '../components/evironn/product/productVideo360';

test('rotates the chair in the same direction as a horizontal drag', () => {
  expect(videoTimeFromDrag(1.5, 180, 720, 3)).toBe(0.75);
  expect(videoTimeFromDrag(1.5, -720, 720, 3)).toBe(1.5);
  expect(videoTimeFromDrag(1.5, 720, 720, 3)).toBe(1.5);
});

test('wraps horizontal drag around the turntable loop', () => {
  expect(videoTimeFromDrag(2.5, 720, 720, 10)).toBe(2.5);
  expect(videoTimeFromDrag(9.5, 180, 720, 10)).toBe(7);
  expect(videoTimeFromDrag(0.5, -180, 720, 10)).toBe(3);
});

test('coalesces a drag seek while video decodes', () => {
  expect(coalesceVideoSeek(true, 1.25, 4.5)).toEqual({
    shouldSeek: false,
    time: 4.5,
  });
  expect(coalesceVideoSeek(false, null, 4.5)).toEqual({
    shouldSeek: true,
    time: 4.5,
  });
});

test('normalizes a ping-pong cycle across forward and reverse clips', () => {
  expect(pingPongPosition(0, 3)).toEqual({ clip: 'forward', time: 0 });
  expect(pingPongPosition(3, 3)).toEqual({ clip: 'reverse', time: 0 });
  expect(pingPongPosition(6, 3)).toEqual({ clip: 'forward', time: 0 });
});
