import { StarRating } from "@/components/ui/StarRating";
import { formatRelativeDate } from "@/lib/format";
import type { Review } from "@/types/api";

export function ReviewItem({ review }: { review: Review }) {
  return (
    <li className="space-y-1.5 rounded-xl border border-slate-200 bg-white p-4">
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
