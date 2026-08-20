import { Hero } from '@/components/evironn/home/hero';
import {
  FurnitureCategorySection,
  InteractiveFurnitureCards,
  EditorialStatement,
  NatureSection,
  BenefitsShowcaseSection,
  FurnitureWorksParallax,
  InstagramFollowSection,
} from '@/components/evironn/home';

export default function HomePage() {
  return (
    <>
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[300] focus:rounded-full focus:bg-black focus:px-4 focus:py-3 focus:text-sm focus:text-white"
        href="#main-content"
      >
        Перейти к содержимому
      </a>
      <main id="main-content" tabIndex={-1}>
        <Hero />
        <FurnitureCategorySection />
        <InteractiveFurnitureCards />
        <EditorialStatement />
        <NatureSection />
        <BenefitsShowcaseSection />
        <FurnitureWorksParallax />
        <InstagramFollowSection />
      </main>
    </>
  );
}
