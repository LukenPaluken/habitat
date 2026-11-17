import { cn } from "@/lib/cn";
import {
  PROPERTY_STATUS_LABEL,
  type PropertyStatus,
  type VisitRequestStatus,
} from "@/lib/seller-types";

// El estado siempre lleva texto además del color (no se lee solo por el tono).

const TONES = {
  neutral: "border-rule-strong bg-paper text-graphite",
  moss: "border-moss/30 bg-moss-wash text-moss",
  ochre: "border-ochre/30 bg-ochre-wash text-ochre",
  slate: "border-slate/30 bg-slate-wash text-slate",
  brick: "border-brick/30 bg-brick-wash text-brick-deep",
  ink: "border-ink bg-ink text-sheet",
} as const;

type Tone = keyof typeof TONES;

function Badge({
  tone,
  children,
  className,
}: {
  tone: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border px-2 py-[3px] font-mono text-[11px] font-medium uppercase leading-none tracking-[0.06em]",
        TONES[tone],
        className
      )}
    >
      <span aria-hidden className="size-1.5 bg-current" />
      {children}
    </span>
  );
}

const PROPERTY_TONE: Record<PropertyStatus, Tone> = {
  BORRADOR: "neutral",
  PUBLICADA: "moss",
  PAUSADA: "ochre",
  RESERVADA: "slate",
  VENDIDA: "ink",
  ALQUILADA: "ink",
  CANCELADA: "brick",
};

export function PropertyStatusBadge({ status }: { status: PropertyStatus }) {
  return (
    <Badge tone={PROPERTY_TONE[status]}>{PROPERTY_STATUS_LABEL[status]}</Badge>
  );
}

const VISIT_TONE: Record<VisitRequestStatus, Tone> = {
  Pendiente: "ochre",
  Confirmada: "moss",
  Realizada: "ink",
  Rechazada: "brick",
  Cancelada: "neutral",
};

export function VisitStatusBadge({ status }: { status: VisitRequestStatus }) {
  return <Badge tone={VISIT_TONE[status]}>{status}</Badge>;
}
