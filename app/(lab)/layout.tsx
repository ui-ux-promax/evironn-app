import '@/styles/evironn/header-lab/lab.css';
import '@/styles/evironn/header-lab/variant-1.css';
import '@/styles/evironn/header-lab/variant-2.css';
import '@/styles/evironn/header-lab/variant-3.css';
import '@/styles/evironn/header-lab/variant-4.css';
import '@/styles/evironn/header-lab/variant-5.css';
import '@/styles/evironn/header-lab/variant-6.css';
import '@/styles/evironn/header-lab/switcher.css';

// Preview-only route group: renders a candidate header instead of the approved
// storefront chrome, so the five explorations can be compared on real content.
export default function HeaderLabLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
