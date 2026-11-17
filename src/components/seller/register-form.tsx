"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { ApiError, errorMessage, request } from "@/lib/api";
import { registerSellerSchema } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { PasswordInput } from "./password-input";

interface FormState {
  name: string;
  email: string;
  password: string;
  fantasyName: string;
  phone: string;
  address: string;
  description: string;
}

type Errors = Partial<Record<keyof FormState, string>>;

const INITIAL: FormState = {
  name: "",
  email: "",
  password: "",
  fantasyName: "",
  phone: "",
  address: "",
  description: "",
};

export function RegisterForm() {
  const router = useRouter();
  const toast = useToast();

  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set =
    (field: keyof FormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((current) => ({ ...current, [field]: event.target.value }));

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);

    // Los opcionales vacíos no se mandan: el esquema los toma como ausentes.
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      fantasyName: form.fantasyName.trim(),
      phone: form.phone.trim(),
      ...(form.address.trim() && { address: form.address.trim() }),
      ...(form.description.trim() && { description: form.description.trim() }),
    };

    const parsed = registerSellerSchema.safeParse(payload);
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      const next: Errors = {};
      for (const [field, messages] of Object.entries(flat)) {
        next[field as keyof FormState] = messages?.[0];
      }
      setErrors(next);
      return;
    }
    setErrors({});
    setSubmitting(true);

    try {
      // Crea el usuario y la inmobiliaria en un solo paso…
      await request("POST", "/api/auth/register-seller", parsed.data);
    } catch (error) {
      setSubmitting(false);
      const message = errorMessage(error);
      if (error instanceof ApiError && error.status === 409) {
        // …y el conflicto dice cuál de los dos datos únicos ya existe.
        if (/fantas/i.test(message)) setErrors({ fantasyName: message });
        else if (/correo|email/i.test(message)) setErrors({ email: message });
        else setFormError(message);
      } else {
        setFormError(message);
      }
      return;
    }

    // El registro no abre sesión por sí solo: entramos con las mismas credenciales.
    const { error } = await authClient.signIn.email({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    if (error) {
      toast.success("Tu inmobiliaria quedó creada. Ingresá para continuar.");
      router.replace("/vendedor/login");
      return;
    }

    toast.success(`Listo: ${parsed.data.fantasyName} ya está en Habitat.`);
    router.replace("/vendedor/propiedades");
    router.refresh();
  }

  return (
    <>
      <p className="kicker mb-3">Registro de vendedores</p>
      <h1 className="text-4xl leading-[1.1]">Creá tu inmobiliaria</h1>
      <p className="mt-3 text-stone">
        Con un solo registro creás tu cuenta y la página pública de tu
        inmobiliaria.
      </p>

      <form onSubmit={onSubmit} noValidate className="mt-8 flex flex-col gap-5">
        <Field label="Nombre y apellido" error={errors.name}>
          {(control) => (
            <Input
              {...control}
              name="name"
              autoComplete="name"
              value={form.name}
              onChange={set("name")}
            />
          )}
        </Field>

        <Field label="Email" error={errors.email}>
          {(control) => (
            <Input
              {...control}
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              value={form.email}
              onChange={set("email")}
            />
          )}
        </Field>

        <Field
          label="Contraseña"
          error={errors.password}
          hint="Mínimo 8 caracteres."
        >
          {(control) => (
            <PasswordInput
              {...control}
              name="password"
              autoComplete="new-password"
              value={form.password}
              onChange={set("password")}
            />
          )}
        </Field>

        <div className="border-t border-rule pt-5">
          <Field
            label="Nombre de fantasía de la inmobiliaria"
            error={errors.fantasyName}
            hint="Es único en toda la plataforma y no se puede cambiar después."
          >
            {(control) => (
              <Input
                {...control}
                name="fantasyName"
                autoComplete="organization"
                value={form.fantasyName}
                onChange={set("fantasyName")}
              />
            )}
          </Field>
        </div>

        <Field
          label="Teléfono de contacto"
          error={errors.phone}
          hint="Se muestra en tu página pública: las visitas se coordinan por llamada o WhatsApp."
        >
          {(control) => (
            <Input
              {...control}
              type="tel"
              name="phone"
              autoComplete="tel"
              inputMode="tel"
              value={form.phone}
              onChange={set("phone")}
            />
          )}
        </Field>

        <details className="group border border-rule bg-sheet">
          <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium text-graphite marker:content-none">
            <span className="mr-2 inline-block transition-transform group-open:rotate-90">
              ›
            </span>
            Más datos de la inmobiliaria{" "}
            <span className="font-normal text-stone">(opcional)</span>
          </summary>
          <div className="flex flex-col gap-5 border-t border-rule p-4">
            <Field label="Dirección de la oficina" error={errors.address}>
              {(control) => (
                <Input
                  {...control}
                  name="address"
                  autoComplete="street-address"
                  value={form.address}
                  onChange={set("address")}
                />
              )}
            </Field>
            <Field
              label="Descripción"
              error={errors.description}
              hint="Contale a los interesados quiénes son y en qué zonas trabajan."
            >
              {(control) => (
                <Textarea
                  {...control}
                  name="description"
                  rows={3}
                  value={form.description}
                  onChange={set("description")}
                />
              )}
            </Field>
          </div>
        </details>

        {formError && (
          <p
            role="alert"
            className="border-l-4 border-brick bg-brick-wash px-4 py-3 text-sm text-brick-deep"
          >
            {formError}
          </p>
        )}

        <Button
          type="submit"
          variant="primary"
          loading={submitting}
          className="h-11"
        >
          Crear cuenta e inmobiliaria
        </Button>
      </form>

      <p className="mt-6 text-sm text-stone">
        ¿Ya tenés cuenta?{" "}
        <Link
          href="/vendedor/login"
          className="font-medium text-ink underline decoration-rule-strong underline-offset-4 hover:decoration-ink"
        >
          Ingresá
        </Link>
      </p>
    </>
  );
}
