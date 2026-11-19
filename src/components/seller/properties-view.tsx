"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { errorMessage } from "@/lib/api";
import { propertyApi, type PropertySort } from "@/lib/seller-api";
import {
  PROPERTY_STATUS_LABEL,
  PROPERTY_STATUSES,
  type ApiProperty,
  type PropertyStatus,
} from "@/lib/seller-types";
import { useQuery } from "@/lib/use-query";
import { buttonClasses } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm";
import { Select } from "@/components/ui/field";
import { FilterTabs, type FilterOption } from "@/components/ui/filter-tabs";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState, ErrorState, RowsSkeleton } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { AgencyPanel } from "./agency-panel";
import { PropertyRow, type StatusAction } from "./property-row";
import { useSeller } from "./seller-shell";

const PAGE_SIZE = 8;

type StatusFilter = "ALL" | PropertyStatus;

const STATUS_OPTIONS: FilterOption<StatusFilter>[] = [
  { value: "ALL", label: "Todas" },
  ...PROPERTY_STATUSES.map((status) => ({
    value: status,
    label: PROPERTY_STATUS_LABEL[status],
  })),
];

const SORT_OPTIONS: { value: PropertySort; label: string }[] = [
  { value: "date_desc", label: "Más recientes" },
  { value: "date_asc", label: "Más antiguas" },
  { value: "price_desc", label: "Precio: mayor a menor" },
  { value: "price_asc", label: "Precio: menor a mayor" },
  { value: "area_desc", label: "Superficie: mayor a menor" },
  { value: "area_asc", label: "Superficie: menor a mayor" },
];

export function PropertiesView() {
  const toast = useToast();
  const confirm = useConfirm();
  const { refreshUnread } = useSeller();

  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [sort, setSort] = useState<PropertySort>("date_desc");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);

  const query = useQuery(`${status}|${sort}|${page}`, () =>
    propertyApi.list({
      page,
      limit: PAGE_SIZE,
      sort,
      status: status === "ALL" ? undefined : status,
    })
  );

  const items = query.data?.data ?? [];
  const meta = query.data?.meta;

  // If we cancelled the last row of the last page, go back one page.
  useEffect(() => {
    if (query.data && items.length === 0 && page > 1) setPage(page - 1);
  }, [query.data, items.length, page]);

  async function onAction(property: ApiProperty, action: StatusAction) {
    if (action.confirm && !(await confirm(action.confirm))) return;

    setBusyId(property.id);
    try {
      if (action.to) {
        await propertyApi.changeStatus(property.id, action.to);
        toast.success(
          `“${property.title}” ahora está ${PROPERTY_STATUS_LABEL[action.to].toLowerCase()}.`
        );
      } else {
        await propertyApi.removeDraft(property.id);
        toast.success("Borrador eliminado.");
      }
      await Promise.all([query.reload(), refreshUnread()]);
    } catch (error) {
      toast.error(errorMessage(error));
      void query.reload();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <PageHeader
        kicker="Panel del vendedor"
        title="Mis propiedades"
        actions={
          <Link
            href="/seller/properties/new"
            className={buttonClasses({ variant: "primary" })}
          >
            + Nueva propiedad
          </Link>
        }
      >
        Publicá, pausá y seguí cada propiedad desde que es borrador hasta que se
        vende o se alquila.
      </PageHeader>

      <AgencyPanel />

      <div className="mb-1 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 sm:flex-1">
          <FilterTabs
            label="Filtrar por estado"
            value={status}
            options={STATUS_OPTIONS}
            onChange={(next) => {
              setStatus(next);
              setPage(1);
            }}
          />
        </div>
        <label className="flex shrink-0 items-center gap-2 text-[13px] text-stone">
          Ordenar
          <div className="w-52">
            <Select
              value={sort}
              onChange={(event) => {
                setSort(event.target.value as PropertySort);
                setPage(1);
              }}
              className="h-9 text-[13px]"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        </label>
      </div>

      {query.loading ? (
        <RowsSkeleton rows={4} className="mt-0 border-t-0" />
      ) : query.error && !query.data ? (
        <div className="mt-6">
          <ErrorState message={query.error} onRetry={query.reload} />
        </div>
      ) : items.length === 0 ? (
        status === "ALL" ? (
          <EmptyState
            title="Todavía no cargaste propiedades"
            action={
              <Link
                href="/seller/properties/new"
                className={buttonClasses({ variant: "primary" })}
              >
                Publicar la primera
              </Link>
            }
          >
            Cargá una como borrador para completarla con calma, o publicala
            directamente.
          </EmptyState>
        ) : (
          <EmptyState
            title={`No tenés propiedades en estado “${PROPERTY_STATUS_LABEL[status]}”`}
          >
            Probá con otro filtro.
          </EmptyState>
        )
      ) : (
        <>
          <ul
            className={`divide-y divide-rule border-b border-rule transition-opacity ${query.refreshing ? "opacity-60" : ""}`}
          >
            {items.map((property) => (
              <PropertyRow
                key={property.id}
                property={property}
                busy={busyId === property.id}
                onAction={onAction}
              />
            ))}
          </ul>
          {meta && (
            <p className="mt-4 font-mono text-xs text-stone">
              {meta.total} {meta.total === 1 ? "propiedad" : "propiedades"}
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
