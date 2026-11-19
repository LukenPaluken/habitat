import { CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatRelativeDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ReceivedComment } from "@/types/api";
import { ReplyForm } from "./ReplyForm";

/** A received question: answered ones show the reply, pending ones ask for it. */
export function InquiryItem({
  comment,
  highlighted = false,
  onReplied,
  onStale,
}: {
  comment: ReceivedComment;
  /** The one the seller came to see (from the activity feed). */
  highlighted?: boolean;
  onReplied: (comment: ReceivedComment) => void;
  onStale: () => void;
}) {
  const answered = comment.sellerReply !== null;

  return (
    <li
      id={`consulta-${comment.id}`}
      className={cn(
        "scroll-mt-20 space-y-3 rounded-xl border border-l-4 bg-white p-4",
        answered
          ? "border-slate-200 border-l-brand-500"
          : "border-slate-200 border-l-amber-500",
        highlighted && "ring-2 ring-brand-500 ring-offset-2"
      )}
    >
      <div className="space-y-1">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span className="font-medium text-slate-900">
            {comment.authorName}
          </span>
          <time dateTime={comment.createdAt} className="text-slate-500">
            {formatRelativeDate(comment.createdAt)}
          </time>
          {answered ? (
            <Badge tone="brand">
              <CheckCircle2 aria-hidden className="mr-1 size-3" />
              Respondida
            </Badge>
          ) : (
            <Badge tone="warning">
              <Clock aria-hidden className="mr-1 size-3" />
              Pendiente
            </Badge>
          )}
        </p>
        <p className="whitespace-pre-line break-words text-slate-800">
          {comment.content}
        </p>
      </div>

      {answered ? (
        <p className="whitespace-pre-line break-words rounded-lg bg-brand-50 p-3 text-sm text-slate-800">
          <span className="font-medium text-brand-800">Tu respuesta: </span>
          {comment.sellerReply}
        </p>
      ) : (
        <ReplyForm
          commentId={comment.id}
          authorName={comment.authorName}
          onReplied={onReplied}
          onStale={onStale}
        />
      )}
    </li>
  );
}
