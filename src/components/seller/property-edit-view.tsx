"use client";

import Link from "next/link";
import { visitApi, propertyApi } from "@/lib/seller-api";
import { FROZEN_STATUSES, PROPERTY_STATUS_LABEL } from "@/lib/seller-types";
import { useQuery } from "@/lib/use-query";
import { buttonClasses } from "@/components/ui/button";
import { ErrorState, RowsSkeleton } from "@/components/ui/states";
import { PropertyForm } from "./property-form";
import { useSeller } from "./seller-shell";

export function PropertyEditView({ id }: { id: string }) {
  const { agency } = useSeller();

  // Además de la propiedad miramos si tiene visitas confirmadas: en ese caso
  // el servidor no deja editarla y es mejor decirlo antes de que escriba.
  const query = useQuery(id, async () => {
    const [{ data: property }, confirmed] = await Promise.all([
      propertyApi.get(id),
      visitApi.list({ status: "Confirmada", limit: 50 }),
    ]);
    return {
      property,
      hasConfirmedVisits: confirmed.data.some(
        (visit) => visit.propertyId === id
      ),
    };
  });

  if (query.loading) return <RowsSkeleton rows={3} />;

  // El detalle es público: si no es de esta inmobiliaria, para el panel no existe.
  if (!query.data || query.data.property.agency.id !== agency.id) {
    return (
      <div className="flex flex-col items-start gap-5">
        <ErrorState
          message={
            query.error ??
            "No encontramos esa propiedad entre las de tu inmobiliaria."
          }
          onRetry={query.error ? query.reload : undefined}
        />
        <Link
          href="/vendedor/propiedades"
          className={buttonClasses({ variant: "outline" })}
        >
          ← Volver a mis propiedades
        </Link>
      </div>
    );
  }

  const { property, hasConfirmedVisits } = query.data;

  let readOnlyReason: string | undefined;
  if (FROZEN_STATUSES.includes(property.status)) {
    readOnlyReason = `Esta propiedad está ${PROPERTY_STATUS_LABEL[property.status].toLowerCase()} y ya no se pueden editar sus datos.`;
  } else if (hasConfirmedVisits) {
    readOnlyReason =
      "Tiene visitas confirmadas pendientes. Mientras tanto no se pueden editar sus datos: solo recibe consultas.";
  }

  return (
    <PropertyForm
      // Al recargar cambian las fotos; la clave evita pisar lo que se está escribiendo.
      key={property.id}
      mode="edit"
      property={property}
      readOnlyReason={readOnlyReason}
      onReload={query.reload}
    />
  );
}
