"use client";

import { CalendarX } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { useFetch } from "@/hooks/useFetch";
import { useHashTarget } from "@/hooks/useHashTarget";
import {
  receivedVisitsUrl,
  type ReceivedVisitsResponse,
} from "@/lib/api/visits";
import { groupBy } from "@/lib/group";
import { VISIT_FILTERS } from "@/lib/visit-actions";
import { cn } from "@/lib/utils";
import type { VisitStatus } from "@/types/api";
import { PageHeader } from "../PageHeader";
import { PropertyScope } from "../PropertyScope";
import { VisitCard } from "./VisitCard";

const PAGE_SIZE = 20;

/** The visits people asked for, grouped by property, to confirm or reject. */
export function VisitsScreen({ propertyId }: { propertyId?: string }) {
  // Coming from the feed, the visit may not be pending anymore: show them all.
  const [status, setStatus] = useState<VisitStatus | "">(
    propertyId ? "" : "Pendiente"
  );
  const [page, setPage] = useState(1);
  const { data, error, isLoading, reload } = useFetch<ReceivedVisitsResponse>(
    receivedVisitsUrl(status, page, PAGE_SIZE, propertyId)
  );
  const targetId = useHashTarget(Boolean(data));

  const groups = data
    ? groupBy(
        data.data,
        (v) => v.propertyId,
        (v) => v.propertyTitle
      )
    : [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Solicitudes de visita"
        description="Quien pide una visita deja su teléfono: llamalo o escribile para coordinar."
      />

      {propertyId && (
        <PropertyScope title={groups[0]?.title} clearHref="/panel/visitas" />
      )}

      <div
        role="group"
        aria-label="Filtrar por estado"
        className="flex flex-wrap gap-2"
      >
        {VISIT_FILTERS.map(({ label, value }) => (
          <Button
            key={label}
            size="sm"
            variant={status === value ? "primary" : "secondary"}
            aria-pressed={status === value}
            onClick={() => {
              setStatus(value);
              setPage(1);
            }}
          >
            {label}
          </Button>
        ))}
      </div>

      {error ? (
        <ErrorState
          title="No pudimos cargar las visitas"
          message={error.message}
          onRetry={reload}
        />
      ) : !data ? (
        <LoadingState label="Cargando visitas…" />
      ) : groups.length === 0 ? (
        <EmptyState
          icon={CalendarX}
          title={
            status === "Pendiente"
              ? "No tenés visitas pendientes"
              : "No hay solicitudes para mostrar"
          }
          description="Cuando alguien pida conocer una de tus propiedades la vas a ver acá."
        />
      ) : (
        <div
          aria-busy={isLoading}
          className={cn("space-y-6", isLoading && "opacity-60")}
        >
          {groups.map((group) => (
            <section
              key={group.key}
              aria-label={group.title}
              className="space-y-3"
            >
              <h2 className="text-lg font-semibold text-slate-900">
                {group.title}
              </h2>
              <ul className="grid gap-3 md:grid-cols-2">
                {group.items.map((visit) => (
                  <VisitCard
                    key={visit.id}
                    visit={visit}
                    highlighted={targetId === `visita-${visit.id}`}
                    onChanged={reload}
                  />
                ))}
              </ul>
            </section>
          ))}
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
