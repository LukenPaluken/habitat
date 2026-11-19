import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { logoutSeller } from "@/lib/api/auth";

/**
 * Who is using the site. The session lives in a cookie that Better Auth sets
 * and the server checks, so a reload keeps the seller logged in; this hook
 * only reads it. `user` is `null` for a visitor.
 */
export function useAuth() {
  const router = useRouter();
  const { data, isPending } = useSession();

  /** Ends the session and goes to the public listing. */
  async function logout() {
    await logoutSeller();
    router.push("/");
  }

  return { user: data?.user ?? null, isLoading: isPending, logout };
}
