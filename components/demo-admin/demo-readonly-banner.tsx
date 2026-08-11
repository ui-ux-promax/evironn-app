export function DemoReadonlyBanner() {
  return (
    <div
      role="status"
      data-testid="demo-readonly-banner"
      className="rounded-2xl border border-admin-outline-variant bg-admin-surface-high px-4 py-3 text-sm text-admin-on-surface"
    >
      <strong>Демо-режим.</strong> Здесь используются синтетические данные; изменение и удаление отключены.
    </div>
  );
}
