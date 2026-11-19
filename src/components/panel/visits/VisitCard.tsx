import { CalendarClock, Phone } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAction } from "@/hooks/useAction";
import { onConflict } from "@/lib/api/client";
import { changeVisitStatus } from "@/lib/api/visits";
import { formatDateTime } from "@/lib/format";
import {
  VISIT_ACTIONS,
  VISIT_STATUS_TONES,
  type VisitAction,
} from "@/lib/visit-actions";
import type { ReceivedVisit, VisitStatus } from "@/types/api";

/** One visit request with the actions its state allows (none once it is over). */
export function VisitCard({
  visit: received,
  onChanged,
}: {
  visit: ReceivedVisit;
  /** Asks the list to reload (only needed when someone else got there first). */
  onChanged: () => void;
}) {
  const [pending, setPending] = useState<VisitAction | null>(null);
  // What the API answered when we changed it: the card shows it right away,
  // without reloading the list. It only applies while the list still has the
  // state we started from; a fresh list wins.
  const [answered, setAnswered] = useState<{
    from: VisitStatus;
    visit: ReceivedVisit;
  } | null>(null);
  const visit = answered?.from === received.status ? answered.visit : received;
  const change = useAction(
    (action: VisitAction) => changeVisitStatus(visit.id, action.target),
    // A 409 means someone answered it first: refresh instead of leaving a stale card.
    (error) => error.status === 409 && onChanged()
  );
  const actions = VISIT_ACTIONS[visit.status];

  async function apply(action: VisitAction) {
    const updated = await change.run(action);
    if (updated) {
      setAnswered({
        from: received.status,
        visit: { ...received, ...updated },
      });
      setPending(null);
    }
  }

  function choose(action: VisitAction) {
    if (action.needsConfirm) setPending(action);
    else void apply(action);
  }

  function close() {
    setPending(null);
    change.reset();
  }

  return (
    <li className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-medium text-slate-900">{visit.requesterName}</p>
        <Badge tone={VISIT_STATUS_TONES[visit.status]}>{visit.status}</Badge>
      </div>

      <ul className="space-y-1.5 text-sm text-slate-700">
        <li>
          <a
            href={`tel:${visit.requesterPhone.replace(/[^\d+]/g, "")}`}
            className="inline-flex items-center gap-2 font-medium text-brand-700 hover:underline"
          >
            <Phone aria-hidden className="size-4" />
            {visit.requesterPhone}
          </a>
        </li>
        <li className="flex items-center gap-2">
          <CalendarClock aria-hidden className="size-4 text-slate-500" />
          {formatDateTime(visit.proposedDate)}
        </li>
      </ul>

      {visit.message && (
        <p className="whitespace-pre-line break-words rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
          {visit.message}
        </p>
      )}

      {actions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <Button
              key={action.target}
              size="sm"
              variant={action.needsConfirm ? "secondary" : "primary"}
              isLoading={change.isPending && !action.needsConfirm}
              onClick={() => choose(action)}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}

      {/* Errors of the actions that don't ask first show here; the others, in their dialog. */}
      {change.error && !pending && (
        <p role="alert" className="text-sm text-red-600">
          {onConflict(
            change.error,
            "Esta solicitud ya fue respondida. Actualizamos la lista."
          )}
        </p>
      )}

      <ConfirmDialog
        open={pending !== null}
        title={pending ? `${pending.label} la visita` : ""}
        message={`¿Seguro que querés ${pending?.label.toLowerCase()} la visita de ${visit.requesterName}? No se puede deshacer.`}
        confirmLabel={pending?.label ?? ""}
        isLoading={change.isPending}
        error={
          change.error &&
          onConflict(
            change.error,
            "Esta solicitud ya fue respondida. Actualizamos la lista."
          )
        }
        onConfirm={() => pending && void apply(pending)}
        onCancel={close}
      />
    </li>
  );
}
