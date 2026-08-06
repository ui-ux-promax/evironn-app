import { motion, useReducedMotion } from 'framer-motion';
import { Fragment } from 'react';
import { LuStretchHorizontal, LuTreePine, LuWallpaper } from 'react-icons/lu';
import { useRevealAnimation } from '../hooks/useRevealAnimation';
import './NatureSection.css';

type NatureBenefit = { label: string; icon: 'wood' | 'textile' | 'proportion' };
const benefits: NatureBenefit[] = [
  { label: 'Натуральное дерево', icon: 'wood' },
  { label: 'Тактильная обивка', icon: 'textile' },
  { label: 'Спокойные пропорции', icon: 'proportion' },
];
const natureHeading = 'Материалы, которые стареют красиво';
const viewport = { once: true, amount: 0.24 };

function NatureHeading({
  text,
  className,
  firstOrder,
}: {
  text: string;
  className: string;
  firstOrder: number;
}) {
  const reduceMotion = useReducedMotion();
  const words = text.split(' ');
  let characterIndex = 0;
  return (
    <h2 className={className}>
      {words.map((word, wordIndex) => (
        <Fragment key={`${word}-${wordIndex}`}>
          <span className="nature-heading-word">
            {Array.from(word).map((character) => {
              const index = characterIndex++;
              const variants = useRevealAnimation(
                undefined,
                (firstOrder + index) * 0.035,
              );
              return (
                <motion.span
                  className="nature-heading-character"
                  initial={reduceMotion ? false : 'hidden'}
                  key={`${character}-${index}`}
                  variants={variants}
                  viewport={viewport}
                  whileInView="visible"
                >
                  {character}
                </motion.span>
              );
            })}
          </span>
          {wordIndex < words.length - 1 && ' '}
        </Fragment>
      ))}
    </h2>
  );
}

function NatureBenefitIcon({ icon }: Pick<NatureBenefit, 'icon'>) {
  const icons = {
    wood: LuTreePine,
    textile: LuWallpaper,
    proportion: LuStretchHorizontal,
  };
  const IconComponent = icons[icon];
  return (
    <span className="nature-benefit-icon" aria-hidden="true">
      <IconComponent focusable="false" strokeWidth={1.8} />
    </span>
  );
}

export function NatureSection() {
  return (
    <section
      className="nature-section"
      aria-labelledby="nature-heading-primary"
    >
      <div className="nature-container">
        <div className="nature-panel">
          <img
            className="nature-background"
            src="/assets/furniture/materials-room-wide.png"
            alt="Светлая гостиная с дубовым столом и плетёным креслом"
          />
          <div className="nature-scrim" aria-hidden="true" />
          <div className="nature-content">
            <div className="nature-intro">
              <div className="nature-heading" aria-label={natureHeading}>
                <NatureHeading
                  className="nature-heading-primary"
                  firstOrder={0}
                  text="Материалы,"
                />
                <NatureHeading
                  className="nature-heading-secondary"
                  firstOrder={12}
                  text="которые стареют красиво"
                />
              </div>
              <p className="nature-copy">
                Материалы задают ритм комнате: дерево добавляет тепло, ткань —
                мягкость, а выверенные пропорции оставляют пространство для
                жизни.
              </p>
            </div>
            <ul className="nature-benefits">
              {benefits.map(({ label, icon }) => (
                <li className="nature-benefit" key={label}>
                  <NatureBenefitIcon icon={icon} />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
