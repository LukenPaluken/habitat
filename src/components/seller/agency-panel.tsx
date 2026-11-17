"use client";

import { useRef, useState } from "react";
import { errorMessage, ApiError } from "@/lib/api";
import { initialsOf } from "@/lib/format";
import { agencyApi } from "@/lib/seller-api";
import { uploadImages } from "@/lib/upload";
import type { ApiAgency } from "@/lib/seller-types";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Photo } from "@/components/ui/photo";
import { useToast } from "@/components/ui/toast";
import { useSeller } from "./seller-shell";

// "Mi inmobiliaria": resumen siempre a la vista y, al editar, el formulario en
// el mismo lugar. Vive dentro de Mis propiedades, como pide el alcance.

function Logo({ agency, size }: { agency: ApiAgency; size: string }) {
  return agency.logoUrl ? (
    <Photo
      src={agency.logoUrl}
      alt={`Logo de ${agency.fantasyName}`}
      className={size}
    />
  ) : (
    <div
      aria-hidden
      className={`${size} grid shrink-0 place-items-center bg-ink font-serif text-xl text-sheet`}
    >
      {initialsOf(agency.fantasyName)}
    </div>
  );
}

export function AgencyPanel() {
  const { agency } = useSeller();
  const [editing, setEditing] = useState(false);

  return (
    <section
      aria-labelledby="agency-title"
      className="mb-10 border border-rule bg-sheet"
    >
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:p-6">
        <Logo agency={agency} size="size-16 shrink-0" />

        <div className="min-w-0 flex-1">
          <p className="kicker">Mi inmobiliaria</p>
          <h2 id="agency-title" className="mt-1 text-2xl">
            {agency.fantasyName}
          </h2>
          <p className="mt-1.5 line-clamp-2 max-w-2xl text-sm text-graphite">
            {agency.description}
          </p>
          <dl className="mt-3 flex flex-wrap gap-x-7 gap-y-1 font-mono text-xs text-stone">
            <div className="flex gap-2">
              <dt className="sr-only">Teléfono</dt>
              <dd>{agency.phone}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="sr-only">Email</dt>
              <dd>{agency.email}</dd>
            </div>
            {agency.address && (
              <div className="flex gap-2">
                <dt className="sr-only">Dirección</dt>
                <dd>{agency.address}</dd>
              </div>
            )}
          </dl>
        </div>

        {!editing && (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            Editar datos
          </Button>
        )}
      </div>

      {editing && <AgencyForm onClose={() => setEditing(false)} />}
    </section>
  );
}

function isUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function AgencyForm({ onClose }: { onClose: () => void }) {
  const { agency, setAgency, signOut } = useSeller();
  const toast = useToast();
  const confirm = useConfirm();

  const [description, setDescription] = useState(agency.description);
  const [phone, setPhone] = useState(agency.phone);
  const [address, setAddress] = useState(agency.address ?? "");
  const [logoUrl, setLogoUrl] = useState(agency.logoUrl ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  async function onSave(event: React.FormEvent) {
    event.preventDefault();

    const next: Record<string, string> = {};
    if (!description.trim()) next.description = "La descripción es requerida.";
    if (phone.trim().length < 6) {
      next.phone = "El teléfono debe tener al menos 6 caracteres.";
    }
    if (logoUrl.trim() && !isUrl(logoUrl.trim())) {
      next.logoUrl = "Ingresá una URL válida (https://…).";
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      const { data } = await agencyApi.update({
        description: description.trim(),
        phone: phone.trim(),
        address: address.trim() || null,
        logoUrl: logoUrl.trim() || null,
      });
      setAgency(data);
      toast.success("Guardamos los datos de la inmobiliaria.");
      onClose();
    } catch (error) {
      if (error instanceof ApiError && Object.keys(error.fieldErrors).length) {
        setErrors(error.fieldErrors);
      }
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function onPickLogo(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    try {
      const [url] = await uploadImages([file]);
      setLogoUrl(url);
    } catch (error) {
      toast.error(
        `No pudimos subir el logo (${errorMessage(error)}). Probá pegando una URL.`
      );
    } finally {
      setUploading(false);
    }
  }

  async function onDelete() {
    const accepted = await confirm({
      title: "Eliminar la inmobiliaria",
      description: (
        <>
          <p>
            Se borran la inmobiliaria y todo lo que cuelga de ella: propiedades,
            fotos, consultas, visitas y reseñas. No se puede deshacer.
          </p>
        </>
      ),
      confirmLabel: "Eliminar definitivamente",
      tone: "danger",
      requireText: agency.fantasyName,
    });
    if (!accepted) return;

    try {
      await agencyApi.remove();
      toast.success("La inmobiliaria fue eliminada.");
      await signOut();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <div className="animate-rise border-t border-rule">
      <form
        onSubmit={onSave}
        noValidate
        className="grid gap-5 p-5 sm:p-6 md:grid-cols-2"
      >
        <Field
          label="Nombre de fantasía"
          hint="Es único en la plataforma, por eso no se puede cambiar."
        >
          {(control) => (
            <Input {...control} value={agency.fantasyName} disabled readOnly />
          )}
        </Field>

        <Field label="Email de contacto" hint="Es el de tu cuenta.">
          {(control) => (
            <Input {...control} value={agency.email} disabled readOnly />
          )}
        </Field>

        <Field label="Teléfono de contacto" error={errors.phone}>
          {(control) => (
            <Input
              {...control}
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          )}
        </Field>

        <Field label="Dirección de la oficina" optional error={errors.address}>
          {(control) => (
            <Input
              {...control}
              value={address}
              onChange={(event) => setAddress(event.target.value)}
            />
          )}
        </Field>

        <Field
          label="Descripción"
          error={errors.description}
          className="md:col-span-2"
        >
          {(control) => (
            <Textarea
              {...control}
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          )}
        </Field>

        <div className="md:col-span-2">
          <Field label="Logo" optional error={errors.logoUrl}>
            {(control) => (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  {...control}
                  type="url"
                  inputMode="url"
                  placeholder="https://…"
                  value={logoUrl}
                  onChange={(event) => setLogoUrl(event.target.value)}
                />
                <Button
                  variant="outline"
                  loading={uploading}
                  onClick={() => fileInput.current?.click()}
                >
                  Subir imagen
                </Button>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={onPickLogo}
                />
              </div>
            )}
          </Field>
        </div>

        <div className="flex gap-2 md:col-span-2">
          <Button type="submit" variant="ink" loading={saving}>
            Guardar cambios
          </Button>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
        </div>
      </form>

      <div className="flex flex-col gap-3 border-t border-rule bg-paper/60 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="max-w-xl">
          <h3 className="text-lg">Eliminar la inmobiliaria</h3>
          <p className="mt-1 text-sm text-stone">
            Solo se puede cuando no tenés propiedades Publicadas ni Reservadas.
          </p>
        </div>
        <Button variant="danger" size="sm" onClick={onDelete}>
          Eliminar inmobiliaria
        </Button>
      </div>
    </div>
  );
}
