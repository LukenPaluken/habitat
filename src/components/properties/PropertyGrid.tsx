import type { PropertySummary } from "@/types/api";
import { PropertyCard } from "./PropertyCard";

const grid = "grid gap-5 sm:grid-cols-2 lg:grid-cols-3";

export function PropertyGrid({
  properties,
}: {
  properties: PropertySummary[];
}) {
  return (
    <ul className={grid}>
      {properties.map((property, index) => (
        <li key={property.id}>
          {/* The first row is above the fold: load its photos right away. */}
          <PropertyCard property={property} priority={index < 3} />
        </li>
      ))}
    </ul>
  );
}

/** Placeholder cards with the shape of the real ones, so the page doesn't jump. */
export function PropertyGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <ul className={grid} aria-busy="true" aria-label="Cargando propiedades">
      {Array.from({ length: count }, (_, index) => (
        <li
          key={index}
          className="animate-pulse overflow-hidden rounded-xl border border-slate-200 bg-white"
        >
          <div className="aspect-[4/3] bg-slate-200" />
          <div className="space-y-3 p-4">
            <div className="h-6 w-1/2 rounded bg-slate-200" />
            <div className="h-4 w-5/6 rounded bg-slate-200" />
            <div className="h-4 w-2/3 rounded bg-slate-200" />
          </div>
        </li>
      ))}
    </ul>
  );
}
