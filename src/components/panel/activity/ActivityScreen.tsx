"use client";

import { BellOff, CheckCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { useFetch } from "@/hooks/useFetch";
import {
  activitiesUrl,
  markActivityRead,
  markAllActivitiesRead,
  type ActivitiesResponse,
} from "@/lib/api/activities";
import { cn } from "@/lib/utils";
import type { Activity } from "@/types/api";
import { PageHeader } from "../PageHeader";
import { usePanel } from "../PanelContext";
import { ActivityItem } from "./ActivityItem";

const PAGE_SIZE = 15;

/** The feed of news, newest first, with what is still unread highlighted. */
export function ActivityScreen() {
  const { agency, refreshUnread } = usePanel();
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [page, setPage] = useState(1);
  const { data, error, isLoading, reload } = useFetch<ActivitiesResponse>(
    activitiesUrl(onlyUnread, page, PAGE_SIZE)
  );

  // Reading something changes the list AND the number in the navigation.
  function refreshAll() {
    reload();
    refreshUnread();
  }

  function read(activity: Activity) {
    markActivityRead(activity.id).then(refreshAll, () => {});
  }

  function readAll() {
    markAllActivitiesRead().then(refreshAll, () => {});
  }

  const unread = data?.meta.unreadCount ?? 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Actividad"
        description={unread > 0 ? `${unread} sin leer` : "Estás al día."}
        action={
          unread > 0 && (
            <Button variant="secondary" size="sm" onClick={readAll}>
              <CheckCheck aria-hidden className="size-4" />
              Marcar todas como leídas
            </Button>
          )
        }
      />

      <div role="group" aria-label="Filtrar" className="flex gap-2">
        {[
          { label: "Todas", value: false },
          { label: "Sin leer", value: true },
        ].map(({ label, value }) => (
          <Button
            key={label}
            size="sm"
            variant={onlyUnread === value ? "primary" : "secondary"}
            aria-pressed={onlyUnread === value}
            onClick={() => {
              setOnlyUnread(value);
              setPage(1);
            }}
          >
            {label}
          </Button>
        ))}
      </div>

      {error ? (
        <ErrorState
          title="No pudimos cargar la actividad"
          message={error.message}
          onRetry={reload}
        />
      ) : !data ? (
        <LoadingState label="Cargando actividad…" />
      ) : data.data.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title={
            onlyUnread
              ? "No tenés novedades sin leer"
              : "Todavía no hay actividad"
          }
          description="Cada consulta, visita o reseña nueva aparece acá."
        />
      ) : (
        <div
          aria-busy={isLoading}
          className={cn("space-y-5", isLoading && "opacity-60")}
        >
          <ul className="space-y-2">
            {data.data.map((activity) => (
              <ActivityItem
                key={activity.id}
                activity={activity}
                agencyId={agency.id}
                onRead={read}
              />
            ))}
          </ul>
          <Pagination
            page={data.meta.page}
            totalPages={data.meta.totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
