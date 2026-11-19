import { useRef, useState } from "react";
import { PropertyResults } from "@/components/properties/PropertyResults";
import { useAgencyProperties } from "@/hooks/useAgencies";

/** The agency's published properties; each card links to its detail page. */
export function AgencyProperties({ agencyId }: { agencyId: string }) {
  const [page, setPage] = useState(1);
  const { properties, meta, error, isLoading, reload } = useAgencyProperties(
    agencyId,
    page
  );
  const sectionRef = useRef<HTMLElement>(null);

  function goToPage(next: number) {
    setPage(next);
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section
      ref={sectionRef}
      aria-labelledby="propiedades"
      className="scroll-mt-20 space-y-5"
    >
      <h2 id="propiedades" className="text-xl font-semibold text-slate-900">
        Propiedades publicadas
        {meta && <span className="text-slate-500"> ({meta.total})</span>}
      </h2>
      <PropertyResults
        properties={properties}
        meta={meta}
        error={error}
        isLoading={isLoading}
        hasFilters={false}
        emptyDescription="Esta inmobiliaria no tiene propiedades publicadas por el momento."
        onRetry={reload}
        onClearFilters={() => setPage(1)}
        onPageChange={goToPage}
      />
    </section>
  );
}
