"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { agencyApi } from "@/lib/seller-api";
import { loginSchema } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { PasswordInput } from "./password-input";

const HOME = "/vendedor/propiedades";

// Solo rutas internas del panel: nunca redirigimos a un `next` externo.
function safeNext(raw: string | null): string {
  return raw && raw.startsWith("/vendedor/") && !raw.startsWith("//")
    ? raw
    : HOME;
}

const SHOW_DEMO = process.env.NODE_ENV !== "production";

export function LoginForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Si ya hay sesión de vendedor, no tiene sentido mostrar el formulario.
  useEffect(() => {
    agencyApi
      .get()
      .then(() => router.replace(next))
      .catch(() => undefined);
  }, [router, next]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);

    const parsed = loginSchema.safeParse({ email: email.trim(), password });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setErrors({ email: flat.email?.[0], password: flat.password?.[0] });
      return;
    }
    setErrors({});

    setSubmitting(true);
    const { error } = await authClient.signIn.email(parsed.data);
    if (error) {
      setSubmitting(false);
      setFormError(
        error.status === 401 || error.status === 400
          ? "El email o la contraseña no coinciden."
          : (error.message ?? "No pudimos iniciar sesión. Probá de nuevo.")
      );
      return;
    }

    router.replace(next);
    router.refresh();
  }

  return (
    <>
      <p className="kicker mb-3">Ingreso de vendedores</p>
      <h1 className="text-4xl leading-[1.1]">Entrá a tu panel</h1>
      <p className="mt-3 text-stone">
        Ingresá con el email con el que registraste tu inmobiliaria.
      </p>

      <form onSubmit={onSubmit} noValidate className="mt-8 flex flex-col gap-5">
        <Field label="Email" error={errors.email}>
          {(control) => (
            <Input
              {...control}
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="vos@tuinmobiliaria.com"
            />
          )}
        </Field>

        <Field label="Contraseña" error={errors.password}>
          {(control) => (
            <PasswordInput
              {...control}
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          )}
        </Field>

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
          Ingresar
        </Button>
      </form>

      <p className="mt-6 text-sm text-stone">
        ¿No tenés cuenta?{" "}
        <Link
          href="/vendedor/registro"
          className="font-medium text-ink underline decoration-rule-strong underline-offset-4 hover:decoration-ink"
        >
          Registrate
        </Link>
      </p>

      {SHOW_DEMO && (
        <button
          type="button"
          onClick={() => {
            setEmail("lucia@inmobiliariadelsol.com");
            setPassword("habitat123");
            setErrors({});
          }}
          className="mt-10 border-t border-dashed border-rule-strong pt-4 text-left font-mono text-xs text-stone transition-colors hover:text-ink"
        >
          Desarrollo: cargar la cuenta demo del seed
        </button>
      )}
    </>
  );
}
