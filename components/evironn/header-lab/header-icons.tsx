type IconProps = { className?: string };

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.4,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
} as const;

export function BagIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M6.4 8h11.2l.9 11.1a1.6 1.6 0 0 1-1.6 1.7H7.1a1.6 1.6 0 0 1-1.6-1.7L6.4 8Z" />
      <path d="M9.2 10.6V6.9a2.8 2.8 0 0 1 5.6 0v3.7" />
    </svg>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="11" cy="11" r="5.6" />
      <path d="m15.3 15.3 4 4" />
    </svg>
  );
}

export function UserIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="8.6" r="3.5" />
      <path d="M5.5 20c.7-3.4 3.3-5.3 6.5-5.3s5.8 1.9 6.5 5.3" />
    </svg>
  );
}

export function ChevronIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="m9.5 6 6 6-6 6" />
    </svg>
  );
}

export function ArrowIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M5 12h14M13.2 5.6 19.6 12l-6.4 6.4" />
    </svg>
  );
}

export function EvironnMarkIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} viewBox="0 0 72 72">
      <path d="M36 14C22.745 14 12 24.745 12 38s10.745 24 24 24c8.774 0 16.447-4.71 20.635-11.735" />
      <path d="M23 28h29M23 38h23M23 48h29" />
    </svg>
  );
}
