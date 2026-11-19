"use client";

import { Building2, LayoutDashboard, LogOut } from "lucide-react";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";

/** Logo on the left; on the right, the way into (or out of) the seller's panel. */
export function SiteHeader() {
  const { user, isLoading, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold tracking-tight text-brand-800"
        >
          <Building2 aria-hidden className="size-6 text-brand-600" />
          Habitat
        </Link>

        {/* Nothing until the session is known: no flash of the wrong button. */}
        {!isLoading &&
          (user ? (
            <div className="flex items-center gap-2">
              <Link href="/panel" className={buttonStyles("secondary", "sm")}>
                <LayoutDashboard aria-hidden className="size-4" />
                Mi panel
              </Link>
              <button
                type="button"
                onClick={() => void logout()}
                className={buttonStyles("ghost", "sm")}
              >
                <LogOut aria-hidden className="size-4" />
                <span className="hidden sm:inline">Salir</span>
                <span className="sr-only sm:hidden">Salir</span>
              </button>
            </div>
          ) : (
            <Link href="/login" className={buttonStyles("secondary", "sm")}>
              Ingresar como vendedor
            </Link>
          ))}
      </div>
    </header>
  );
}
