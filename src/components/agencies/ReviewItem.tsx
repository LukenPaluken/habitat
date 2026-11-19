import { StarRating } from "@/components/ui/StarRating";
import { formatRelativeDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Review } from "@/types/api";

export function ReviewItem({
  review,
  highlighted = false,
}: {
  review: Review;
  /** The one the seller came to see (from the activity feed). */
  highlighted?: boolean;
}) {
  return (
    <li
      id={`resena-${review.id}`}
      className={cn(
        "scroll-mt-20 space-y-1.5 rounded-xl border border-slate-200 bg-white p-4",
        highlighted && "ring-2 ring-brand-500 ring-offset-2"
      )}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <StarRating value={review.rating} />
        <span className="font-medium text-slate-900">{review.authorName}</span>
        <time dateTime={review.createdAt} className="text-sm text-slate-500">
          {formatRelativeDate(review.createdAt)}
        </time>
      </div>
      <p className="whitespace-pre-line break-words text-slate-700">
        {review.content}
      </p>
    </li>
  );
}
