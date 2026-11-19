"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError, errorMessage } from "@/lib/api";
import {
  EMPTY_FORM,
  formFromProperty,
  isLand,
  payloadFromForm,
  validatePropertyForm,
  type PropertyFormErrors,
  type PropertyFormState,
} from "@/lib/property-form";
import { propertyApi } from "@/lib/seller-api";
import {
  CURRENCIES,
  OPERATION_TYPES,
  PROPERTY_TYPES,
  type ApiPropertyDetail,
} from "@/lib/seller-types";
import { PropertyStatusBadge } from "@/components/ui/badges";
import { Button, buttonClasses } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm";
import {
  Field,
  Input,
  Segmented,
  Select,
  Textarea,
} from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { Notice } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { PhotoManager, type PhotoItem } from "./photo-manager";
import { useSeller } from "./seller-shell";
import { TagPicker } from "./tag-picker";

type TextKey = Exclude<
  keyof PropertyFormState,
  "tags" | "propertyType" | "operationType" | "currency"
>;

type Props =
  | { mode: "create" }
  | {
      mode: "edit";
      property: ApiPropertyDetail;
      /** If set, the form is shown read-only with this reason. */
      readOnlyReason?: string;
      onReload: () => Promise<void>;
    };

type Intent = "draft" | "publish" | "save";

const LIST = "/seller/properties";

function withCover(photos: PhotoItem[]): PhotoItem[] {
  return photos.map((photo, index) => ({ ...photo, isCover: index === 0 }));
}

function Section({
  title,
  description,
  id,
  children,
}: {
  title: string;
  description?: string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="grid gap-5 border-t border-rule py-8 md:grid-cols-[13rem_1fr] md:gap-10"
    >
      <div>
        <h2 className="text-xl">{title}</h2>
        {description && (
          <p className="mt-1.5 text-sm text-stone">{description}</p>
        )}
      </div>
      <div className="grid gap-5 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function PropertyForm(props: Props) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const { refreshUnread } = useSeller();
  const formRef = useRef<HTMLFormElement>(null);

  const edit = props.mode === "edit" ? props : null;
  const readOnly = Boolean(edit?.readOnlyReason);

  const [form, setForm] = useState<PropertyFormState>(() =>
    edit ? formFromProperty(edit.property) : EMPTY_FORM
  );
  const [errors, setErrors] = useState<PropertyFormErrors>({});
  const [photosError, setPhotosError] = useState<string | null>(null);
  const [localPhotos, setLocalPhotos] = useState<PhotoItem[]>([]);
  const [submitting, setSubmitting] = useState<Intent | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const land = isLand(form.propertyType);

  const photos: PhotoItem[] = edit
    ? edit.property.images.map((image) => ({
        id: image.id,
        url: image.imageUrl,
        isCover: image.isCover,
      }))
    : localPhotos;

  function set<K extends keyof PropertyFormState>(
    key: K,
    value: PropertyFormState[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  const text =
    (key: TextKey) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      set(key, event.target.value);

  // --- photos ----------------------------------------------------------------

  async function addPhotos(urls: string[]) {
    setPhotosError(null);
    if (!edit) {
      setLocalPhotos((current) => {
        const known = new Set(current.map((photo) => photo.url));
        const added = urls
          .filter((url) => !known.has(url))
          .map((url) => ({ id: url, url, isCover: false }));
        return withCover([...current, ...added]);
      });
      return;
    }
    try {
      for (const url of urls) {
        await propertyApi.addImage(edit.property.id, url);
      }
    } finally {
      await edit.onReload();
    }
  }

  async function setCover(id: string) {
    if (!edit) {
      setLocalPhotos((current) => {
        const chosen = current.find((photo) => photo.id === id);
        return chosen
          ? withCover([chosen, ...current.filter((photo) => photo.id !== id)])
          : current;
      });
      return;
    }
    await propertyApi.setCover(edit.property.id, id);
    await edit.onReload();
  }

  async function removePhoto(id: string) {
    // A property that has left draft status cannot end up without photos.
    const isLastOfLive =
      edit && edit.property.status !== "BORRADOR" && photos.length <= 1;
    if (isLastOfLive) {
      toast.error("Una propiedad publicada necesita al menos una foto.");
      return;
    }
    if (
      !(await confirm({
        title: "¿Quitar esta foto?",
        confirmLabel: "Quitar",
        tone: "danger",
      }))
    ) {
      return;
    }

    if (!edit) {
      setLocalPhotos((current) =>
        withCover(current.filter((photo) => photo.id !== id))
      );
      return;
    }
    await propertyApi.removeImage(edit.property.id, id);
    await edit.onReload();
  }

  // --- saving ----------------------------------------------------------------

  function focusFirstError() {
    window.setTimeout(() => {
      formRef.current
        ?.querySelector<HTMLElement>(
          '[aria-invalid="true"], #fotos[data-invalid="true"]'
        )
        ?.scrollIntoView({ block: "center", behavior: "smooth" });
      formRef.current
        ?.querySelector<HTMLElement>('[aria-invalid="true"]')
        ?.focus({ preventScroll: true });
    }, 0);
  }

  async function submit(intent: Intent) {
    setFormError(null);

    const found = validatePropertyForm(form);
    setErrors(found);

    const missingPhotos = intent === "publish" && photos.length === 0;
    setPhotosError(
      missingPhotos ? "Agregá al menos una foto para poder publicar." : null
    );
    if (Object.keys(found).length > 0 || missingPhotos) {
      focusFirstError();
      return;
    }

    const payload = payloadFromForm(form);
    setSubmitting(intent);

    if (edit) {
      try {
        await propertyApi.update(edit.property.id, payload);
      } catch (error) {
        setSubmitting(null);
        if (
          error instanceof ApiError &&
          Object.keys(error.fieldErrors).length
        ) {
          setErrors(error.fieldErrors as PropertyFormErrors);
          focusFirstError();
        }
        setFormError(errorMessage(error));
        return;
      }
      if (intent === "publish") {
        try {
          await propertyApi.changeStatus(edit.property.id, "PUBLICADA");
          void refreshUnread();
        } catch (error) {
          setSubmitting(null);
          toast.error(
            `Guardamos los cambios, pero no pudimos publicarla: ${errorMessage(error)}`
          );
          await edit.onReload();
          return;
        }
      }
      toast.success(
        intent === "publish"
          ? "Cambios guardados y propiedad publicada."
          : "Cambios guardados."
      );
      router.push(LIST);
      return;
    }

    // Create: save as a draft, upload the photos and only then publish,
    // so a published property never exists without photos.
    let createdId: string | null = null;
    try {
      const { data: created } = await propertyApi.create({
        ...payload,
        status: "BORRADOR",
      });
      createdId = created.id;

      let failed = 0;
      for (const photo of localPhotos) {
        try {
          await propertyApi.addImage(created.id, photo.url);
        } catch {
          failed += 1;
        }
      }
      if (failed > 0) {
        toast.error(
          `Guardamos la propiedad como borrador, pero ${failed} ${failed === 1 ? "foto no pudo agregarse" : "fotos no pudieron agregarse"}. Completalas desde acá.`
        );
        router.replace(`${LIST}/${created.id}/edit`);
        return;
      }

      if (intent === "publish") {
        await propertyApi.changeStatus(created.id, "PUBLICADA");
        void refreshUnread();
      }
      toast.success(
        intent === "publish" ? "Propiedad publicada." : "Guardamos el borrador."
      );
      router.push(LIST);
    } catch (error) {
      setSubmitting(null);
      if (createdId) {
        toast.error(
          `Se guardó como borrador, pero no pudimos publicarla: ${errorMessage(error)}`
        );
        router.replace(`${LIST}/${createdId}/edit`);
        return;
      }
      if (error instanceof ApiError && Object.keys(error.fieldErrors).length) {
        setErrors(error.fieldErrors as PropertyFormErrors);
        focusFirstError();
      }
      setFormError(errorMessage(error));
    }
  }

  const busy = submitting !== null;
  const isDraft = edit?.property.status === "BORRADOR";

  async function deleteDraft() {
    if (!edit) return;
    const accepted = await confirm({
      title: "¿Eliminar este borrador?",
      description: "Se borra junto con sus fotos. No se puede deshacer.",
      confirmLabel: "Eliminar borrador",
      tone: "danger",
    });
    if (!accepted) return;

    setSubmitting("save");
    try {
      await propertyApi.removeDraft(edit.property.id);
      toast.success("Borrador eliminado.");
      router.push(LIST);
    } catch (error) {
      setSubmitting(null);
      toast.error(errorMessage(error));
    }
  }

  return (
    <>
      <Link
        href={LIST}
        className="mb-6 inline-block text-sm text-stone underline-offset-4 hover:text-ink hover:underline"
      >
        ← Mis propiedades
      </Link>

      <PageHeader
        kicker={edit ? "Edición" : "Alta"}
        title={edit ? "Editar propiedad" : "Nueva propiedad"}
        actions={edit && <PropertyStatusBadge status={edit.property.status} />}
      >
        {edit
          ? edit.property.title
          : "Guardala como borrador para seguir después, o publicala cuando esté lista."}
      </PageHeader>

      {edit?.readOnlyReason && (
        <div className="mb-6">
          <Notice tone="warning">{edit.readOnlyReason}</Notice>
        </div>
      )}

      <form
        ref={formRef}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (!readOnly) void submit(edit ? "save" : "draft");
        }}
      >
        <fieldset disabled={readOnly || busy} className="min-w-0">
          <Section
            title="La propiedad"
            description="Lo primero que ve el interesado."
          >
            <Field
              label="Título"
              error={errors.title}
              className="sm:col-span-2"
            >
              {(control) => (
                <Input
                  {...control}
                  value={form.title}
                  onChange={text("title")}
                  placeholder="Ej. Departamento 2 ambientes con balcón"
                  maxLength={120}
                />
              )}
            </Field>

            <Field label="Tipo">
              {(control) => (
                <Select
                  {...control}
                  value={form.propertyType}
                  onChange={(event) =>
                    set(
                      "propertyType",
                      event.target.value as PropertyFormState["propertyType"]
                    )
                  }
                >
                  {PROPERTY_TYPES.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </Select>
              )}
            </Field>

            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium">Operación</span>
              <Segmented
                label="Operación"
                value={form.operationType}
                options={OPERATION_TYPES.map((value) => ({
                  value,
                  label: value,
                }))}
                onChange={(value) => set("operationType", value)}
                disabled={readOnly || busy}
              />
            </div>

            <Field
              label="Descripción"
              error={errors.description}
              className="sm:col-span-2"
            >
              {(control) => (
                <Textarea
                  {...control}
                  rows={5}
                  value={form.description}
                  onChange={text("description")}
                  placeholder="Distribución, estado, luminosidad, qué incluye…"
                />
              )}
            </Field>
          </Section>

          <Section
            title="Precio"
            description={
              form.operationType === "Alquiler"
                ? "Se muestra como valor mensual."
                : "Se muestra como precio de venta."
            }
          >
            <div className="grid grid-cols-[6.5rem_1fr] gap-3 sm:col-span-2 sm:max-w-md">
              <Field label="Moneda">
                {(control) => (
                  <Select
                    {...control}
                    value={form.currency}
                    onChange={(event) =>
                      set(
                        "currency",
                        event.target.value as PropertyFormState["currency"]
                      )
                    }
                  >
                    {CURRENCIES.map((currency) => (
                      <option key={currency}>{currency}</option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label="Precio" error={errors.price}>
                {(control) => (
                  <Input
                    {...control}
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    value={form.price}
                    onChange={text("price")}
                  />
                )}
              </Field>
            </div>
          </Section>

          <Section title="Ubicación">
            <Field
              label="Dirección"
              error={errors.address}
              hint="Calle y altura."
            >
              {(control) => (
                <Input
                  {...control}
                  value={form.address}
                  onChange={text("address")}
                  autoComplete="off"
                />
              )}
            </Field>
            <Field label="Zona o barrio" error={errors.neighborhood}>
              {(control) => (
                <Input
                  {...control}
                  value={form.neighborhood}
                  onChange={text("neighborhood")}
                  autoComplete="off"
                />
              )}
            </Field>
          </Section>

          <Section
            title="Características"
            description={
              land ? "Un terreno solo informa su superficie." : undefined
            }
          >
            {!land && (
              <Field
                label="Superficie cubierta (m²)"
                optional
                error={errors.coveredArea}
              >
                {(control) => (
                  <Input
                    {...control}
                    type="number"
                    inputMode="numeric"
                    min="1"
                    step="1"
                    value={form.coveredArea}
                    onChange={text("coveredArea")}
                  />
                )}
              </Field>
            )}
            <Field
              label={
                land ? "Superficie del terreno (m²)" : "Superficie total (m²)"
              }
              optional
              error={errors.totalArea}
            >
              {(control) => (
                <Input
                  {...control}
                  type="number"
                  inputMode="numeric"
                  min="1"
                  step="1"
                  value={form.totalArea}
                  onChange={text("totalArea")}
                />
              )}
            </Field>

            {!land && (
              <>
                <Field label="Ambientes" optional error={errors.rooms}>
                  {(control) => (
                    <Input
                      {...control}
                      type="number"
                      inputMode="numeric"
                      min="1"
                      step="1"
                      value={form.rooms}
                      onChange={text("rooms")}
                    />
                  )}
                </Field>
                <Field label="Dormitorios" optional error={errors.bedrooms}>
                  {(control) => (
                    <Input
                      {...control}
                      type="number"
                      inputMode="numeric"
                      min="0"
                      step="1"
                      value={form.bedrooms}
                      onChange={text("bedrooms")}
                    />
                  )}
                </Field>
                <Field label="Baños" optional error={errors.bathrooms}>
                  {(control) => (
                    <Input
                      {...control}
                      type="number"
                      inputMode="numeric"
                      min="0"
                      step="1"
                      value={form.bathrooms}
                      onChange={text("bathrooms")}
                    />
                  )}
                </Field>
              </>
            )}
            <Field label="Antigüedad (años)" optional error={errors.age}>
              {(control) => (
                <Input
                  {...control}
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  value={form.age}
                  onChange={text("age")}
                />
              )}
            </Field>
          </Section>

          <Section
            title="Amenities"
            description="Los filtros de búsqueda usan estas etiquetas."
          >
            <div className="sm:col-span-2">
              <TagPicker
                value={form.tags}
                onChange={(tags) => set("tags", tags)}
                disabled={readOnly || busy}
              />
            </div>
          </Section>
        </fieldset>

        <Section
          id="fotos"
          title="Fotos"
          description="Mínimo una para publicar. La primera es la portada."
        >
          <div
            className="sm:col-span-2"
            data-invalid={photosError ? "true" : undefined}
            id="fotos-body"
          >
            {photosError && (
              <p
                role="alert"
                className="mb-4 border-l-4 border-brick bg-brick-wash px-4 py-3 text-sm text-brick-deep"
              >
                {photosError}
              </p>
            )}
            <PhotoManager
              photos={photos}
              disabled={readOnly || busy}
              onAdd={addPhotos}
              onSetCover={setCover}
              onRemove={removePhoto}
            />
          </div>
        </Section>

        {formError && (
          <p
            role="alert"
            className="mb-4 border-l-4 border-brick bg-brick-wash px-4 py-3 text-sm text-brick-deep"
          >
            {formError}
          </p>
        )}

        <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-2 border-t border-ink bg-sheet px-4 py-3 sm:mx-0 sm:px-5">
          {readOnly ? (
            <Link href={LIST} className={buttonClasses({ variant: "ink" })}>
              Volver a mis propiedades
            </Link>
          ) : (
            <>
              {edit ? (
                <>
                  <Button
                    type="submit"
                    variant={isDraft ? "outline" : "ink"}
                    loading={submitting === "save"}
                    disabled={busy}
                  >
                    Guardar cambios
                  </Button>
                  {isDraft && (
                    <Button
                      variant="primary"
                      loading={submitting === "publish"}
                      disabled={busy}
                      onClick={() => submit("publish")}
                    >
                      Guardar y publicar
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button
                    type="submit"
                    variant="outline"
                    loading={submitting === "draft"}
                    disabled={busy}
                  >
                    Guardar borrador
                  </Button>
                  <Button
                    variant="primary"
                    loading={submitting === "publish"}
                    disabled={busy}
                    onClick={() => submit("publish")}
                  >
                    Publicar
                  </Button>
                </>
              )}
              {isDraft && (
                <Button
                  variant="danger"
                  className="sm:ml-auto"
                  disabled={busy}
                  onClick={deleteDraft}
                >
                  Eliminar borrador
                </Button>
              )}
              <Link
                href={LIST}
                className={buttonClasses({ variant: "ghost" })}
                aria-disabled={busy}
              >
                Cancelar
              </Link>
            </>
          )}
        </div>
      </form>
    </>
  );
}
