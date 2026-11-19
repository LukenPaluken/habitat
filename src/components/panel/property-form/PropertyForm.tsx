import { Save } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button, buttonStyles } from "@/components/ui/Button";
import { SelectField } from "@/components/ui/Fields";
import { useAction } from "@/hooks/useAction";
import { useForm } from "@/hooks/useForm";
import { onConflict } from "@/lib/api/client";
import type { PropertyInput } from "@/types/api";
import {
  EMPTY_FORM,
  toInput,
  validate,
  type PropertyFormValues,
} from "./property-form-model";
import {
  BasicsSection,
  LocationSection,
  SizeSection,
} from "./PropertyFormSections";
import { TagsField } from "./TagsField";

interface PropertyFormProps {
  initialValues?: PropertyFormValues;
  initialTags?: string[];
  /** Creating also chooses how the property starts (draft or published). */
  mode: "create" | "edit";
  save: (input: PropertyInput) => Promise<unknown>;
  onSaved: (saved: unknown) => void;
}

/** Create / edit form: sections for the fields, one place for validation and saving. */
export function PropertyForm({
  initialValues = EMPTY_FORM,
  initialTags = [],
  mode,
  save,
  onSaved,
}: PropertyFormProps) {
  const form = useForm(initialValues, validate);
  const [tags, setTags] = useState(initialTags);
  const submitAction = useAction(save);

  const submit = form.handleSubmit(async (values) => {
    const saved = await submitAction.run(toInput(values, tags));
    if (saved) onSaved(saved);
  });

  const section = {
    v: form.values,
    errorOf: form.errorOf,
    field: { onChange: form.handleChange, onBlur: form.handleBlur },
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-8">
      <BasicsSection {...section} />
      <LocationSection {...section} />
      <SizeSection {...section}>
        <TagsField selected={tags} onChange={setTags} />
      </SizeSection>

      {mode === "create" && (
        <SelectField
          label="¿Cómo querés empezar?"
          name="status"
          value={form.values.status}
          className="sm:max-w-xs"
          hint="Podés publicarla después desde Mis propiedades."
          {...section.field}
        >
          <option value="BORRADOR">Guardar como borrador</option>
          <option value="PUBLICADA">Publicar ahora</option>
        </SelectField>
      )}

      {submitAction.error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {onConflict(
            submitAction.error,
            "No se puede editar: la propiedad está cerrada o tiene visitas confirmadas pendientes."
          )}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link href="/panel/propiedades" className={buttonStyles("secondary")}>
          Cancelar
        </Link>
        <Button type="submit" isLoading={submitAction.isPending}>
          <Save aria-hidden className="size-4" />
          {mode === "create" ? "Crear propiedad" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
