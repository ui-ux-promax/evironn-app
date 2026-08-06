import type { ReactNode } from 'react';
import { PrototypeFooter } from './PrototypeFooter';
import { PrototypeHeader } from './PrototypeHeader';

export interface PrototypeShellProps {
  readonly activePath?: string;
  readonly children: ReactNode;
}

export function PrototypeShell({ activePath, children }: PrototypeShellProps) {
  return (
    <div className="evp-shell">
      <PrototypeHeader activePath={activePath} />
      <main className="evp-shell__main">{children}</main>
      <PrototypeFooter />
    </div>
  );
}
