import type { DemoStatusSlice } from '@/lib/demo-admin/types';

const radius = 52;
const circumference = 2 * Math.PI * radius;

export function DemoDonut({ slices }: { slices: readonly DemoStatusSlice[] }) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  let offset = 0;
  return (
    <div className="demo-admin-donut">
      <svg viewBox="0 0 140 140" role="img" aria-label="Заказы по статусам">
        <circle className="demo-admin-donut-track" cx="70" cy="70" r={radius} />
        {slices.map((slice) => {
          const dash = total === 0 ? 0 : (slice.value / total) * circumference;
          const currentOffset = offset;
          offset += dash;
          return (
            <circle
              className={'demo-admin-donut-arc is-' + slice.status.toLowerCase()}
              key={slice.status}
              cx="70"
              cy="70"
              r={radius}
              strokeDasharray={dash + ' ' + circumference}
              strokeDashoffset={-currentOffset}
            />
          );
        })}
        <text className="demo-admin-donut-value" x="70" y="67">
          {total}
        </text>
        <text className="demo-admin-donut-caption" x="70" y="86">
          заказов
        </text>
      </svg>
      <ul className="demo-admin-donut-legend">
        {slices.map((slice) => (
          <li key={slice.status}>
            <span>{slice.label}</span>
            <strong>{slice.value}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
