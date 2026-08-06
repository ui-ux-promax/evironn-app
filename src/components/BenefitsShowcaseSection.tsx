import { motion, useReducedMotion } from 'framer-motion';
import { Fragment, type ReactNode } from 'react';
import { LuBadgeCheck, LuHammer, LuHeart, LuLayers3 } from 'react-icons/lu';
import { useRevealAnimation } from '../hooks/useRevealAnimation';
import './BenefitsShowcaseSection.css';

const craftsmanshipHeading = 'Мебель для жизни, не для витрины';
const checklist = [
  { label: 'Точная посадка', icon: 'badge' },
  { label: 'Продуманная конструкция', icon: 'layers' },
  { label: 'Комфорт каждый день', icon: 'heart' },
] as const;
const viewport = { once: true, amount: 0.24 };
const standardTransition = {
  type: 'tween' as const,
  duration: 0.4,
  ease: [0.44, 0, 0.56, 1] as const,
};
const benefitIcons = {
  badge: LuBadgeCheck,
  hammer: LuHammer,
  heart: LuHeart,
  layers: LuLayers3,
} as const;
type IconName = keyof typeof benefitIcons;

function Icon({ name }: { name: IconName }) {
  const IconComponent = benefitIcons[name];
  return (
    <IconComponent
      aria-hidden="true"
      className={`benefit-icon benefit-icon-${name}`}
      strokeWidth={1.8}
    />
  );
}

function RevealWord({ word, order }: { word: string; order: number }) {
  const reduceMotion = useReducedMotion();
  const animation = useRevealAnimation(undefined, order * 0.12);
  return (
    <motion.span
      className="benefits-showcase-word"
      initial={reduceMotion ? 'visible' : 'hidden'}
      whileInView="visible"
      viewport={viewport}
      variants={animation}
    >
      {word}
    </motion.span>
  );
}

function RevealLine({
  className,
  id,
  words,
  orderStart,
}: {
  className: string;
  id?: string;
  words: string[];
  orderStart: number;
}) {
  return (
    <h2 className={className} id={id}>
      {words.map((word, index) => (
        <Fragment key={word}>
          <RevealWord order={orderStart + index} word={word} />
          {index < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </h2>
  );
}

function RevealMedia({
  children,
  className,
  final = {},
  initial,
}: {
  children: ReactNode;
  className: string;
  final?: { rotate?: number };
  initial: {
    opacity?: number;
    x?: number;
    y?: number;
    scale?: number;
    rotate?: number;
  };
}) {
  if (
    className === 'benefit-materials-product-reveal' ||
    className === 'benefit-standards-product-reveal'
  ) {
    return (
      <FooterRevealMedia className={className} rotate={initial.rotate ?? 0}>
        {children}
      </FooterRevealMedia>
    );
  }
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : initial}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1, rotate: 0, ...final }}
      viewport={viewport}
      transition={standardTransition}
    >
      {children}
    </motion.div>
  );
}

function FooterRevealMedia({
  children,
  className,
  rotate = 0,
}: {
  children: ReactNode;
  className: string;
  rotate?: number;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={
        reduceMotion
          ? false
          : { opacity: 0, y: 40, filter: 'blur(12px)', rotate }
      }
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)', rotate: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ type: 'spring', duration: 2.4, bounce: 0 }}
    >
      {children}
    </motion.div>
  );
}

export function BenefitsShowcaseSection() {
  return (
    <section
      aria-labelledby="benefits-showcase-title-primary"
      className="benefits-showcase"
    >
      <div className="benefits-showcase-container">
        <header className="benefits-showcase-header">
          <div className="benefits-showcase-title">
            <RevealLine
              className="benefits-showcase-title-primary"
              id="benefits-showcase-title-primary"
              orderStart={0}
              words={['Мебель', 'для', 'жизни,']}
            />
            <RevealLine
              className="benefits-showcase-title-secondary"
              orderStart={3}
              words={['не', 'для', 'витрины']}
            />
          </div>
          <p className="benefits-showcase-intro">{craftsmanshipHeading}</p>
        </header>
        <div className="benefits-showcase-grid">
          <article className="benefit-story">
            <RevealMedia
              className="benefit-story-video-reveal"
              initial={{ scale: 1.1 }}
            >
              <img
                className="benefit-story-video"
                src="/assets/furniture/craftsmanship-wide.png"
                alt="Работа мастера над деревянной деталью мебели"
              />
            </RevealMedia>
            <div aria-hidden="true" className="benefit-story-scrim" />
            <RevealMedia
              className="benefit-story-quote"
              initial={{ opacity: 0, y: 30 }}
            >
              <Icon name="hammer" />
              <div className="benefit-story-quote-copy">
                <h3>Точная работа с материалом</h3>
                <p>
                  Каждая линия и соединение остаются на виду, чтобы мебель
                  красиво служила годами.
                </p>
              </div>
            </RevealMedia>
          </article>
          <div className="benefits-showcase-side">
            <article className="benefit-materials">
              <div className="benefit-materials-copy">
                <Icon name="layers" />
                <div>
                  <h3>Продуманная конструкция</h3>
                  <p>
                    Удобные детали, спокойные формы и материалы, которые приятно
                    трогать каждый день.
                  </p>
                </div>
              </div>
              <RevealMedia
                className="benefit-materials-product-reveal"
                initial={{ opacity: 0, y: 36, x: 24, scale: 0.94 }}
              >
                <img
                  alt="Кресло из светлой мебельной ткани"
                  className="benefit-materials-product"
                  src="/assets/products/03-ivory-lounge-cutout.png"
                />
              </RevealMedia>
            </article>
            <article className="benefit-standards">
              <RevealMedia
                className="benefit-standards-product-reveal"
                final={{ rotate: 0 }}
                initial={{ opacity: 0, y: 36, x: -24, rotate: -8, scale: 0.94 }}
              >
                <img
                  alt="Барный стул с мягким сиденьем"
                  className="benefit-standards-product"
                  src="/assets/products/01-bar-stool-cutout.png"
                />
              </RevealMedia>
              <div className="benefit-standards-copy">
                <h3>Комфорт каждый день</h3>
                <ul className="benefit-checklist">
                  {checklist.map(({ label, icon }) => (
                    <li key={label}>
                      <Icon name={icon} />
                      <span>{label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
