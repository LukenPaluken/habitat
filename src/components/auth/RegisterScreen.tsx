"use client";

import { UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Fields";
import { PasswordField } from "@/components/ui/PasswordField";
import { useAction } from "@/hooks/useAction";
import { useForm } from "@/hooks/useForm";
import { registerSeller } from "@/lib/api/agencies";
import { loginSeller } from "@/lib/api/auth";
import { PANEL_HOME } from "@/lib/auth-redirect";
import { EMAIL_PATTERN, hasEnoughDigits } from "@/lib/validation";

const INITIAL = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  phone: "",
  fantasyName: "",
};
type Values = typeof INITIAL;

function validate(v: Values) {
  const errors: Partial<Record<keyof Values, string>> = {};
  if (v.firstName.trim().length < 2) errors.firstName = "Ingresá tu nombre.";
  if (v.lastName.trim().length < 2) errors.lastName = "Ingresá tu apellido.";
  if (!v.email.trim()) errors.email = "Ingresá tu email.";
  else if (!EMAIL_PATTERN.test(v.email.trim()))
    errors.email = "Ingresá un email válido.";
  if (v.password.length < 8)
    errors.password = "La contraseña debe tener al menos 8 caracteres.";
  // The phone is optional, but if it is there it has to be a phone.
  if (v.phone.trim() && !hasEnoughDigits(v.phone)) {
    errors.phone = "Ingresá un teléfono válido (al menos 6 dígitos).";
  }
  if (v.fantasyName.trim().length < 2) {
    errors.fantasyName =
      "Ingresá el nombre de tu inmobiliaria (al menos 2 letras).";
  }
  return errors;
}

/** Creates the seller and their agency in one step, then logs them in. */
export function RegisterScreen() {
  const router = useRouter();
  const form = useForm(INITIAL, validate);
  const register = useAction(async (v: Values) => {
    await registerSeller({
      name: `${v.firstName.trim()} ${v.lastName.trim()}`,
      email: v.email.trim(),
      password: v.password,
      fantasyName: v.fantasyName.trim(),
      phone: v.phone.trim() || undefined,
    });
    await loginSeller({ email: v.email.trim(), password: v.password });
    return true; // `run` gives back `undefined` when the action failed
  });

  const submit = form.handleSubmit(async (values) => {
    if (await register.run(values)) router.replace(PANEL_HOME);
  });

  // A 409 says which field is taken: the message goes right under it.
  const taken =
    register.error?.status === 409 ? register.error.invalidFields : [];
  const fieldError = (name: keyof Values) =>
    form.errorOf(name) ??
    (name === "email" && taken.includes("email")
      ? "Ya hay una cuenta con ese email."
      : name === "fantasyName" && taken.includes("fantasyName")
        ? "Ya existe una inmobiliaria con ese nombre."
        : undefined);

  const field = {
    onChange: (event: Parameters<typeof form.handleChange>[0]) => {
      if (register.error) register.reset(); // the taken value is being edited
      form.handleChange(event);
    },
    onBlur: form.handleBlur,
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900">
          Creá tu cuenta de vendedor
        </h1>
        <p className="text-slate-600">
          Se crea junto con tu inmobiliaria: en un solo paso quedás listo para
          publicar.
        </p>
      </header>

      <form
        onSubmit={submit}
        noValidate
        className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 sm:p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Nombre"
            name="firstName"
            autoComplete="given-name"
            value={form.values.firstName}
            error={fieldError("firstName")}
            {...field}
          />
          <TextField
            label="Apellido"
            name="lastName"
            autoComplete="family-name"
            value={form.values.lastName}
            error={fieldError("lastName")}
            {...field}
          />
        </div>
        <TextField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={form.values.email}
          error={fieldError("email")}
          {...field}
        />
        <PasswordField
          label="Contraseña"
          name="password"
          autoComplete="new-password"
          hint="Mínimo 8 caracteres."
          value={form.values.password}
          error={fieldError("password")}
          {...field}
        />
        <TextField
          label="Teléfono de contacto (opcional)"
          name="phone"
          type="tel"
          autoComplete="tel"
          hint="Se muestra en el sitio de tu inmobiliaria."
          value={form.values.phone}
          error={fieldError("phone")}
          {...field}
        />
        <TextField
          label="Nombre de fantasía de tu inmobiliaria"
          name="fantasyName"
          hint="Es único en toda la plataforma."
          value={form.values.fantasyName}
          error={fieldError("fantasyName")}
          {...field}
        />

        {register.error && taken.length === 0 && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
          >
            {register.error.message}
          </p>
        )}

        <Button type="submit" className="w-full" isLoading={register.isPending}>
          <UserPlus aria-hidden className="size-4" />
          Crear cuenta
        </Button>
      </form>

      <p className="text-center text-sm text-slate-600">
        ¿Ya tenés cuenta?{" "}
        <Link
          href="/login"
          className="font-medium text-brand-700 hover:underline"
        >
          Ingresá
        </Link>
      </p>
    </div>
  );
}
