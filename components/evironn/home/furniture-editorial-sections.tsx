import { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { catalogCategoryPath } from '@/components/evironn/public-routes';

type Category = {
  label: string;
  href: string;
  hoverVariant: number;
  image?: { src: string; alt: string; className: string };
};
const MotionLink = motion(Link);
const categories: Category[] = [
  {
    label: 'Диваны',
    href: catalogCategoryPath('sofas'),
    hoverVariant: 1,
    image: {
      src: '/assets/editorial/images/category-sofa.png',
      alt: 'Светлый диван букле в интерьере',
      className: 'furniture-category-image--sofa',
    },
  },
  {
    label: 'Приставные столики',
    href: catalogCategoryPath('chairs'),
    hoverVariant: 2,
    image: {
      src: '/assets/editorial/images/category-console.png',
      alt: 'Дубовая консоль со скульптурным светильником',
      className: 'furniture-category-image--sidetables',
    },
  },
  { label: 'Кресла', href: catalogCategoryPath('armchairs'), hoverVariant: 3 },
  {
    label: 'Столы',
    href: catalogCategoryPath('chairs'),
    hoverVariant: 4,
    image: {
      src: '/assets/editorial/images/category-reading-chair.png',
      alt: 'Плетёное кресло в светлом интерьере',
      className: 'furniture-category-image--tables',
    },
  },
  { label: 'Гардеробные', href: catalogCategoryPath('chairs'), hoverVariant: 5 },
  {
    label: 'Кровати',
    href: catalogCategoryPath('chairs'),
    hoverVariant: 6,
    image: {
      src: '/assets/editorial/images/category-bedside.png',
      alt: 'Прикроватная тумба в спальне',
      className: 'furniture-category-image--beds',
    },
  },
];

function CategoryRow({ category, index }: { category: Category; index: number }) {
  const reduceMotion = useReducedMotion();
  return (
    <MotionLink
      className={`furniture-category-row furniture-category-row--${index + 1} furniture-category-link furniture-category-link--${category.hoverVariant}`}
      href={category.href}
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      transition={{ duration: 0.6, delay: 0.12, ease: [0.44, 0, 0.56, 1] }}
      viewport={{ once: true, margin: '0px 0px -8% 0px' }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      {category.image && index === 1 && (
        <img
          className={`furniture-category-image ${category.image.className}`}
          src={category.image.src}
          alt={category.image.alt}
        />
      )}
      <h2>
        <span className="furniture-category-label">{category.label}</span>
      </h2>
      {category.image && index !== 1 && (
        <img
          className={`furniture-category-image ${category.image.className}`}
          src={category.image.src}
          alt={category.image.alt}
        />
      )}
    </MotionLink>
  );
}

export function FurnitureCategorySection() {
  return (
    <section className="furniture-category-section" id="what-we-do">
      <div className="furniture-category-content">
        <div className="furniture-category-list">
          {categories.map((category, index) => (
            <CategoryRow category={category} index={index} key={category.label} />
          ))}
        </div>
      </div>
    </section>
  );
}

const textRevealVariants = {
  hidden: { opacity: 0, y: 40, filter: 'blur(12px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring' as const, duration: 2.4, bounce: 0 } },
};

export function FurnitureWorksParallax() {
  const sectionRef = useRef<HTMLElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const section = sectionRef.current;
    const layer = layerRef.current;
    if (!section || !layer || reduceMotion) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const progress = Math.min(
        1,
        Math.max(0, -section.getBoundingClientRect().top / section.getBoundingClientRect().height),
      );
      layer.style.transform = `translateY(${-420 + 420 * progress}px)`;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [reduceMotion]);

  return (
    <section className="furniture-works-parallax" id="our-works-header" ref={sectionRef}>
      <div className="furniture-works-parallax__background" ref={layerRef} aria-hidden="true">
        <img src="/assets/editorial/images/71c2b8589fc6.png" alt="" />
        <div className="furniture-works-parallax__scrim" />
      </div>
      <div className="furniture-works-parallax__content">
        <motion.div
          className="furniture-works-parallax__text"
          initial={reduceMotion ? false : 'hidden'}
          whileInView="visible"
          viewport={{ once: true, amount: 0.18 }}
          variants={textRevealVariants}
        >
          <div className="furniture-works-parallax__layout">
            <div>
              <p>Наши интерьеры</p>
              <h2>Пространство для жизни</h2>
            </div>
            <h3>Мебельные решения, в которых свет, фактура и спокойные формы работают вместе.</h3>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
