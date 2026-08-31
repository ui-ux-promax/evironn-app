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
import type { HomeVideoMode } from '@/components/evironn/home/video-ab';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const videoMode: HomeVideoMode = params['video-ab'] === 'poster' ? 'poster-only' : 'control';

  return (
    <>
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[300] focus:rounded-full focus:bg-black focus:px-4 focus:py-3 focus:text-sm focus:text-white"
        href="#main-content"
      >
        Перейти к содержимому
      </a>
      <main id="main-content" tabIndex={-1}>
        {videoMode === 'poster-only' ? <Hero videoMode={videoMode} /> : <Hero />}
        <FurnitureCategorySection />
        {videoMode === 'poster-only' ? (
          <InteractiveFurnitureCards videoMode={videoMode} />
        ) : (
          <InteractiveFurnitureCards />
        )}
        <EditorialStatement />
        <NatureSection />
        <BenefitsShowcaseSection />
        <FurnitureWorksParallax />
        <InstagramFollowSection />
      </main>
    </>
  );
}
