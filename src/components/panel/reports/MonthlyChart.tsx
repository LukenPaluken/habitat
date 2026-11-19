import { BarChart3 } from "lucide-react";
import { useFetch } from "@/hooks/useFetch";
import {
  MONTHLY_REPORT_URL,
  type MonthlyReportResponse,
} from "@/lib/api/reports";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import type { MonthlyReport } from "@/types/api";

const monthName = new Intl.DateTimeFormat("es-AR", {
  month: "short",
  timeZone: "UTC",
});

// "2026-06" -> "jun"
function labelOf(month: string): string {
  const [year, number] = month.split("-").map(Number);
  return monthName
    .format(new Date(Date.UTC(year, number - 1, 1)))
    .replace(".", "");
}

function Bar({
  value,
  max,
  className,
}: {
  value: number;
  max: number;
  className: string;
}) {
  return (
    <div
      className={`w-2.5 rounded-t sm:w-3.5 ${className}`}
      // Heights are relative to the biggest value; a non-zero one is always visible.
      style={{
        height: value === 0 ? 0 : `${Math.max((value / max) * 100, 4)}%`,
      }}
      title={String(value)}
    />
  );
}

function Chart({ months }: { months: MonthlyReport[] }) {
  const max = Math.max(...months.flatMap((m) => [m.published, m.closed]), 1);

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <ul className="flex items-center gap-4 text-sm text-slate-600">
        <li className="flex items-center gap-1.5">
          <span className="size-3 rounded bg-brand-500" /> Publicaciones nuevas
        </li>
        <li className="flex items-center gap-1.5">
          <span className="size-3 rounded bg-amber-500" /> Ventas / alquileres
        </li>
      </ul>
      {/* Its own scroll container: on a very narrow screen the chart scrolls, not the page. */}
      <div className="overflow-x-auto">
        <ol className="flex h-48 min-w-[16rem] items-end justify-between gap-1">
          {months.map((m) => (
            <li
              key={m.month}
              aria-label={`${labelOf(m.month)}: ${m.published} publicaciones, ${m.closed} cierres`}
              className="flex h-full flex-1 flex-col items-center justify-end gap-1"
            >
              <div className="flex h-full w-full items-end justify-center gap-0.5">
                <Bar value={m.published} max={max} className="bg-brand-500" />
                <Bar value={m.closed} max={max} className="bg-amber-500" />
              </div>
              <span className="text-[10px] text-slate-500 sm:text-xs">
                {labelOf(m.month)}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/** New publications and sales/rentals closed, month by month. */
export function MonthlyChart() {
  const { data, error, isLoading, reload } =
    useFetch<MonthlyReportResponse>(MONTHLY_REPORT_URL);
  const hasActivity = data?.data.some((m) => m.published > 0 || m.closed > 0);

  return (
    <section aria-labelledby="monthly" className="space-y-3">
      <h2 id="monthly" className="text-lg font-semibold text-slate-900">
        Publicaciones y cierres por mes
      </h2>
      {error ? (
        <ErrorState
          title="No pudimos cargar este indicador"
          message={error.message}
          onRetry={reload}
        />
      ) : !data || isLoading ? (
        <LoadingState label="Cargando…" className="py-6" />
      ) : !hasActivity ? (
        <EmptyState
          icon={BarChart3}
          title="Todavía no hay movimiento"
          description="Acá vas a ver tus publicaciones y cierres de los últimos 12 meses."
          className="py-8"
        />
      ) : (
        <Chart months={data.data} />
      )}
    </section>
  );
}
