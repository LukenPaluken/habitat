import { Info, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { VisitRequestButton } from "@/components/visits/VisitRequestButton";
import { formatPrice } from "@/lib/format";
import { STATUS_NOTICES } from "@/lib/property-options";
import type { PropertyDetail } from "@/types/api";

/** Title, price and the main call to action. Sits beside the gallery on desktop. */
export function PropertyOverview({ property }: { property: PropertyDetail }) {
  const notice = STATUS_NOTICES[property.status];

  return (
    <section
      aria-label="Resumen"
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-5"
    >
      <div className="flex flex-wrap gap-2">
        <Badge tone="brand">{property.operationType}</Badge>
        <Badge>{property.propertyType}</Badge>
      </div>

      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold leading-tight text-slate-900">
          {property.title}
        </h1>
        <p className="flex items-start gap-1.5 text-slate-600">
          <MapPin aria-hidden className="mt-1 size-4 shrink-0" />
          {property.address}, {property.neighborhood}
        </p>
      </div>

      <p className="text-3xl font-bold text-brand-800">
        {formatPrice(property.price, property.currency, property.operationType)}
      </p>

      {notice ? (
        <p
          role="status"
          className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900"
        >
          <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
          {notice} Todavía podés dejar tu consulta más abajo.
        </p>
      ) : (
        <VisitRequestButton property={property} />
      )}
    </section>
  );
}
