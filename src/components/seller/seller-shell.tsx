"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { ApiError, UNAUTHORIZED_EVENT, errorMessage } from "@/lib/api";
import { activityApi, agencyApi } from "@/lib/seller-api";
import type { ApiAgency } from "@/lib/seller-types";
import { Button } from "@/components/ui/button";
import { ErrorState, RowsSkeleton } from "@/components/ui/states";
import { SellerNav } from "./seller-nav";

// Guarda del panel + datos compartidos: quién es la inmobiliaria logueada y
// cuántas novedades tiene sin leer (el contador de la barra).

interface SellerContextValue {
  agency: ApiAgency;
  setAgency: (agency: ApiAgency) => void;
  unreadCount: number;
  refreshUnread: () => Promise<void>;
  signOut: () => Promise<void>;
}

const SellerContext = createContext<SellerContextValue | null>(null);

export function useSeller(): SellerContextValue {
  const value = useContext(SellerContext);
  if (!value) throw new Error("useSeller solo funciona dentro del panel");
  return value;
}

const UNREAD_POLL_MS = 30_000;

type Phase =
  | { name: "loading" }
  | { name: "ready"; agency: ApiAgency }
  | { name: "no-agency" }
  | { name: "error"; message: string };

export function SellerShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>({ name: "loading" });
  const [unreadCount, setUnreadCount] = useState(0);
  const leaving = useRef(false);

  const signOut = useCallback(async () => {
    if (leaving.current) return;
    leaving.current = true;
    try {
      await authClient.signOut();
    } catch {
      // Si falla, igual salimos: el servidor invalida la sesión vencida.
    }
    router.replace("/vendedor/login");
  }, [router]);

  // Cualquier pedido que vuelva con 401 (sesión vencida) nos saca al login.
  useEffect(() => {
    async function onUnauthorized() {
      if (leaving.current) return;
      leaving.current = true;
      try {
        await authClient.signOut();
      } catch {
        // ignorado a propósito
      }
      router.replace(`/vendedor/login?next=${encodeURIComponent(pathname)}`);
    }
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [router, pathname]);

  const loadAgency = useCallback(async () => {
    setPhase({ name: "loading" });
    try {
      const { data } = await agencyApi.get();
      setPhase({ name: "ready", agency: data });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return;
      if (error instanceof ApiError && error.status === 403) {
        setPhase({ name: "no-agency" });
        return;
      }
      setPhase({ name: "error", message: errorMessage(error) });
    }
  }, []);

  useEffect(() => {
    void loadAgency();
  }, [loadAgency]);

  const refreshUnread = useCallback(async () => {
    try {
      const { meta } = await activityApi.list({ limit: 1 });
      setUnreadCount(meta.unreadCount ?? 0);
    } catch {
      // El contador es accesorio: si falla no molestamos con un error.
    }
  }, []);

  const ready = phase.name === "ready";
  useEffect(() => {
    if (!ready) return;
    void refreshUnread();
    const timer = window.setInterval(refreshUnread, UNREAD_POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refreshUnread();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [ready, refreshUnread]);

  const agency = phase.name === "ready" ? phase.agency : null;

  const value = useMemo<SellerContextValue | null>(
    () =>
      agency
        ? {
            agency,
            setAgency: (next) => setPhase({ name: "ready", agency: next }),
            unreadCount,
            refreshUnread,
            signOut,
          }
        : null,
    [agency, unreadCount, refreshUnread, signOut]
  );

  return (
    <div className="min-h-dvh">
      <SellerNav
        agencyName={agency?.fantasyName}
        unreadCount={unreadCount}
        onSignOut={signOut}
      />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {phase.name === "loading" && <RowsSkeleton rows={3} />}

        {phase.name === "error" && (
          <ErrorState message={phase.message} onRetry={loadAgency} />
        )}

        {phase.name === "no-agency" && (
          <div className="mx-auto max-w-md border border-rule bg-sheet p-8 text-center">
            <h1 className="text-2xl">Tu cuenta no tiene inmobiliaria</h1>
            <p className="mt-3 text-sm text-stone">
              Este panel es para vendedores con una inmobiliaria registrada. Si
              eliminaste la tuya, vas a necesitar una cuenta nueva.
            </p>
            <Button variant="ink" className="mt-6" onClick={signOut}>
              Salir
            </Button>
          </div>
        )}

        {value && (
          <SellerContext.Provider value={value}>
            {children}
          </SellerContext.Provider>
        )}
      </main>
    </div>
  );
}
