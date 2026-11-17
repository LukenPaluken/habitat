"use client";

import { useState } from "react";
import Link from "next/link";
import { errorMessage } from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatRelative } from "@/lib/format";
import { activityApi } from "@/lib/seller-api";
import type { ApiActivity } from "@/lib/seller-types";
import { useQuery } from "@/lib/use-query";
import { Button } from "@/components/ui/button";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState, ErrorState, RowsSkeleton } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { useSeller } from "./seller-shell";

const PAGE_SIZE = 15;

type Filter = "all" | "unread";

// Cada tipo de novedad tiene su pantalla; las reseñas se leen en la página
// pública de la inmobiliaria, así que no hay a dónde llevar.
const KIND: Record<
  ApiActivity["type"],
  { label: string; href: string | null }
> = {
  new_comment: { label: "Consulta", href: "/vendedor/consultas" },
  new_visit: { label: "Visita", href: "/vendedor/visitas" },
  property_state_change: { label: "Estado", href: "/vendedor/propiedades" },
  new_review: { label: "Reseña", href: null },
};

export function ActivityView() {
  const toast = useToast();
  const { unreadCount, refreshUnread } = useSeller();

  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const [markingAll, setMarkingAll] = useState(false);

  const query = useQuery(`${filter}|${page}`, () =>
    activityApi.list({ page, limit: PAGE_SIZE, unread: filter === "unread" })
  );
  const items = query.data?.data ?? [];
  const meta = query.data?.meta;

  async function markRead(activity: ApiActivity) {
    if (activity.isRead) return;
    try {
      await activityApi.markRead(activity.id);
      await Promise.all([query.reload(), refreshUnread()]);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function markAll() {
    setMarkingAll(true);
    try {
      await activityApi.markAllRead();
      await Promise.all([query.reload(), refreshUnread()]);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <>
      <PageHeader
        kicker="Panel del vendedor"
        title="Actividad"
        actions={
          <Button
            variant="outline"
            size="sm"
            loading={markingAll}
            disabled={unreadCount === 0}
            onClick={markAll}
          >
            Marcar todas como leídas
          </Button>
        }
      >
        {unreadCount > 0
          ? `Tenés ${unreadCount} ${unreadCount === 1 ? "novedad sin leer" : "novedades sin leer"}.`
          : "Estás al día: no hay novedades sin leer."}
      </PageHeader>

      <FilterTabs
        label="Filtrar novedades"
        value={filter}
        options={[
          { value: "all", label: "Todas" },
          { value: "unread", label: "Sin leer", count: unreadCount },
        ]}
        onChange={(next) => {
          setFilter(next);
          setPage(1);
        }}
      />

      {query.loading ? (
        <RowsSkeleton rows={4} className="border-t-0" />
      ) : query.error && !query.data ? (
        <div className="mt-6">
          <ErrorState message={query.error} onRetry={query.reload} />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title={
            filter === "unread"
              ? "No hay novedades sin leer"
              : "Todavía no hay actividad"
          }
        >
          {filter === "unread"
            ? "Cuando llegue algo nuevo, lo vas a ver acá y en el contador del menú."
            : "Las consultas, visitas, reseñas y cambios de estado van a aparecer en este listado."}
        </EmptyState>
      ) : (
        <>
          <ul
            className={cn(
              "divide-y divide-rule border-b border-rule transition-opacity",
              query.refreshing && "opacity-60"
            )}
          >
            {items.map((activity) => {
              const kind = KIND[activity.type];
              const body = (
                <>
                  <span className="kicker block">{kind.label}</span>
                  <span
                    className={cn(
                      "mt-1 block leading-snug",
                      activity.isRead ? "text-graphite" : "font-medium text-ink"
                    )}
                  >
                    {activity.content}
                  </span>
                </>
              );

              return (
                <li key={activity.id} className="flex items-start gap-4 py-4">
                  <span
                    aria-label={activity.isRead ? "Leída" : "Sin leer"}
                    className={cn(
                      "mt-[7px] size-2 shrink-0",
                      activity.isRead ? "border border-rule-strong" : "bg-brick"
                    )}
                  />

                  {kind.href ? (
                    <Link
                      href={kind.href}
                      onClick={() => void markRead(activity)}
                      className="min-w-0 flex-1 hover:underline hover:decoration-rule-strong hover:underline-offset-4"
                    >
                      {body}
                    </Link>
                  ) : (
                    <div className="min-w-0 flex-1">{body}</div>
                  )}

                  <div className="flex shrink-0 flex-col items-end gap-1.5 text-right">
                    <span className="font-mono text-xs text-stone">
                      {formatRelative(activity.createdAt)}
                    </span>
                    {!activity.isRead && (
                      <button
                        type="button"
                        onClick={() => void markRead(activity)}
                        className="text-xs text-graphite underline decoration-rule-strong underline-offset-4 hover:text-ink hover:decoration-ink"
                      >
                        Marcar leída
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          <Pagination
            page={page}
            totalPages={meta?.totalPages ?? 1}
            onChange={setPage}
          />
        </>
      )}
    </>
  );
}
