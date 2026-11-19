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

  // Besides the property we check for confirmed visits: in that case the
  // server refuses edits, and it is better to say so before the user types.
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

  // The detail is public: if it is not this agency's, it does not exist here.
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
          href="/seller/properties"
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
      // Photos change on reload; the key avoids overwriting what is being typed.
      key={property.id}
      mode="edit"
      property={property}
      readOnlyReason={readOnlyReason}
      onReload={query.reload}
    />
  );
}
