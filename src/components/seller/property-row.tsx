"use client";

import Link from "next/link";
import { formatPrice } from "@/lib/format";
import {
  FROZEN_STATUSES,
  type ApiProperty,
  type PropertyStatus,
} from "@/lib/seller-types";
import { buttonClasses, Button } from "@/components/ui/button";
import { PropertyStatusBadge } from "@/components/ui/badges";
import type { ConfirmOptions } from "@/components/ui/confirm";
import { Photo } from "@/components/ui/photo";

// Qué botones de estado ofrece cada fila. Es el mismo grafo que valida el
// servidor (PUBLICADA -> PAUSADA / RESERVADA …); el servidor sigue siendo quien
// manda, esto solo evita mostrar botones que siempre terminarían en 409.

export interface StatusAction {
  label: string;
  /** Estado destino; sin él, la acción elimina el borrador. */
  to?: PropertyStatus;
  variant: "ink" | "outline" | "danger";
  confirm?: ConfirmOptions;
}

export function actionsFor(property: ApiProperty): StatusAction[] {
  const cancel: StatusAction = {
    label: "Dar de baja",
    to: "CANCELADA",
    variant: "danger",
    confirm: {
      title: `¿Dar de baja “${property.title}”?`,
      description:
        "Pasa a Cancelada y deja de mostrarse. Es definitivo: no se puede volver a publicar ni editar.",
      confirmLabel: "Dar de baja",
      tone: "danger",
    },
  };

  switch (property.status) {
    case "BORRADOR":
      return [
        { label: "Publicar", to: "PUBLICADA", variant: "ink" },
        {
          label: "Eliminar borrador",
          variant: "danger",
          confirm: {
            title: `¿Eliminar el borrador “${property.title}”?`,
            description: "Se borra junto con sus fotos. No se puede deshacer.",
            confirmLabel: "Eliminar borrador",
            tone: "danger",
          },
        },
      ];
    case "PUBLICADA":
      return [
        { label: "Pausar", to: "PAUSADA", variant: "outline" },
        { label: "Marcar reservada", to: "RESERVADA", variant: "outline" },
        cancel,
      ];
    case "PAUSADA":
      return [{ label: "Republicar", to: "PUBLICADA", variant: "ink" }, cancel];
    case "RESERVADA": {
      const sale = property.operationType === "Venta";
      const closed: PropertyStatus = sale ? "VENDIDA" : "ALQUILADA";
      return [
        {
          label: sale ? "Marcar vendida" : "Marcar alquilada",
          to: closed,
          variant: "ink",
          confirm: {
            title: sale ? "¿Marcar como vendida?" : "¿Marcar como alquilada?",
            description: `“${property.title}” queda cerrada y ya no se puede editar. Esta acción es definitiva.`,
            confirmLabel: sale ? "Marcar vendida" : "Marcar alquilada",
          },
        },
        cancel,
      ];
    }
    default:
      return [];
  }
}

export function PropertyRow({
  property,
  busy,
  onAction,
}: {
  property: ApiProperty;
  busy: boolean;
  onAction: (property: ApiProperty, action: StatusAction) => void;
}) {
  const cover =
    property.images.find((image) => image.isCover) ?? property.images[0];
  const frozen = FROZEN_STATUSES.includes(property.status);
  const noPhotos = property.images.length === 0;
  const actions = actionsFor(property);

  const facts = [
    property.coveredArea ? `${property.coveredArea} m² cub.` : null,
    property.totalArea ? `${property.totalArea} m² tot.` : null,
    property.rooms ? `${property.rooms} amb.` : null,
  ].filter(Boolean);

  return (
    <li
      className={`grid grid-cols-[6.5rem_1fr] gap-x-4 gap-y-3 py-5 sm:grid-cols-[8.5rem_1fr_auto] sm:gap-x-6 ${busy ? "opacity-60" : ""}`}
    >
      <Photo
        src={cover?.imageUrl}
        alt={cover ? `Foto de ${property.title}` : "Sin foto"}
        className="h-20 w-full sm:h-[6.25rem]"
      />

      <div className="min-w-0">
        <Link
          href={`/vendedor/propiedades/${property.id}/editar`}
          className="font-medium leading-snug text-ink underline-offset-4 hover:underline"
        >
          {property.title}
        </Link>
        <p className="mt-1 font-mono text-xs text-stone">
          {property.propertyType} · {property.operationType} ·{" "}
          {property.neighborhood}
        </p>
        {facts.length > 0 && (
          <p className="mt-0.5 font-mono text-xs text-stone">
            {facts.join(" · ")}
          </p>
        )}
        <p className="mt-2 text-xs text-stone">
          {noPhotos ? (
            <span className="text-ochre">
              Sin fotos: agregá al menos una para publicar.
            </span>
          ) : (
            `${property.images.length} ${property.images.length === 1 ? "foto" : "fotos"}`
          )}
        </p>
      </div>

      <div className="col-span-2 flex items-center justify-between gap-3 sm:col-span-1 sm:flex-col sm:items-end sm:justify-start">
        <p className="font-serif text-xl leading-none">
          {formatPrice(
            property.price,
            property.currency,
            property.operationType
          )}
        </p>
        <PropertyStatusBadge status={property.status} />
      </div>

      <div className="col-span-2 flex flex-wrap gap-2 sm:col-start-2">
        <Link
          href={`/vendedor/propiedades/${property.id}/editar`}
          className={buttonClasses({ variant: "outline", size: "sm" })}
        >
          {frozen ? "Ver" : "Editar"}
        </Link>
        {actions.map((action) => (
          <Button
            key={action.label}
            variant={action.variant}
            size="sm"
            disabled={
              busy ||
              (noPhotos &&
                property.status === "BORRADOR" &&
                action.to === "PUBLICADA")
            }
            onClick={() => onAction(property, action)}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </li>
  );
}
