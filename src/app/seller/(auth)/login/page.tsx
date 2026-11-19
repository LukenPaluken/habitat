import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/components/seller/login-form";

export const metadata: Metadata = { title: "Ingresar" };

export default function LoginPage() {
  return (
    // useSearchParams (the redirect's `next`) needs a Suspense boundary.
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
