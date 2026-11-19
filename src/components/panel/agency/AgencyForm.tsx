import { Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TextAreaField, TextField } from "@/components/ui/Fields";
import { useAction } from "@/hooks/useAction";
import { useForm } from "@/hooks/useForm";
import { updateOwnAgency } from "@/lib/api/agencies";
import { EMAIL_PATTERN, hasEnoughDigits } from "@/lib/validation";
import type { AgencyUpdate, OwnAgency } from "@/types/api";

type Values = {
  description: string;
  email: string;
  phone: string;
  address: string;
  logoUrl: string;
};

function validateFor(agency: OwnAgency) {
  return ({ description, email, phone, address, logoUrl }: Values) => {
    const errors: Partial<Record<keyof Values, string>> = {};
    if (!EMAIL_PATTERN.test(email.trim()))
      errors.email = "Ingresá un email válido.";
    if (!description.trim())
      errors.description = "La descripción es obligatoria.";
    // The contact phone can't be emptied once there is one.
    if (phone.trim() ? !hasEnoughDigits(phone) : agency.phone !== "") {
      errors.phone = "Ingresá un teléfono válido (al menos 6 dígitos).";
    }
    if (logoUrl.trim() && !/^https?:\/\//.test(logoUrl.trim())) {
      errors.logoUrl = "Ingresá una URL que empiece con http:// o https://";
    }
    if (address.length > 200) errors.address = "Máximo 200 caracteres.";
    return errors;
  };
}

export function AgencyForm({
  agency,
  onSaved,
}: {
  agency: OwnAgency;
  onSaved: () => void;
}) {
  const form = useForm<Values>(
    {
      description: agency.description,
      email: agency.email,
      phone: agency.phone,
      address: agency.address ?? "",
      logoUrl: agency.logoUrl ?? "",
    },
    validateFor(agency)
  );
  const save = useAction((input: AgencyUpdate) => updateOwnAgency(input));

  const submit = form.handleSubmit(async (v) => {
    const saved = await save.run({
      description: v.description.trim(),
      email: v.email.trim(),
      ...(v.phone.trim() && { phone: v.phone.trim() }),
      address: v.address.trim() || null,
      logoUrl: v.logoUrl.trim() || null,
    });
    if (saved) onSaved();
  });

  const field = { onChange: form.handleChange, onBlur: form.handleBlur };
  return (
    <form
      onSubmit={submit}
      noValidate
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-5"
    >
      <TextField
        label="Nombre de fantasía"
        name="fantasyName"
        value={agency.fantasyName}
        disabled
        readOnly
        hint="Es único en la plataforma y no se puede cambiar."
      />
      <TextAreaField
        label="Descripción"
        name="description"
        rows={4}
        value={form.values.description}
        error={form.errorOf("description")}
        {...field}
      />
      <TextField
        label="Email de contacto"
        name="email"
        type="email"
        value={form.values.email}
        error={form.errorOf("email")}
        hint="Es público y puede ser distinto del email con el que ingresás."
        {...field}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Teléfono de contacto"
          name="phone"
          type="tel"
          value={form.values.phone}
          error={form.errorOf("phone")}
          hint="Es público: así te llaman para coordinar visitas."
          {...field}
        />
        <TextField
          label="Dirección de la oficina (opcional)"
          name="address"
          value={form.values.address}
          error={form.errorOf("address")}
          {...field}
        />
      </div>
      <TextField
        label="URL del logo (opcional)"
        name="logoUrl"
        value={form.values.logoUrl}
        error={form.errorOf("logoUrl")}
        placeholder="https://…"
        {...field}
      />

      {save.error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {save.error.message}
        </p>
      )}
      <Button type="submit" isLoading={save.isPending}>
        <Save aria-hidden className="size-4" />
        Guardar cambios
      </Button>
    </form>
  );
}
