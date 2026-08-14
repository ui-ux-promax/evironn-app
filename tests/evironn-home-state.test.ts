import { describe, expect, it } from 'vitest';

import {
  CARD_PLAYBACK_RATE,
  getMediaLayerState,
  getReverseStartTime,
  requestMobileActivation,
} from '@/components/evironn/home/furniture-playback';
import { createFurnitureCaptionVariants, getCaptionOrder } from '@/components/evironn/home/furniture-caption-motion';

describe('Evironn furniture home playback contracts', () => {
  it('uses the three-second card playback rate and maps reverse playback proportionally', () => {
    expect(CARD_PLAYBACK_RATE).toBe(3);
    expect(getReverseStartTime(1.5, 3, 1)).toBe(0.5);
    expect(getReverseStartTime(99, 3, 1)).toBe(0);
    expect(getReverseStartTime(-1, 3, 1)).toBe(1);
  });

  it('queues a new mobile card while the current card reverses', () => {
    expect(requestMobileActivation({ activeIndex: null, pendingIndex: null, phase: 'idle' }, 2)).toEqual({
      activeIndex: 2,
      pendingIndex: null,
      phase: 'forward',
    });
    expect(requestMobileActivation({ activeIndex: 2, pendingIndex: null, phase: 'forward' }, 4)).toEqual({
      activeIndex: 2,
      pendingIndex: 4,
      phase: 'reverse',
    });
  });

  it('keeps idle and frozen fallback layers mutually exclusive until a video frame is ready', () => {
    expect(getMediaLayerState(false, 'idle')).toEqual({
      showIdleFrame: true,
      showFrozenFrame: false,
      showVideo: false,
    });
    expect(getMediaLayerState(false, 'frozen')).toEqual({
      showIdleFrame: false,
      showFrozenFrame: true,
      showVideo: false,
    });
    expect(getMediaLayerState(true, 'frozen')).toEqual({
      showIdleFrame: false,
      showFrozenFrame: false,
      showVideo: true,
    });
  });
});

describe('Evironn furniture captions', () => {
  it('preserves caption token order and disables motion timing when reduced motion is requested', () => {
    expect(getCaptionOrder('Noma Woven Lounge Chair')).toEqual({
      nameWords: ['Noma', 'Woven', 'Lounge', 'Chair'],
      categoryOrder: 4,
      priceOrder: 5,
    });
    expect(createFurnitureCaptionVariants(2, 0.36, false).visible).toMatchObject({
      transition: { duration: 0.4, delay: 0.48 },
    });
    expect(createFurnitureCaptionVariants(2, 0.36, true)).toEqual({
      hidden: { opacity: 0, y: 0, filter: 'blur(0px)', transition: { duration: 0, delay: 0 } },
      visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0, delay: 0 } },
    });
  });
});
