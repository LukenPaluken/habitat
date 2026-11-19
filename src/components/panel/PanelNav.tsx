import { Bell } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { usePanel } from "./PanelContext";

const LINKS = [
  { href: "/panel/propiedades", label: "Mis propiedades" },
  { href: "/panel/visitas", label: "Visitas" },
  { href: "/panel/consultas", label: "Consultas" },
  { href: "/panel/actividad", label: "Actividad", showsBadge: true },
  { href: "/panel/reportes", label: "Reportes" },
  { href: "/panel/inmobiliaria", label: "Mi inmobiliaria" },
];

/** The panel's navigation: marks the section you are in and counts what is unread. */
export function PanelNav() {
  const pathname = usePathname();
  const { unreadCount } = usePanel();

  return (
    // Its own scroll container: seven links never make the page scroll sideways.
    <nav
      aria-label="Panel del vendedor"
      className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0"
    >
      <ul className="flex min-w-max gap-1 border-b border-slate-200">
        {LINKS.map(({ href, label, showsBadge }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "-mb-px flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "border-brand-600 text-brand-800"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                )}
              >
                {label}
                {showsBadge && unreadCount > 0 && (
                  <span
                    aria-label={`${unreadCount} sin leer`}
                    className="inline-flex min-w-5 items-center justify-center gap-0.5 rounded-full bg-red-600 px-1.5 text-xs font-bold text-white"
                  >
                    <Bell aria-hidden className="size-3" />
                    {unreadCount}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
