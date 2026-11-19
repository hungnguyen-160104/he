import {
  BookOpen,
  CheckSquare,
  FileText,
  FolderTree,
  History,
  Home,
  LayoutDashboard,
  ListChecks,
  PencilLine,
  Scale,
  ShieldCheck,
  Trophy,
  User,
  Users,
  type LucideProps,
} from "lucide-react";
import type { NavIconName } from "./nav-config";

const ICONS = {
  home: Home,
  book: BookOpen,
  file: FileText,
  trophy: Trophy,
  pencil: PencilLine,
  history: History,
  user: User,
  layout: LayoutDashboard,
  list: ListChecks,
  check: CheckSquare,
  users: Users,
  folder: FolderTree,
  shield: ShieldCheck,
  scale: Scale,
} satisfies Record<NavIconName, React.ComponentType<LucideProps>>;

export function NavIcon({ name, ...props }: { name: NavIconName } & LucideProps) {
  const Icon = ICONS[name];
  return <Icon aria-hidden="true" {...props} />;
}
