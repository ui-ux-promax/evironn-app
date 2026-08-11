import { cn } from '@/lib/utils';
import type { Trend } from '@/lib/admin/analytics';

type KpiTone = 'revenue' | 'orders' | 'average';

const TONE_STYLE: Record<KpiTone, { line: string; fill: string }> = {
  revenue: { line: '#ff8d6a', fill: '#ff8d6a' },
  orders: { line: '#f2c94c', fill: '#f2c94c' },
  average: { line: '#ff6d63', fill: '#ff6d63' },
};

function buildSparkline(series: number[]) {
  const values = series.length > 0 ? series : [0];
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const range = maximum - minimum;
  const points = values.map((value, index) => ({
    x: values.length === 1 ? 70 : 4 + (132 * index) / (values.length - 1),
    y: range === 0 ? 32 : 56 - ((value - minimum) / range) * 48,
    value,
  }));
  const peak = points.reduce((highest, point) => (point.value > highest.value ? point : highest));
  const line = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ');

  return { line, area: `${line} L136 60 L4 60 Z`, peak };
}

export function KpiCard({
  label,
  value,
  trend,
  tone,
  series,
}: {
  label: string;
  value: string;
  trend: Trend;
  tone: KpiTone;
  series: number[];
}) {
  const style = TONE_STYLE[tone];
  const sparkline = buildSparkline(series);
  const gradientId = `kpi-${tone}-fill`;
  const filterId = `kpi-${tone}-glow`;

  return (
    <article
      className="relative grid min-h-[154px] grid-cols-[minmax(0,1fr)_132px] items-center gap-[18px] overflow-hidden rounded-[28px] border border-white/[.055] p-[26px] pb-[22px] text-white shadow-[0_22px_60px_hsl(var(--color-text)/.26)] max-[520px]:grid-cols-1 max-[520px]:gap-3"
      style={{
        background:
          'radial-gradient(circle at 92% 18%, hsl(var(--color-accent) / .18), transparent 122px), linear-gradient(180deg, hsl(var(--color-primary-foreground) / .045), transparent), hsl(224 9% 15%)',
      }}
    >
      <div className="relative z-[1] min-w-0">
        <span className="mb-2 block text-base font-bold tracking-[-.015em] text-white/[.84]">{label}</span>
        <strong className="block font-admin-head text-[clamp(34px,3.6vw,46px)] font-extrabold leading-[.94] tracking-[-.055em] tabular-nums">
          {value}
        </strong>
        <TrendBadge trend={trend} />
      </div>
      <svg
        className="relative z-[1] h-[62px] w-[132px] self-end max-[520px]:h-[68px] max-[520px]:w-full"
        viewBox="0 0 140 64"
        aria-hidden="true"
      >
        <defs>
          <filter id={filterId} x="-20%" y="-40%" width="140%" height="180%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={style.fill} stopOpacity=".58" />
            <stop offset="1" stopColor={style.fill} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={sparkline.area} fill={`url(#${gradientId})`} opacity=".9" />
        <path
          d={sparkline.line}
          fill="none"
          stroke={style.line}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#${filterId})`}
        />
        <circle cx={sparkline.peak.x} cy={sparkline.peak.y} r="3.6" fill="white" opacity=".92" />
      </svg>
    </article>
  );
}

function TrendBadge({ trend }: { trend: Trend }) {
  if (trend.pct === null) {
    return (
      <span className="mt-3 inline-flex min-h-[26px] items-center rounded-full bg-[#15d3a2]/20 px-[10px] text-sm font-extrabold text-[#15d3a2]">
        Новое
      </span>
    );
  }
  if (trend.dir === 'flat') {
    return (
      <span className="mt-3 inline-flex min-h-[26px] items-center rounded-full bg-white/10 px-[10px] text-sm font-extrabold text-white/70">
        Без изменений
      </span>
    );
  }
  const up = trend.dir === 'up';
  return (
    <span
      className={cn(
        'mt-3 inline-flex min-h-[26px] items-center rounded-full px-[10px] text-sm font-extrabold',
        up ? 'bg-[#15d3a2]/20 text-[#15d3a2]' : 'bg-[#ff6d63]/20 text-[#ff6d63]',
      )}
    >
      {up ? '↗ +' : '↘ '}
      {trend.pct}%
    </span>
  );
}
