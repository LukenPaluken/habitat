import { MessageCircleQuestion } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import type { Comment } from "@/types/api";
import { CommentForm } from "./CommentForm";
import { CommentItem } from "./CommentItem";

const VISIBLE_AT_FIRST = 5;

interface CommentsSectionProps {
  propertyId: string;
  agencyName: string;
  /** The questions the server sent, newest first. */
  comments: Comment[];
}

export function CommentsSection({
  propertyId,
  agencyName,
  comments,
}: CommentsSectionProps) {
  // Questions asked from this page, shown right away without reloading.
  const [posted, setPosted] = useState<Comment[]>([]);
  const [showAll, setShowAll] = useState(false);

  const all = [...posted, ...comments];
  const visible = showAll ? all : all.slice(0, VISIBLE_AT_FIRST);

  return (
    <section aria-labelledby="consultas" className="space-y-5">
      <h2 id="consultas" className="text-xl font-semibold text-slate-900">
        Consultas{" "}
        {all.length > 0 && (
          <span className="text-slate-500">({all.length})</span>
        )}
      </h2>

      {all.length === 0 ? (
        <EmptyState
          icon={MessageCircleQuestion}
          title="Todavía no hay consultas"
          description="Sé el primero en preguntar. La respuesta de la inmobiliaria queda visible para todos."
          className="py-8"
        />
      ) : (
        <ul className="space-y-5">
          {visible.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              agencyName={agencyName}
            />
          ))}
        </ul>
      )}

      {all.length > VISIBLE_AT_FIRST && (
        <Button
          variant="ghost"
          onClick={() => setShowAll((current) => !current)}
        >
          {showAll ? "Ver menos" : `Ver las ${all.length} consultas`}
        </Button>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="mb-4 font-semibold text-slate-900">Hacé tu consulta</h3>
        <CommentForm
          propertyId={propertyId}
          onPosted={(comment) => setPosted((current) => [comment, ...current])}
        />
      </div>
    </section>
  );
}
