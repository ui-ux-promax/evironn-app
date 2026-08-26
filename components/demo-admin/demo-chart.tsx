import { useId } from 'react';
import type { DemoRevenuePoint } from '@/lib/demo-admin/types';

function pathFor(points: readonly DemoRevenuePoint[], width: number, height: number): string {
  if (points.length === 0) return 'M0 95 L640 95';
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const range = Math.max(...values) - min || 1;
  return points
    .map((point, index) => {
      const x = points.length === 1 ? width / 2 : (width * index) / (points.length - 1);
      const y = height - ((point.value - min) / range) * (height - 12) - 6;
      return (index === 0 ? 'M' : 'L') + x.toFixed(2) + ' ' + y.toFixed(2);
    })
    .join(' ');
}

export function DemoChart({ points }: { points: readonly DemoRevenuePoint[] }) {
  const gradientId = useId();
  return (
    <div className="demo-admin-chart">
      <svg viewBox="0 0 640 190" role="img" aria-label="Выручка по дням" preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop className="demo-admin-chart-stop-top" offset="0%" />
            <stop className="demo-admin-chart-stop-bottom" offset="100%" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((ratio) => (
          <line key={ratio} className="demo-admin-chart-grid" x1="0" x2="640" y1={190 * ratio} y2={190 * ratio} />
        ))}
        <path className="demo-admin-chart-line" d={pathFor(points, 640, 190)} />
      </svg>
      <div className="demo-admin-chart-labels" aria-hidden="true">
        {points.map((point) => (
          <span key={point.label}>{point.label}</span>
        ))}
      </div>
    </div>
  );
}
