import { Badge } from "@/components/ui/Badge";
import { capitalize } from "@/lib/property-options";
import type { PropertyDetail } from "@/types/api";
import { PropertyFacts } from "./PropertyFacts";

/** Attributes, amenities and description of the property. */
export function PropertyDetails({ property }: { property: PropertyDetail }) {
  const tags = property.tags ?? [];

  return (
    <div className="space-y-8">
      <section aria-labelledby="caracteristicas" className="space-y-3">
        <h2
          id="caracteristicas"
          className="text-xl font-semibold text-slate-900"
        >
          Características
        </h2>
        <PropertyFacts property={property} variant="full" />
      </section>

      {tags.length > 0 && (
        <section aria-labelledby="amenities" className="space-y-3">
          <h2 id="amenities" className="text-xl font-semibold text-slate-900">
            Amenities
          </h2>
          <ul className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <li key={tag}>
                <Badge tone="brand" className="px-3 py-1 text-sm">
                  {capitalize(tag)}
                </Badge>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="descripcion" className="space-y-3">
        <h2 id="descripcion" className="text-xl font-semibold text-slate-900">
          Descripción
        </h2>
        <p className="whitespace-pre-line break-words text-slate-700">
          {property.description}
        </p>
      </section>
    </div>
  );
}
