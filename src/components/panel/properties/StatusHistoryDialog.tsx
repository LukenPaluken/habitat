import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Dialog } from "@/components/ui/Dialog";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { useFetch } from "@/hooks/useFetch";
import {
  statusHistoryUrl,
  type StatusHistoryResponse,
} from "@/lib/api/properties";
import { formatDateTime } from "@/lib/format";
import { STATUS_LABELS, STATUS_TONES } from "@/lib/property-options";

function HistoryList({ propertyId }: { propertyId: string }) {
  const { data, error, reload } = useFetch<StatusHistoryResponse>(
    statusHistoryUrl(propertyId)
  );

  if (error)
    return (
      <ErrorState message={error.message} onRetry={reload} className="py-6" />
    );
  if (!data)
    return <LoadingState label="Cargando historial…" className="py-6" />;

  return (
    <ol className="space-y-3">
      {data.data.map((change) => (
        <li
          key={change.id}
          className="flex flex-wrap items-center gap-2 text-sm"
        >
          <time
            dateTime={change.createdAt}
            className="w-full text-slate-500 sm:w-44"
          >
            {formatDateTime(change.createdAt)}
          </time>
          {change.previousState ? (
            <>
              <Badge tone={STATUS_TONES[change.previousState]}>
                {STATUS_LABELS[change.previousState]}
              </Badge>
              <ArrowRight aria-hidden className="size-4 text-slate-400" />
            </>
          ) : (
            <span className="text-slate-500">Creada como</span>
          )}
          <Badge tone={STATUS_TONES[change.newState]}>
            {STATUS_LABELS[change.newState]}
          </Badge>
        </li>
      ))}
    </ol>
  );
}

/** Every state a property went through, oldest first. */
export function StatusHistoryDialog({
  propertyId,
  title,
  open,
  onClose,
}: {
  propertyId: string;
  title: string;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} title={`Historial: ${title}`}>
      <HistoryList propertyId={propertyId} />
    </Dialog>
  );
}
