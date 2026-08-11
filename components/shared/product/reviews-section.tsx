import Link from 'next/link';
import { RatingStars } from './rating-stars';
import { ReviewList, type ReviewItem } from './review-list';
import { ReviewForm } from './review-form';

type Props = {
  productId: string;
  avg: number;
  count: number;
  reviews: ReviewItem[];
  state: 'eligible' | 'guest' | 'not-purchased' | 'already-reviewed';
};

export function ReviewsSection({ productId, avg, count, reviews, state }: Props) {
  return (
    <section id="reviews">
      {/* Reviews card — like prototype .reviews */}
      <div className="border border-line rounded-[24px] bg-surface p-[22px]">
        {/* Header — .rev-head */}
        <div className="flex items-center justify-between gap-3 mb-1.5">
          <h3 className="font-display font-bold text-[18px] tracking-tight">
            Отзывы {count > 0 && <span className="text-ink-muted font-normal">({count})</span>}
          </h3>
          {count > 0 && (
            <a href="#reviews" className="text-ink-muted text-[13px] hover:text-ink transition-colors">
              Смотреть все
            </a>
          )}
        </div>

        {/* Review list — .rev-card items */}
        <ReviewList reviews={reviews} />

        {/* Review form / login hint */}
        {state === 'eligible' ? (
          <div className="mt-5 pt-5 border-t border-line">
            <ReviewForm productId={productId} />
          </div>
        ) : state === 'guest' ? (
          <div className="mt-5 pt-5 border-t border-line text-center">
            <p className="text-[13px] text-ink-muted">
              <Link href="/login" className="underline hover:text-ink">
                Войдите
              </Link>
              , чтобы оставить отзыв
            </p>
          </div>
        ) : state === 'not-purchased' ? (
          <div className="mt-5 pt-5 border-t border-line text-center">
            <p className="text-[13px] text-ink-muted">Отзыв можно оставить после покупки этого товара.</p>
          </div>
        ) : (
          <div className="mt-5 pt-5 border-t border-line text-center">
            <p className="text-[13px] text-ink-muted">Вы уже оставили отзыв на этот товар. Спасибо!</p>
          </div>
        )}
      </div>
    </section>
  );
}
