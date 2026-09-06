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
    <main id="main-content">
      <Hero />
      <FurnitureCategorySection />
      <InteractiveFurnitureCards />
      <EditorialStatement />
      <NatureSection />
      <BenefitsShowcaseSection />
      <FurnitureWorksParallax />
      <InstagramFollowSection />
    </main>
  );
}
