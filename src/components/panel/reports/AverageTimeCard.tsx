import { Hourglass } from "lucide-react";
import { useFetch } from "@/hooks/useFetch";
import { AVERAGE_TIME_URL, type AverageTimeResponse } from "@/lib/api/reports";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";

/** Days between publishing a property and selling or renting it, on average. */
export function AverageTimeCard() {
  const { data, error, isLoading, reload } =
    useFetch<AverageTimeResponse>(AVERAGE_TIME_URL);
  const days = data?.data.averageDays;

  return (
    <section aria-labelledby="on-market" className="space-y-3">
      <h2 id="on-market" className="text-lg font-semibold text-slate-900">
        Tiempo promedio en el mercado
      </h2>
      {error ? (
        <ErrorState
          title="No pudimos cargar este indicador"
          message={error.message}
          onRetry={reload}
        />
      ) : !data || isLoading ? (
        <LoadingState label="Cargando…" className="py-6" />
      ) : days === null || days === undefined ? (
        // Nothing sold or rented yet: say so instead of showing "NaN días".
        <EmptyState
          icon={Hourglass}
          title="Todavía no hay datos"
          description="Cuando vendas o alquiles tu primera propiedad vas a ver acá cuántos días tardó."
          className="py-8"
        />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-4xl font-bold text-brand-800">
            {days.toLocaleString("es-AR")} {days === 1 ? "día" : "días"}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            entre que la propiedad se publica y se vende o alquila.
          </p>
        </div>
      )}
    </section>
  );
}
