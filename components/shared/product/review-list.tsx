import { RatingStars } from './rating-stars';

export type ReviewItem = {
  id: string;
  rating: number;
  body: string | null;
  createdAt: Date;
  authorName: string;
};

// Deterministic avatar background color from name
const AVATAR_HUES = [
  'hsl(151 30% 38%)',
  'hsl(28 32% 46%)',
  'hsl(220 35% 40%)',
  'hsl(345 42% 52%)',
  'hsl(42 72% 48%)',
  'hsl(190 35% 38%)',
];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return AVATAR_HUES[Math.abs(hash) % AVATAR_HUES.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return parts[0][0] + parts[1][0];
  return parts[0].slice(0, 2);
}

export function ReviewList({ reviews }: { reviews: ReviewItem[] }) {
  if (reviews.length === 0) {
    return (
      <p className="text-ink-muted text-[13px] py-6 text-center">Пока нет отзывов. Будьте первым после покупки.</p>
    );
  }

  return (
    <div>
      {reviews.map((r, i) => (
        <div key={r.id} className={i === 0 ? 'pt-4' : 'pt-4 border-t border-line'}>
          {/* rev-top */}
          <div className="flex items-center gap-3">
            {/* rev-av */}
            <span
              className="w-[42px] h-[42px] shrink-0 rounded-full grid place-items-center font-display font-bold text-[15px] text-surface"
              style={{ backgroundColor: avatarColor(r.authorName) }}
            >
              {initials(r.authorName).toUpperCase()}
            </span>
            {/* rev-meta */}
            <div className="min-w-0">
              <b className="block text-[14px] font-bold">{r.authorName}</b>
              <span className="text-[12px] text-ink-muted">
                {r.createdAt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            {/* stars right */}
            <div className="ml-auto shrink-0">
              <RatingStars value={r.rating} size={14} />
            </div>
          </div>
          {/* rev-text */}
          {r.body && <p className="mt-2.5 text-ink-muted text-[13.5px] leading-[1.6]">{r.body}</p>}
        </div>
      ))}
    </div>
  );
}
