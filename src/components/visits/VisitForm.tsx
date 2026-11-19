import { CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TextAreaField, TextField } from "@/components/ui/Fields";
import { useAction } from "@/hooks/useAction";
import { useForm } from "@/hooks/useForm";
import { requestVisit } from "@/lib/api/properties";
import { toDateTimeLocalValue } from "@/lib/format";
import type { VisitRequestInput } from "@/types/api";

const INITIAL = {
  requesterName: "",
  requesterPhone: "",
  proposedDate: "",
  message: "",
};
type Values = typeof INITIAL;

const MIN_PHONE_DIGITS = 6;

function validate(values: Values) {
  const errors: Partial<Record<keyof Values, string>> = {};

  if (!values.requesterName.trim()) errors.requesterName = "Ingresá tu nombre.";
  else if (values.requesterName.trim().length > 100)
    errors.requesterName = "Máximo 100 caracteres.";

  const digits = values.requesterPhone.replace(/\D/g, "").length;
  if (!values.requesterPhone.trim())
    errors.requesterPhone = "Ingresá un teléfono de contacto.";
  else if (
    digits < MIN_PHONE_DIGITS ||
    values.requesterPhone.trim().length > 40
  ) {
    errors.requesterPhone = `Ingresá un teléfono válido (al menos ${MIN_PHONE_DIGITS} dígitos).`;
  }

  const date = new Date(values.proposedDate);
  if (!values.proposedDate || Number.isNaN(date.getTime())) {
    errors.proposedDate = "Elegí el día y la hora que te queda cómodo.";
  } else if (date.getTime() <= Date.now()) {
    errors.proposedDate = "La fecha tiene que ser futura.";
  }

  if (values.message.trim().length > 1000)
    errors.message = "Máximo 1000 caracteres.";
  return errors;
}

interface VisitFormProps {
  propertyId: string;
  agencyName: string;
  agencyPhone: string;
  onDone: () => void;
}

/** Asks for a visit with the minimum a seller needs: name, phone and when. */
export function VisitForm({
  propertyId,
  agencyName,
  agencyPhone,
  onDone,
}: VisitFormProps) {
  const form = useForm(INITIAL, validate);
  const visit = useAction((input: VisitRequestInput) =>
    requestVisit(propertyId, input)
  );

  const submit = form.handleSubmit(async (values) => {
    await visit.run({
      requesterName: values.requesterName.trim(),
      requesterPhone: values.requesterPhone.trim(),
      proposedDate: new Date(values.proposedDate).toISOString(),
      message: values.message.trim() || undefined,
    });
  });

  if (visit.isSuccess) {
    return (
      <div role="status" className="space-y-4 text-center">
        <CalendarCheck aria-hidden className="mx-auto size-12 text-brand-600" />
        <p className="text-lg font-semibold text-slate-900">
          ¡Solicitud enviada!
        </p>
        <p className="text-sm text-slate-600">
          {agencyName} la va a revisar y te contacta al{" "}
          {form.values.requesterPhone} para confirmar.
          {agencyPhone &&
            ` Si preferís adelantarte, también podés llamar al ${agencyPhone}.`}
        </p>
        <Button onClick={onDone}>Listo</Button>
      </div>
    );
  }

  // The server has the last word on the date too (its clock, its rules): when it
  // rejects it, the message goes on that field, not in a generic banner.
  const serverRejectedDate =
    visit.error?.status === 400 &&
    visit.error.invalidFields.includes("proposedDate");

  const field = {
    onChange: (event: Parameters<typeof form.handleChange>[0]) => {
      if (visit.error) visit.reset(); // what was rejected is being edited
      form.handleChange(event);
    },
    onBlur: form.handleBlur,
  };
  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <TextField
        label="Tu nombre"
        name="requesterName"
        autoComplete="name"
        value={form.values.requesterName}
        error={form.errorOf("requesterName")}
        {...field}
      />
      <TextField
        label="Tu teléfono"
        name="requesterPhone"
        type="tel"
        autoComplete="tel"
        hint="Lo usa la inmobiliaria para coordinar la visita."
        value={form.values.requesterPhone}
        error={form.errorOf("requesterPhone")}
        {...field}
      />
      <TextField
        label="Día y hora propuestos"
        name="proposedDate"
        type="datetime-local"
        min={toDateTimeLocalValue(new Date())}
        value={form.values.proposedDate}
        error={
          form.errorOf("proposedDate") ??
          (serverRejectedDate
            ? "La fecha tiene que ser futura (el servidor no aceptó esa)."
            : undefined)
        }
        {...field}
      />
      <TextAreaField
        label="Mensaje (opcional)"
        name="message"
        placeholder="Ej.: puedo solo por la tarde"
        value={form.values.message}
        error={form.errorOf("message")}
        {...field}
      />

      {visit.error && !serverRejectedDate && (
        <p role="alert" className="text-sm text-red-600">
          {visit.error.message}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={visit.isPending}>
          Enviar solicitud
        </Button>
      </div>
    </form>
  );
}
