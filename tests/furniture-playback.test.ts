import { describe, expect, it } from 'vitest';
import {
  CARD_PLAYBACK_RATE,
  getMediaLayerState,
  getReverseStartTime,
  requestMobileActivation,
} from '../src/components/furniturePlayback';
import {
  CAPTION_DESKTOP_DELAY,
  createFurnitureCaptionVariants,
  getCaptionOrder,
} from '../src/components/furnitureCaptionMotion';

describe('featured furniture playback', () => {
  it('maps forward playback to the matching reverse frame', () => {
    expect(CARD_PLAYBACK_RATE).toBe(3);
    expect(getReverseStartTime(3, 3, 3)).toBe(0);
    expect(getReverseStartTime(0.75, 3, 3)).toBe(2.25);
  });

  it('queues a new mobile card while the active one reverses', () => {
    expect(
      requestMobileActivation(
        { activeIndex: 1, pendingIndex: null, phase: 'forward' },
        3,
      ),
    ).toEqual({ activeIndex: 1, pendingIndex: 3, phase: 'reverse' });
  });

  it('keeps a fallback frame visible until video data is ready', () => {
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
  });

  it('orders caption tokens and removes motion when requested', () => {
    expect(getCaptionOrder('Noma Woven Lounge Chair')).toEqual({
      nameWords: ['Noma', 'Woven', 'Lounge', 'Chair'],
      categoryOrder: 4,
      priceOrder: 5,
    });
    expect(CAPTION_DESKTOP_DELAY).toBe(0.36);
    expect(createFurnitureCaptionVariants(5, 0.46, true)).toEqual({
      hidden: {
        opacity: 0,
        y: 0,
        filter: 'blur(0px)',
        transition: { duration: 0, delay: 0 },
      },
      visible: {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        transition: { duration: 0, delay: 0 },
      },
    });
  });
});
