import { cn } from "@/lib/cn";

/** Lista de páginas con elipsis: 1 … 4 5 [6] 7 8 … 20 */
function pagesToShow(page: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const wanted = new Set([1, total, page - 1, page, page + 1]);
  const sorted = [...wanted]
    .filter((n) => n >= 1 && n <= total)
    .sort((a, b) => a - b);

  const result: (number | "gap")[] = [];
  sorted.forEach((n, index) => {
    if (index > 0 && n - sorted[index - 1] > 1) result.push("gap");
    result.push(n);
  });
  return result;
}

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const step =
    "h-9 min-w-9 px-2 font-mono text-[13px] transition-colors disabled:pointer-events-none disabled:opacity-35";

  return (
    <nav
      aria-label="Paginación"
      className="mt-6 flex flex-wrap items-center justify-between gap-3"
    >
      <p className="font-mono text-xs text-stone">
        Página {page} de {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          className={cn(step, "text-graphite hover:text-ink")}
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          ← Anterior
        </button>
        {pagesToShow(page, totalPages).map((entry, index) =>
          entry === "gap" ? (
            <span
              key={`gap-${index}`}
              className={cn(step, "grid place-items-center text-stone")}
            >
              …
            </span>
          ) : (
            <button
              key={entry}
              type="button"
              aria-current={entry === page ? "page" : undefined}
              className={cn(
                step,
                entry === page
                  ? "bg-ink text-sheet"
                  : "text-graphite hover:bg-rule/60"
              )}
              onClick={() => onChange(entry)}
            >
              {entry}
            </button>
          )
        )}
        <button
          type="button"
          className={cn(step, "text-graphite hover:text-ink")}
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          Siguiente →
        </button>
      </div>
    </nav>
  );
}
