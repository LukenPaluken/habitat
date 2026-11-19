import { ExternalLink, History, ImageOff, Pencil } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonStyles } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { RemoteImage } from "@/components/ui/RemoteImage";
import { useAction } from "@/hooks/useAction";
import { changePropertyStatus } from "@/lib/api/properties";
import { formatPrice } from "@/lib/format";
import { isEditable } from "@/lib/property-lifecycle";
import { coverImageOf } from "@/lib/property-images";
import { STATUS_LABELS, STATUS_TONES } from "@/lib/property-options";
import { statusActionsFor, type StatusAction } from "@/lib/property-actions";
import type { PropertySummary } from "@/types/api";
import { StatusHistoryDialog } from "./StatusHistoryDialog";

/** One of the seller's properties: its data, and only the buttons that are valid now. */
export function OwnPropertyRow({
  property,
  onChanged,
}: {
  property: PropertySummary;
  onChanged: () => void;
}) {
  const [asking, setAsking] = useState<StatusAction | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const change = useAction((action: StatusAction) =>
    changePropertyStatus(property.id, action.target)
  );
  const cover = coverImageOf(property.images);
  const actions = statusActionsFor(property);

  async function apply(action: StatusAction) {
    // Only a success touches the screen: if the API refuses, the old state stays.
    if (await change.run(action)) {
      setAsking(null);
      onChanged();
    }
  }

  function choose(action: StatusAction) {
    if (action.needsConfirm) setAsking(action);
    else void apply(action);
  }

  function closeDialog() {
    setAsking(null);
    change.reset();
  }

  // The API refuses an invalid move with a 400 and a lost race with a 409, and
  // says why: that reason is what the seller reads.
  const refusal = change.error?.message;

  return (
    <li className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex gap-3">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:size-24">
          {cover ? (
            <RemoteImage
              src={cover.imageUrl}
              alt=""
              sizes="96px"
              className="object-cover"
            />
          ) : (
            <ImageOff
              aria-hidden
              className="absolute inset-0 m-auto size-6 text-slate-400"
            />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="min-w-0 break-words font-semibold text-slate-900">
              {property.title}
            </h2>
            <Badge tone={STATUS_TONES[property.status]}>
              {STATUS_LABELS[property.status]}
            </Badge>
          </div>
          <p className="text-sm text-slate-600">
            {property.operationType} · {property.propertyType} ·{" "}
            {property.neighborhood}
          </p>
          <p className="font-medium text-slate-900">
            {formatPrice(
              property.price,
              property.currency,
              property.operationType
            )}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {isEditable(property.status) && (
          <Link
            href={`/panel/propiedades/${property.id}/editar`}
            className={buttonStyles("secondary", "sm")}
          >
            <Pencil aria-hidden className="size-4" />
            Editar
          </Link>
        )}
        {actions.map((action) => (
          <Button
            key={action.target}
            size="sm"
            variant={action.target === "PUBLICADA" ? "primary" : "secondary"}
            isLoading={change.isPending && !action.needsConfirm}
            onClick={() => choose(action)}
          >
            {action.label}
          </Button>
        ))}
        <Button size="sm" variant="ghost" onClick={() => setShowHistory(true)}>
          <History aria-hidden className="size-4" />
          Historial
        </Button>
        {property.status === "PUBLICADA" && (
          <Link
            href={`/propiedades/${property.id}`}
            className={buttonStyles("ghost", "sm")}
          >
            <ExternalLink aria-hidden className="size-4" />
            Ver publicación
          </Link>
        )}
      </div>

      {refusal && !asking && (
        <p role="alert" className="text-sm text-red-600">
          {refusal}
        </p>
      )}

      <ConfirmDialog
        open={asking !== null}
        title={asking?.label ?? ""}
        message={`¿${asking?.label} "${property.title}"? ${asking?.warning ?? ""}`}
        confirmLabel={asking?.label ?? ""}
        isLoading={change.isPending}
        error={refusal}
        onConfirm={() => asking && void apply(asking)}
        onCancel={closeDialog}
      />
      <StatusHistoryDialog
        propertyId={property.id}
        title={property.title}
        open={showHistory}
        onClose={() => setShowHistory(false)}
      />
    </li>
  );
}
