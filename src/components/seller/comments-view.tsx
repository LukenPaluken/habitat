"use client";

import { useState } from "react";
import Link from "next/link";
import { errorMessage } from "@/lib/api";
import { formatRelative } from "@/lib/format";
import { commentApi } from "@/lib/seller-api";
import type { ApiComment } from "@/lib/seller-types";
import { useQuery } from "@/lib/use-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState, ErrorState, RowsSkeleton } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";

const PAGE_SIZE = 10;
const MAX_REPLY = 2000;

type Filter = "all" | "unanswered";

export function CommentsView() {
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);

  const query = useQuery(`${filter}|${page}`, () =>
    commentApi.list({
      page,
      limit: PAGE_SIZE,
      unanswered: filter === "unanswered",
    })
  );
  const items = query.data?.data ?? [];
  const meta = query.data?.meta;

  return (
    <>
      <PageHeader kicker="Panel del vendedor" title="Consultas">
        Las preguntas que dejan en tus propiedades. La respuesta es una sola y
        queda visible en la publicación, debajo de la pregunta.
      </PageHeader>

      <FilterTabs
        label="Filtrar consultas"
        value={filter}
        options={[
          { value: "all", label: "Todas" },
          {
            value: "unanswered",
            label: "Sin responder",
            count: meta?.unanswered,
          },
        ]}
        onChange={(next) => {
          setFilter(next);
          setPage(1);
        }}
      />

      {query.loading ? (
        <RowsSkeleton rows={3} className="border-t-0" />
      ) : query.error && !query.data ? (
        <div className="mt-6">
          <ErrorState message={query.error} onRetry={query.reload} />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title={
            filter === "unanswered"
              ? "No tenés consultas sin responder"
              : "Todavía no recibiste consultas"
          }
        >
          {filter === "unanswered"
            ? "Estás al día."
            : "Cuando alguien pregunte por una de tus propiedades, la ves acá."}
        </EmptyState>
      ) : (
        <>
          <ul
            className={`divide-y divide-rule border-b border-rule transition-opacity ${query.refreshing ? "opacity-60" : ""}`}
          >
            {items.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onReplied={query.reload}
              />
            ))}
          </ul>
          {meta && (
            <p className="mt-4 font-mono text-xs text-stone">
              {meta.total} {meta.total === 1 ? "consulta" : "consultas"}
            </p>
          )}
          <Pagination
            page={page}
            totalPages={meta?.totalPages ?? 1}
            onChange={setPage}
          />
        </>
      )}
    </>
  );
}

function CommentItem({
  comment,
  onReplied,
}: {
  comment: ApiComment;
  onReplied: () => Promise<void>;
}) {
  const toast = useToast();
  const [reply, setReply] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (!reply.trim()) {
      setError("Escribí la respuesta antes de enviarla.");
      return;
    }
    setError(null);
    setSending(true);
    try {
      await commentApi.reply(comment.id, reply.trim());
      toast.success("Respuesta publicada.");
      await onReplied();
    } catch (caught) {
      setError(errorMessage(caught));
      setSending(false);
    }
  }

  return (
    <li className="py-6">
      <p className="kicker">
        <Link
          href={`/vendedor/propiedades/${comment.propertyId}/editar`}
          className="underline-offset-4 hover:text-ink hover:underline"
        >
          {comment.propertyTitle}
        </Link>
        <span aria-hidden> · </span>
        {formatRelative(comment.createdAt)}
      </p>

      <p className="mt-3 text-sm text-graphite">
        <span className="font-medium text-ink">{comment.authorName}</span>{" "}
        preguntó
      </p>
      <p className="mt-1 max-w-2xl whitespace-pre-line font-serif text-xl leading-snug">
        “{comment.content}”
      </p>

      {comment.sellerReply ? (
        <div className="mt-4 max-w-2xl border-l-2 border-ink pl-4">
          <p className="kicker">
            Tu respuesta · {formatRelative(comment.updatedAt)}
          </p>
          <p className="mt-1 whitespace-pre-line text-sm">
            {comment.sellerReply}
          </p>
        </div>
      ) : (
        <form onSubmit={send} noValidate className="mt-4 max-w-2xl">
          <label htmlFor={`reply-${comment.id}`} className="sr-only">
            Tu respuesta a {comment.authorName}
          </label>
          <Textarea
            id={`reply-${comment.id}`}
            rows={2}
            value={reply}
            maxLength={MAX_REPLY}
            onChange={(event) => {
              setReply(event.target.value);
              setError(null);
            }}
            placeholder="Escribí tu respuesta…"
            aria-invalid={error ? true : undefined}
            disabled={sending}
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[13px] text-stone">
              {error ? (
                <span role="alert" className="text-brick">
                  {error}
                </span>
              ) : (
                "Se publica en la propiedad y no se puede editar."
              )}
            </p>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-stone">
                {reply.length}/{MAX_REPLY}
              </span>
              <Button type="submit" variant="ink" size="sm" loading={sending}>
                Responder
              </Button>
            </div>
          </div>
        </form>
      )}
    </li>
  );
}
