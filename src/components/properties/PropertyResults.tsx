import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState, ErrorState } from "@/components/ui/States";
import type { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import type { PageMeta, PropertySummary } from "@/types/api";
import { PropertyGrid, PropertyGridSkeleton } from "./PropertyGrid";

interface PropertyResultsProps {
  properties: PropertySummary[] | undefined;
  meta: PageMeta | undefined;
  error: ApiError | undefined;
  isLoading: boolean;
  hasFilters: boolean;
  /** What to say when there are no properties and no filters are applied. */
  emptyDescription?: string;
  onRetry: () => void;
  onClearFilters: () => void;
  onPageChange: (page: number) => void;
}

/** Whatever the list is doing right now: failing, loading, empty or showing data. */
export function PropertyResults({
  properties,
  meta,
  error,
  isLoading,
  hasFilters,
  emptyDescription = "Todavía no hay propiedades publicadas.",
  onRetry,
  onClearFilters,
  onPageChange,
}: PropertyResultsProps) {
  if (error) {
    return (
      <ErrorState
        title="No pudimos cargar las propiedades"
        message={error.message}
        onRetry={onRetry}
      />
    );
  }

  // First load: nothing to show yet.
  if (!properties || !meta) return <PropertyGridSkeleton />;

  if (properties.length === 0) {
    // There are results, but not on this page (an old or edited link).
    if (meta.total > 0) {
      return (
        <EmptyState
          title="Esta página no tiene resultados"
          description={`La búsqueda tiene ${meta.totalPages} páginas.`}
          action={
            <Button onClick={() => onPageChange(1)}>
              Ir a la primera página
            </Button>
          }
        />
      );
    }
    return (
      <EmptyState
        icon={SearchX}
        title="No encontramos propiedades"
        description={
          hasFilters
            ? "Probá con menos filtros o con otra búsqueda."
            : emptyDescription
        }
        action={
          hasFilters && (
            <Button onClick={onClearFilters}>Limpiar filtros</Button>
          )
        }
      />
    );
  }

  return (
    // While a newer page loads, the previous one stays (dimmed): no flash of blank.
    <div
      aria-busy={isLoading}
      className={cn("space-y-8 transition-opacity", isLoading && "opacity-60")}
    >
      <PropertyGrid properties={properties} />
      <Pagination
        page={meta.page}
        totalPages={meta.totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
}
