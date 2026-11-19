"use client";

import { LogIn } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { PasswordField } from "@/components/ui/PasswordField";
import { TextField } from "@/components/ui/Fields";
import { useAction } from "@/hooks/useAction";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "@/hooks/useForm";
import { loginSeller } from "@/lib/api/auth";
import { safeNext } from "@/lib/auth-redirect";
import { EMAIL_PATTERN } from "@/lib/validation";

const INITIAL = { email: "", password: "" };
type Values = typeof INITIAL;

function validate({ email, password }: Values) {
  const errors: Partial<Record<keyof Values, string>> = {};
  if (!email.trim()) errors.email = "Ingresá tu email.";
  else if (!EMAIL_PATTERN.test(email.trim()))
    errors.email = "Ingresá un email válido.";
  if (!password) errors.password = "Ingresá tu contraseña.";
  return errors;
}

export function LoginScreen() {
  const router = useRouter();
  const target = safeNext(useSearchParams().get("next"));
  const { user, isLoading } = useAuth();

  const form = useForm(INITIAL, validate);
  const login = useAction(loginSeller);

  // Already logged in (or just did): continue to where they were going.
  useEffect(() => {
    if (!isLoading && user) router.replace(target);
  }, [isLoading, user, target, router]);

  const submit = form.handleSubmit(async ({ email, password }) => {
    // On success the effect above takes over as soon as the session shows up.
    await login.run({ email: email.trim(), password });
  });

  // Wrong credentials say so plainly, and the email stays in the field.
  const wrongCredentials =
    login.error && login.error.status >= 400 && login.error.status < 500;

  return (
    <div className="mx-auto max-w-md space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900">
          Ingresá a tu panel
        </h1>
        <p className="text-slate-600">
          Para inmobiliarias que publican en Habitat.
        </p>
      </header>

      <form
        onSubmit={submit}
        noValidate
        className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 sm:p-6"
      >
        <TextField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={form.values.email}
          onChange={form.handleChange}
          onBlur={form.handleBlur}
          error={form.errorOf("email")}
        />
        <PasswordField
          label="Contraseña"
          name="password"
          autoComplete="current-password"
          value={form.values.password}
          onChange={form.handleChange}
          onBlur={form.handleBlur}
          error={form.errorOf("password")}
        />

        {login.error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
          >
            {wrongCredentials
              ? "El email o la contraseña no son correctos."
              : login.error.message}
          </p>
        )}

        <Button type="submit" className="w-full" isLoading={login.isPending}>
          <LogIn aria-hidden className="size-4" />
          Ingresar
        </Button>
      </form>

      <p className="text-center text-sm text-slate-600">
        ¿No tenés cuenta?{" "}
        <Link
          href="/registro"
          className="font-medium text-brand-700 hover:underline"
        >
          Registrate
        </Link>
      </p>
    </div>
  );
}
