import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/components/seller/login-form";

export const metadata: Metadata = { title: "Ingresar" };

export default function LoginPage() {
  return (
    // useSearchParams (el `next` de la redirección) pide un límite de Suspense.
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
