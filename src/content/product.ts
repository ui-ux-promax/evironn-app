import {
  PRODUCT_SCENE_BACKGROUND,
  PRODUCT_SCENE_CHAIRS,
} from '../components/productPageState';

export const productMedia = {
  roomBackground: PRODUCT_SCENE_BACKGROUND,
  chairLayers: Object.values(PRODUCT_SCENE_CHAIRS).flatMap((finish) =>
    Object.values(finish),
  ),
  turntableVideo:
    '/assets/products/05-graphite-walnut-lounge-chair-turntable-alpha.webm',
  turntablePoster:
    '/assets/products/05-graphite-walnut-lounge-chair-turntable-poster.png',
} as const;
