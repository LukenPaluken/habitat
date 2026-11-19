import { useFetch } from "@/hooks/useFetch";
import {
  STATUS_SUMMARY_URL,
  type StatusSummaryResponse,
} from "@/lib/api/reports";
import { STATUS_LABELS } from "@/lib/property-options";
import { ErrorState, LoadingState } from "@/components/ui/States";
import type { PropertyStatus } from "@/types/api";

// The order the seller reads them in, from "live" to "closed".
const ORDER: PropertyStatus[] = [
  "PUBLICADA",
  "RESERVADA",
  "VENDIDA",
  "ALQUILADA",
  "PAUSADA",
  "CANCELADA",
];

/** How many properties are in each state right now. */
export function StatusSummaryCards() {
  const { data, error, isLoading, reload } =
    useFetch<StatusSummaryResponse>(STATUS_SUMMARY_URL);

  return (
    <section aria-labelledby="by-status" className="space-y-3">
      <h2 id="by-status" className="text-lg font-semibold text-slate-900">
        Propiedades por estado
      </h2>
      {error ? (
        <ErrorState
          title="No pudimos cargar este indicador"
          message={error.message}
          onRetry={reload}
        />
      ) : !data || isLoading ? (
        <LoadingState label="Cargando…" className="py-6" />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {ORDER.map((status) => (
            <li
              key={status}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <p className="text-3xl font-bold text-slate-900">
                {data.data[status]}
              </p>
              <p className="text-sm text-slate-600">{STATUS_LABELS[status]}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
