"use client";

import { Building2, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { buttonStyles } from "@/components/ui/Button";
import { SelectField } from "@/components/ui/Fields";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { useFetch } from "@/hooks/useFetch";
import {
  ownPropertiesUrl,
  type PropertyListResponse,
} from "@/lib/api/properties";
import { STATUS_LABELS } from "@/lib/property-options";
import { cn } from "@/lib/utils";
import type { PropertyStatus } from "@/types/api";
import { PageHeader } from "../PageHeader";
import { OwnPropertyRow } from "./OwnPropertyRow";

const PAGE_SIZE = 10;

/** "Mis propiedades": every listing of the agency, whatever its state. */
export function OwnPropertiesScreen() {
  const [status, setStatus] = useState<PropertyStatus | "">("");
  const [page, setPage] = useState(1);
  const { data, error, isLoading, reload } = useFetch<PropertyListResponse>(
    ownPropertiesUrl(status, page, PAGE_SIZE)
  );

  const newProperty = (
    <Link href="/panel/propiedades/nueva" className={buttonStyles()}>
      <Plus aria-hidden className="size-4" />
      Nueva propiedad
    </Link>
  );

  return (
    <div className="space-y-5">
      <PageHeader title="Mis propiedades" action={newProperty} />

      <SelectField
        label="Filtrar por estado"
        className="w-full sm:w-56"
        value={status}
        onChange={(event) => {
          setStatus(event.target.value as PropertyStatus | "");
          setPage(1);
        }}
      >
        <option value="">Todos</option>
        {(Object.keys(STATUS_LABELS) as PropertyStatus[]).map((value) => (
          <option key={value} value={value}>
            {STATUS_LABELS[value]}
          </option>
        ))}
      </SelectField>

      {error ? (
        <ErrorState
          title="No pudimos cargar tus propiedades"
          message={error.message}
          onRetry={reload}
        />
      ) : !data ? (
        <LoadingState label="Cargando propiedades…" />
      ) : data.data.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={
            status
              ? "No hay propiedades en ese estado"
              : "Todavía no cargaste propiedades"
          }
          description={
            status
              ? "Probá con otro estado."
              : "Publicá la primera para que aparezca en el listado."
          }
          action={!status && newProperty}
        />
      ) : (
        <div
          aria-busy={isLoading}
          className={cn("space-y-5", isLoading && "opacity-60")}
        >
          <ul className="space-y-3">
            {data.data.map((property) => (
              <OwnPropertyRow
                key={property.id}
                property={property}
                onChanged={reload}
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
