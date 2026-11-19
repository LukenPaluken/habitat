import { Suspense } from "react";
import { LoadingState } from "@/components/ui/States";
import { LoginScreen } from "@/components/auth/LoginScreen";

// `useSearchParams` (the `?next=` to come back to) needs a <Suspense> around it.
export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <LoginScreen />
    </Suspense>
  );
}
