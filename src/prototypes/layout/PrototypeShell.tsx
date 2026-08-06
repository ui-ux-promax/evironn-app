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
      <a className="evp-skip-link" href="#prototype-main">
        Skip to content
      </a>
      <PrototypeHeader activePath={activePath} />
      <main className="evp-shell__main" id="prototype-main" tabIndex={-1}>
        {children}
      </main>
      <PrototypeFooter />
    </div>
  );
}
