import { Armchair, Eye, LayoutDashboard, ShoppingBag, Store, Tag, UsersRound, type LucideIcon } from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  space_dashboard: LayoutDashboard,
  chair: Armchair,
  shopping_bag: ShoppingBag,
  group: UsersRound,
  local_offer: Tag,
  storefront: Store,
  visibility: Eye,
};

export function DemoIcon({ name, filled = false }: { name: string; filled?: boolean }) {
  const Icon = ICONS[name] ?? LayoutDashboard;

  return <Icon className="demo-admin-icon" aria-hidden="true" strokeWidth={filled ? 2.5 : 2} />;
}
