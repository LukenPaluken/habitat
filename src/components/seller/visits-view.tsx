"use client";

import { useState } from "react";
import Link from "next/link";
import { errorMessage } from "@/lib/api";
import { formatRelative, formatVisitDay, formatVisitTime } from "@/lib/format";
import { visitApi } from "@/lib/seller-api";
import {
  VISIT_STATUSES,
  type ApiVisit,
  type VisitRequestStatus,
} from "@/lib/seller-types";
import { useQuery } from "@/lib/use-query";
import { VisitStatusBadge } from "@/components/ui/badges";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm";
import { FilterTabs, type FilterOption } from "@/components/ui/filter-tabs";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState, ErrorState, RowsSkeleton } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";

const PAGE_SIZE = 10;

type Filter = "ALL" | VisitRequestStatus;

const PLURAL: Record<VisitRequestStatus, string> = {
  Pendiente: "Pendientes",
  Confirmada: "Confirmadas",
  Realizada: "Realizadas",
  Rechazada: "Rechazadas",
  Cancelada: "Canceladas",
};

const FILTERS: FilterOption<Filter>[] = [
  { value: "ALL", label: "Todas" },
  ...VISIT_STATUSES.map((status) => ({ value: status, label: PLURAL[status] })),
];

type Target = Exclude<VisitRequestStatus, "Pendiente">;

interface VisitAction {
  label: string;
  to: Target;
  variant: "ink" | "danger";
  confirm?: (visit: ApiVisit) => {
    title: string;
    description: string;
    confirmLabel: string;
  };
}

// Pendiente -> Confirmada -> Realizada; Rechazada/Cancelada mientras no termine.
function actionsFor(status: VisitRequestStatus): VisitAction[] {
  const reject: VisitAction = {
    label: "Rechazar",
    to: "Rechazada",
    variant: "danger",
    confirm: (visit) => ({
      title: `¿Rechazar la solicitud de ${visit.requesterName}?`,
      description: `La visita a “${visit.propertyTitle}” queda rechazada y no se puede reabrir.`,
      confirmLabel: "Rechazar",
    }),
  };
  const cancel: VisitAction = {
    label: "Cancelar visita",
    to: "Cancelada",
    variant: "danger",
    confirm: (visit) => ({
      title: `¿Cancelar la visita de ${visit.requesterName}?`,
      description: `La visita a “${visit.propertyTitle}” queda cancelada y no se puede reabrir.`,
      confirmLabel: "Cancelar visita",
    }),
  };

  switch (status) {
    case "Pendiente":
      return [{ label: "Confirmar", to: "Confirmada", variant: "ink" }, reject];
    case "Confirmada":
      return [
        { label: "Marcar realizada", to: "Realizada", variant: "ink" },
        cancel,
      ];
    default:
      return [];
  }
}

export function VisitsView() {
  const toast = useToast();
  const confirm = useConfirm();

  const [filter, setFilter] = useState<Filter>("ALL");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);

  const query = useQuery(`${filter}|${page}`, () =>
    visitApi.list({
      page,
      limit: PAGE_SIZE,
      status: filter === "ALL" ? undefined : filter,
    })
  );
  const items = query.data?.data ?? [];
  const meta = query.data?.meta;

  async function onAction(visit: ApiVisit, action: VisitAction) {
    if (action.confirm) {
      const accepted = await confirm({
        ...action.confirm(visit),
        tone: "danger",
      });
      if (!accepted) return;
    }

    setBusyId(visit.id);
    try {
      await visitApi.changeStatus(visit.id, action.to);
      toast.success(
        action.to === "Confirmada"
          ? `Visita confirmada. Coordiná con ${visit.requesterName} al ${visit.requesterPhone}.`
          : `Solicitud de ${visit.requesterName}: ${action.to.toLowerCase()}.`
      );
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusyId(null);
      void query.reload();
    }
  }

  return (
    <>
      <PageHeader kicker="Panel del vendedor" title="Solicitudes de visita">
        Cada pedido trae el teléfono de quien lo hizo: la coordinación se hace
        por llamada o WhatsApp, y acá dejás registrado el estado.
      </PageHeader>

      <FilterTabs
        label="Filtrar por estado"
        value={filter}
        options={FILTERS}
        onChange={(next) => {
          setFilter(next);
          setPage(1);
        }}
      />

      {query.loading ? (
        <RowsSkeleton rows={3} className="border-t-0" />
      ) : query.error && !query.data ? (
        <div className="mt-6">
          <ErrorState message={query.error} onRetry={query.reload} />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title={
            filter === "ALL"
              ? "Todavía no recibiste solicitudes"
              : `No hay solicitudes ${PLURAL[filter].toLowerCase()}`
          }
        >
          {filter === "ALL"
            ? "Cuando alguien pida conocer una de tus propiedades publicadas, aparece acá."
            : "Probá con otro filtro."}
        </EmptyState>
      ) : (
        <>
          <ul
            className={`divide-y divide-rule border-b border-rule transition-opacity ${query.refreshing ? "opacity-60" : ""}`}
          >
            {items.map((visit) => {
              const actions = actionsFor(visit.status);
              const overdue =
                visit.status === "Pendiente" &&
                new Date(visit.proposedDate).getTime() < Date.now();
              return (
                <li
                  key={visit.id}
                  className={`grid gap-4 py-6 md:grid-cols-[1fr_auto] md:gap-8 ${busyId === visit.id ? "opacity-60" : ""}`}
                >
                  <div className="min-w-0">
                    <Link
                      href={`/vendedor/propiedades/${visit.propertyId}/editar`}
                      className="kicker underline-offset-4 hover:text-ink hover:underline"
                    >
                      {visit.propertyTitle}
                    </Link>

                    <p className="mt-2 text-lg font-medium leading-tight">
                      {visit.requesterName}
                    </p>
                    <a
                      href={`tel:${visit.requesterPhone.replace(/[^\d+]/g, "")}`}
                      className="mt-0.5 inline-block font-mono text-sm text-graphite underline decoration-rule-strong underline-offset-4 hover:text-ink hover:decoration-ink"
                    >
                      {visit.requesterPhone}
                    </a>

                    <p className="kicker mt-4">Visita propuesta para</p>
                    <p className="mt-1 font-serif text-xl leading-tight">
                      {formatVisitDay(visit.proposedDate)}, a las{" "}
                      {formatVisitTime(visit.proposedDate)}
                    </p>
                    {overdue && (
                      <p className="mt-1.5 text-[13px] text-ochre">
                        La fecha propuesta ya pasó: confirmá una nueva con quien
                        la pidió o rechazá la solicitud.
                      </p>
                    )}

                    {visit.message && (
                      <blockquote className="mt-3 max-w-xl whitespace-pre-line border-l-2 border-rule-strong pl-3 text-sm text-graphite">
                        {visit.message}
                      </blockquote>
                    )}
                    <p className="mt-3 text-xs text-stone">
                      Pedida {formatRelative(visit.createdAt)}
                    </p>
                  </div>

                  <div className="flex items-start justify-between gap-4 md:flex-col md:items-end md:justify-start">
                    <VisitStatusBadge status={visit.status} />
                    {actions.length > 0 && (
                      <div className="flex flex-wrap justify-end gap-2">
                        {actions.map((action) => (
                          <Button
                            key={action.to}
                            variant={action.variant}
                            size="sm"
                            disabled={busyId === visit.id}
                            onClick={() => onAction(visit, action)}
                          >
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          {meta && (
            <p className="mt-4 font-mono text-xs text-stone">
              {meta.total} {meta.total === 1 ? "solicitud" : "solicitudes"}
            </p>
          )}
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
