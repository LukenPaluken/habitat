"use client";

import { MessageCircleQuestion } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { useFetch } from "@/hooks/useFetch";
import {
  receivedCommentsUrl,
  type ReceivedCommentsResponse,
} from "@/lib/api/inquiries";
import { groupBy } from "@/lib/group";
import type { ReceivedComment } from "@/types/api";
import { cn } from "@/lib/utils";
import { PageHeader } from "../PageHeader";
import { InquiryItem } from "./InquiryItem";

const PAGE_SIZE = 20;

/** The questions received, grouped by property, to answer them inline. */
export function InquiriesScreen() {
  const [onlyPending, setOnlyPending] = useState(true);
  const [page, setPage] = useState(1);
  const { data, error, isLoading, reload } = useFetch<ReceivedCommentsResponse>(
    receivedCommentsUrl(onlyPending, page, PAGE_SIZE)
  );

  // Questions answered from this screen: they show as answered right away
  // (and stay on screen even under "Pendientes") without refetching the list.
  const [replied, setReplied] = useState<Record<string, ReceivedComment>>({});

  const items = data?.data.map((comment) => replied[comment.id] ?? comment);
  const answeredNow =
    data?.data.filter((c) => replied[c.id] && c.sellerReply === null).length ??
    0;
  const pending = Math.max((data?.meta.unanswered ?? 0) - answeredNow, 0);
  const groups = items
    ? groupBy(
        items,
        (c) => c.propertyId,
        (c) => c.propertyTitle
      )
    : [];

  function refetch() {
    setReplied({});
    reload();
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Consultas"
        description={
          data
            ? pending > 0
              ? `${pending} sin responder`
              : "No tenés consultas pendientes."
            : undefined
        }
      />

      <div role="group" aria-label="Filtrar" className="flex gap-2">
        {[
          { label: "Pendientes", value: true },
          { label: "Todas", value: false },
        ].map(({ label, value }) => (
          <Button
            key={label}
            size="sm"
            variant={onlyPending === value ? "primary" : "secondary"}
            aria-pressed={onlyPending === value}
            onClick={() => {
              setOnlyPending(value);
              setPage(1);
            }}
          >
            {label}
          </Button>
        ))}
      </div>

      {error ? (
        <ErrorState
          title="No pudimos cargar las consultas"
          message={error.message}
          onRetry={refetch}
        />
      ) : !data ? (
        <LoadingState label="Cargando consultas…" />
      ) : groups.length === 0 ? (
        <EmptyState
          icon={MessageCircleQuestion}
          title={
            onlyPending
              ? "No tenés consultas pendientes"
              : "Todavía no recibiste consultas"
          }
          description="Las preguntas que dejen en tus propiedades aparecen acá para que las respondas."
        />
      ) : (
        <div
          aria-busy={isLoading}
          className={cn("space-y-6", isLoading && "opacity-60")}
        >
          {groups.map((group) => (
            <section
              key={group.key}
              aria-label={group.title}
              className="space-y-3"
            >
              <h2 className="text-lg font-semibold text-slate-900">
                {group.title}
              </h2>
              <ul className="space-y-3">
                {group.items.map((comment) => (
                  <InquiryItem
                    key={comment.id}
                    comment={comment}
                    onReplied={(saved) =>
                      setReplied((current) => ({
                        ...current,
                        [saved.id]: { ...comment, ...saved },
                      }))
                    }
                    onStale={refetch}
                  />
                ))}
              </ul>
            </section>
          ))}
          <Pagination
            page={data.meta.page}
            totalPages={data.meta.totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
