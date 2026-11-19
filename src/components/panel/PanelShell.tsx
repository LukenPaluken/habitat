"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingState } from "@/components/ui/States";
import { useAuth } from "@/hooks/useAuth";
import { isLoggingOut, logoutSeller } from "@/lib/api/auth";
import { setUnauthorizedHandler } from "@/lib/api/client";
import { loginUrlFor } from "@/lib/auth-redirect";
import { PanelNav } from "./PanelNav";
import { PanelProvider } from "./PanelContext";

/**
 * Wraps every `/panel/*` page: nobody gets in without a session (they are sent
 * to the login and brought back here afterwards), and the seller's data and
 * navigation are loaded once for all the screens.
 *
 * This guard is only for the experience: whoever protects the data is the API,
 * which answers 401 without a session.
 */
export function PanelShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // No session: to the login, remembering where they were going.
  useEffect(() => {
    if (!isLoading && !user && !isLoggingOut()) {
      router.replace(loginUrlFor(pathname));
    }
  }, [isLoading, user, pathname, router]);

  // The API says 401 (an expired session): clear it here too, so the login
  // doesn't believe it is still valid and bounce back, then go there.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (isLoggingOut()) return; // already handling it
      logoutSeller()
        .catch(() => {})
        .finally(() => router.replace(loginUrlFor(pathname)));
    });
    return () => setUnauthorizedHandler(undefined);
  }, [pathname, router]);

  if (isLoading || !user)
    return <LoadingState label="Verificando tu sesión…" />;

  return (
    <PanelProvider logout={() => void logout()}>
      <div className="space-y-6">
        <PanelNav />
        {children}
      </div>
    </PanelProvider>
  );
}
