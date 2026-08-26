import type { ReactNode } from 'react';

function DemoIconGlyph({ name }: { name: string }): ReactNode {
  switch (name) {
    case 'space_dashboard':
      return (
        <>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </>
      );
    case 'chair':
      return (
        <>
          <path d="M7 11V7a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v4" />
          <path d="M5 11h14v4H5zM8 15v5M16 15v5" />
        </>
      );
    case 'shopping_bag':
      return <path d="M6 8h12l1 12H5L6 8Zm3 0V6a3 3 0 0 1 6 0v2" />;
    case 'group':
      return (
        <>
          <circle cx="9" cy="8" r="3" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M3.5 20a5.5 5.5 0 0 1 11 0M14 15a4.5 4.5 0 0 1 6.5 4" />
        </>
      );
    case 'local_offer':
      return <path d="m20 13-7 7-9-9V4h7l9 9ZM8 8h.01" />;
    case 'storefront':
      return (
        <>
          <path d="M4 10h16v10H4zM3 10l2-6h14l2 6" />
          <path d="M3 10a3 3 0 0 0 5 2 3 3 0 0 0 5 0 3 3 0 0 0 5 0 3 3 0 0 0 2-2" />
          <path d="M9 20v-5h6v5" />
        </>
      );
    case 'visibility':
      return (
        <>
          <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
          <circle cx="12" cy="12" r="2.5" />
        </>
      );
    default:
      return <circle cx="12" cy="12" r="8" />;
  }
}

export function DemoIcon({ name, filled = false }: { name: string; filled?: boolean }) {
  return (
    <svg
      className="demo-admin-icon"
      aria-hidden="true"
      focusable="false"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={filled ? 2.5 : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <DemoIconGlyph name={name} />
    </svg>
  );
}
