import { CornerDownRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatRelativeDate } from "@/lib/format";
import type { Comment } from "@/types/api";

/** A question and, when there is one, the seller's single reply. */
export function CommentItem({
  comment,
  agencyName,
}: {
  comment: Comment;
  agencyName: string;
}) {
  return (
    <li className="space-y-2">
      <div className="flex items-start gap-3">
        <div
          aria-hidden
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700"
        >
          {comment.authorName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-2 text-sm">
            <span className="font-medium text-slate-900">
              {comment.authorName}
            </span>
            <time dateTime={comment.createdAt} className="text-slate-500">
              {formatRelativeDate(comment.createdAt)}
            </time>
            {!comment.sellerReply && (
              <Badge tone="warning">Sin responder</Badge>
            )}
          </p>
          <p className="whitespace-pre-line break-words text-slate-800">
            {comment.content}
          </p>
        </div>
      </div>

      {comment.sellerReply && (
        <div className="ml-12 flex gap-2 rounded-lg bg-brand-50 p-3">
          <CornerDownRight
            aria-hidden
            className="mt-0.5 size-4 shrink-0 text-brand-600"
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-brand-800">
              Respuesta de {agencyName}
            </p>
            <p className="whitespace-pre-line break-words text-sm text-slate-800">
              {comment.sellerReply}
            </p>
          </div>
        </div>
      )}
    </li>
  );
}
