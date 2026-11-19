import { MessageSquareText } from "lucide-react";
import { useState } from "react";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { useAgencyReviews } from "@/hooks/useAgencies";
import { cn } from "@/lib/utils";
import { ReviewForm } from "./ReviewForm";
import { ReviewItem } from "./ReviewItem";

interface AgencyReviewsProps {
  agencyId: string;
  /** Called after a review is saved, so the header's average can refresh too. */
  onReviewPosted: () => void;
}

export function AgencyReviews({
  agencyId,
  onReviewPosted,
}: AgencyReviewsProps) {
  const [page, setPage] = useState(1);
  const { reviews, meta, error, isLoading, reload } = useAgencyReviews(
    agencyId,
    page
  );

  function handlePosted() {
    setPage(1); // the newest review is on the first page
    reload();
    onReviewPosted();
  }

  return (
    <section aria-labelledby="resenas" className="space-y-5">
      <h2 id="resenas" className="text-xl font-semibold text-slate-900">
        Reseñas
        {meta && <span className="text-slate-500"> ({meta.total})</span>}
      </h2>

      {error ? (
        <ErrorState
          title="No pudimos cargar las reseñas"
          message={error.message}
          onRetry={reload}
        />
      ) : !reviews || !meta ? (
        <LoadingState label="Cargando reseñas…" />
      ) : meta.total === 0 ? (
        <EmptyState
          icon={MessageSquareText}
          title="Todavía no hay reseñas"
          description="Sé el primero en contar cómo fue tu experiencia."
          className="py-8"
        />
      ) : (
        <div
          aria-busy={isLoading}
          className={cn(
            "space-y-5 transition-opacity",
            isLoading && "opacity-60"
          )}
        >
          <ul className="space-y-3">
            {reviews.map((review) => (
              <ReviewItem key={review.id} review={review} />
            ))}
          </ul>
          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="mb-4 font-semibold text-slate-900">Dejá tu reseña</h3>
        <ReviewForm agencyId={agencyId} onPosted={handlePosted} />
      </div>
    </section>
  );
}
