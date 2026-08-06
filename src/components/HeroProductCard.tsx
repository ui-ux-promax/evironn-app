import { AnimatePresence, motion } from 'framer-motion';
import {
  createHeroCardContainerVariants,
  createHeroCardItemVariants,
} from './heroProductMotion';
import { HeroProductCaption } from './HeroProductCaption';
import type { HeroProduct } from './heroProducts';

type HeroProductCardProps = {
  product: HeroProduct | null;
  visible: boolean;
  locked: boolean;
  reducedMotion: boolean;
  onBack: () => void;
};

export function HeroProductCard({
  product,
  visible,
  locked,
  reducedMotion,
  onBack,
}: HeroProductCardProps) {
  const container = createHeroCardContainerVariants(reducedMotion);
  const item = createHeroCardItemVariants(reducedMotion);

  return (
    <AnimatePresence>
      {visible && product ? (
        <motion.aside
          key={product.id}
          className={`furni-hero-product furni-hero-product--${product.id}`}
          aria-label={product.name}
          variants={container}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <motion.button
            className="furni-hero-product__back"
            type="button"
            onClick={onBack}
            disabled={locked}
            variants={item}
          >
            <span aria-hidden="true">←</span> Назад
          </motion.button>
          <motion.div className="furni-hero-product__card" variants={item}>
            <HeroProductCaption product={product} />
          </motion.div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
