export function DemoIcon({ name, filled = false }: { name: string; filled?: boolean }) {
  return (
    <span className={'demo-admin-icon material-symbols-outlined' + (filled ? ' fill' : '')} aria-hidden="true">
      {name}
    </span>
  );
}
