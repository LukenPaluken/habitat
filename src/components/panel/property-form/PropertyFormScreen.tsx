"use client";

import { Building2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { buttonStyles } from "@/components/ui/Button";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { useProperty } from "@/hooks/useProperties";
import { createProperty, updateProperty } from "@/lib/api/properties";
import { isEditable } from "@/lib/property-lifecycle";
import { STATUS_LABELS } from "@/lib/property-options";
import type { PropertyInput } from "@/types/api";
import { PageHeader } from "../PageHeader";
import { usePanel } from "../PanelContext";
import { GalleryManager } from "./GalleryManager";
import { PropertyForm } from "./PropertyForm";
import { fromProperty } from "./property-form-model";

const BACK_TO_LIST = (
  <Link href="/panel/propiedades" className={buttonStyles()}>
    Volver a Mis propiedades
  </Link>
);

/** New property: just the form. Its photos come once it exists. */
function NewProperty() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nueva propiedad"
        description="Después de crearla vas a poder cargar las fotos."
      />
      <PropertyForm
        mode="create"
        save={createProperty}
        // Straight to the photos: that is the next thing a new property needs.
        onSaved={(saved) =>
          router.replace(
            `/panel/propiedades/${(saved as { id: string }).id}/editar`
          )
        }
      />
    </div>
  );
}

/** Edit: the form preloaded with what is saved, and the gallery. */
function EditProperty({ id }: { id: string }) {
  const router = useRouter();
  const { agency } = usePanel();
  const { property, error, reload } = useProperty(id);

  if (error) {
    return error.status === 404 || error.status === 400 ? (
      <EmptyState
        icon={Building2}
        title="No encontramos esta propiedad"
        action={BACK_TO_LIST}
      />
    ) : (
      <ErrorState message={error.message} onRetry={reload} />
    );
  }
  if (!property) return <LoadingState label="Cargando propiedad…" />;

  // Public details come back for any property: only its own agency may edit it.
  if (property.agency.id !== agency.id) {
    return (
      <EmptyState
        icon={Building2}
        title="Esta propiedad no es de tu inmobiliaria"
        action={BACK_TO_LIST}
      />
    );
  }
  if (!isEditable(property.status)) {
    return (
      <EmptyState
        icon={Building2}
        title={`Una propiedad ${STATUS_LABELS[property.status].toLowerCase()} no se puede editar`}
        description="Ya cerró su ciclo: sus datos quedan como están."
        action={BACK_TO_LIST}
      />
    );
  }

  const { values, tags } = fromProperty(property);
  return (
    <div className="space-y-6">
      <PageHeader title="Editar propiedad" description={property.title} />
      <PropertyForm
        mode="edit"
        initialValues={values}
        initialTags={tags}
        save={({ status: _ignored, ...input }: PropertyInput) =>
          updateProperty(id, input)
        }
        onSaved={() => router.push("/panel/propiedades")}
      />
      <GalleryManager
        propertyId={id}
        images={property.images}
        onChanged={reload}
      />
    </div>
  );
}

export function PropertyFormScreen({ id }: { id?: string }) {
  // `key`: going from one property to another must not keep the old form's state.
  return id ? <EditProperty key={id} id={id} /> : <NewProperty />;
}
