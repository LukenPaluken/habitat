"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";

const LINKS = [
  { href: "/seller/properties", label: "Mis propiedades" },
  { href: "/seller/visits", label: "Visitas" },
  { href: "/seller/inquiries", label: "Consultas" },
  { href: "/seller/activity", label: "Actividad" },
  { href: "/seller/reports", label: "Reportes" },
] as const;

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg
        viewBox="0 0 24 24"
        aria-hidden
        className="size-5 text-brick"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="miter"
      >
        <path d="M3 11.5 12 3.5l9 8V21H3z" />
        <path d="M10 21v-6h4v6" />
      </svg>
      <span className="font-serif text-[1.6rem] font-medium leading-none tracking-tight">
        Habitat
      </span>
    </span>
  );
}

export function SellerNav({
  agencyName,
  unreadCount,
  onSignOut,
}: {
  agencyName?: string;
  unreadCount: number;
  onSignOut: () => void;
}) {
  const pathname = usePathname();

  return (
    <header className="border-b border-ink bg-sheet">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center px-4 sm:px-6">
        <Link
          href="/seller/properties"
          aria-label="Habitat, panel del vendedor"
          className="order-1 py-4"
        >
          <Wordmark />
        </Link>

        <div className="order-2 ml-auto flex items-center gap-3 md:order-3">
          {agencyName && (
            <span className="hidden max-w-[14rem] truncate text-[13px] text-stone sm:block">
              {agencyName}
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={onSignOut}>
            Salir
          </Button>
        </div>

        <nav
          aria-label="Secciones del panel"
          className="no-scrollbar order-3 -mx-4 flex w-[calc(100%+2rem)] gap-6 overflow-x-auto px-4 sm:-mx-6 sm:w-[calc(100%+3rem)] sm:px-6 md:order-2 md:mx-0 md:ml-10 md:w-auto md:flex-1 md:px-0"
        >
          {LINKS.map((link) => {
            const active = pathname.startsWith(link.href);
            const isActivity = link.href === "/seller/activity";
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 border-b-2 py-3.5 text-sm transition-colors md:py-[1.45rem]",
                  active
                    ? "border-ink font-medium text-ink"
                    : "border-transparent text-stone hover:text-ink"
                )}
              >
                {link.label}
                {isActivity && unreadCount > 0 && (
                  <span className="bg-brick px-1.5 font-mono text-[11px] leading-[18px] text-sheet">
                    {unreadCount > 99 ? "99+" : unreadCount}
                    <span className="sr-only"> sin leer</span>
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
