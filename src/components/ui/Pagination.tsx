import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/** 1 … 4 5 [6] 7 8 … 20: the first, the last and a window around the current. */
export function pageNumbers(
  page: number,
  totalPages: number
): (number | "…")[] {
  const wanted = new Set([1, totalPages, page - 1, page, page + 1]);
  const numbers = [...wanted]
    .filter((n) => n >= 1 && n <= totalPages)
    .sort((a, b) => a - b);

  return numbers.flatMap((n, index) =>
    index > 0 && n - numbers[index - 1] > 1 ? (["…", n] as const) : [n]
  );
}

const pageButton =
  "inline-flex size-10 items-center justify-center rounded-lg border text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40";

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Paginación"
      className="flex items-center justify-center gap-1.5"
    >
      <button
        type="button"
        aria-label="Página anterior"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className={cn(
          pageButton,
          "border-slate-300 bg-white hover:bg-slate-50"
        )}
      >
        <ChevronLeft aria-hidden className="size-5" />
      </button>

      {/* On a phone there is no room for the numbers: just where you are. */}
      <p className="px-3 text-sm text-slate-600 sm:hidden">
        Página {page} de {totalPages}
      </p>

      <ul className="hidden items-center gap-1.5 sm:flex">
        {pageNumbers(page, totalPages).map((item, index) =>
          item === "…" ? (
            <li
              key={`gap-${index}`}
              aria-hidden
              className="px-1 text-slate-400"
            >
              …
            </li>
          ) : (
            <li key={item}>
              <button
                type="button"
                aria-label={`Página ${item}`}
                aria-current={item === page ? "page" : undefined}
                onClick={() => onPageChange(item)}
                className={cn(
                  pageButton,
                  item === page
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-slate-300 bg-white hover:bg-slate-50"
                )}
              >
                {item}
              </button>
            </li>
          )
        )}
      </ul>

      <button
        type="button"
        aria-label="Página siguiente"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className={cn(
          pageButton,
          "border-slate-300 bg-white hover:bg-slate-50"
        )}
      >
        <ChevronRight aria-hidden className="size-5" />
      </button>
    </nav>
  );
}
