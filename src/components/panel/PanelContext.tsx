import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { useFetch } from "@/hooks/useFetch";
import { usePolling } from "@/hooks/usePolling";
import { getJson } from "@/lib/api/client";
import { OWN_AGENCY_URL, type OwnAgencyResponse } from "@/lib/api/agencies";
import {
  UNREAD_COUNT_URL,
  type UnreadCountResponse,
} from "@/lib/api/activities";
import type { OwnAgency } from "@/types/api";

const UNREAD_POLL_MS = 15_000;

interface PanelValue {
  /** The seller's agency (the "datos del vendedor" every panel screen needs). */
  agency: OwnAgency;
  reloadAgency: () => void;
  /** Notifications not read yet: the number in the navigation. */
  unreadCount: number;
  /** Asks the API for the number again (after reading or on a timer). */
  refreshUnread: () => void;
  logout: () => void;
}

const PanelContext = createContext<PanelValue | null>(null);

export function usePanel(): PanelValue {
  const value = useContext(PanelContext);
  if (!value) throw new Error("usePanel must be used inside <PanelProvider>");
  return value;
}

/**
 * Loads the seller's agency once and keeps the unread counter fresh. The
 * counter is polled on an interval that belongs to this component: it stops
 * the moment the seller leaves the panel or logs out.
 */
export function PanelProvider({
  logout,
  children,
}: {
  logout: () => void;
  children: React.ReactNode;
}) {
  const { data, error, reload } = useFetch<OwnAgencyResponse>(OWN_AGENCY_URL);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnread = useCallback(() => {
    getJson<UnreadCountResponse>(UNREAD_COUNT_URL)
      .then(({ data: { unreadCount: count } }) => setUnreadCount(count))
      .catch(() => {
        // A failed refresh keeps the last number; the next tick tries again.
      });
  }, []);

  useEffect(() => {
    refreshUnread();
  }, [refreshUnread]);
  usePolling(refreshUnread, UNREAD_POLL_MS);

  if (error) {
    return (
      <ErrorState
        title="No pudimos cargar tu inmobiliaria"
        message={
          error.status === 403
            ? "Tu cuenta no tiene una inmobiliaria asociada."
            : error.message
        }
        onRetry={reload}
      />
    );
  }
  if (!data) return <LoadingState label="Cargando tu panel…" />;

  return (
    <PanelContext.Provider
      value={{
        agency: data.data,
        reloadAgency: reload,
        unreadCount,
        refreshUnread,
        logout,
      }}
    >
      {children}
    </PanelContext.Provider>
  );
}
