import { authClient } from "@/lib/auth-client";
import { ApiError } from "./client";

// Login and logout go through Better Auth (it owns the session cookie). They
// live here so no component talks to it directly, and failures come out as the
// same `ApiError` as everything else.

// While the seller is logging OUT on purpose, the panel must not treat the
// vanished session as "you were kicked out" (that sends to /login, not home).
let loggingOut = false;
export const isLoggingOut = () => loggingOut;

export async function loginSeller(input: { email: string; password: string }) {
  let result;
  try {
    result = await authClient.signIn.email(input);
  } catch {
    throw new ApiError(0);
  }
  if (result.error) {
    throw new ApiError(result.error.status ?? 500, result.error.message);
  }
  loggingOut = false;
}

export async function logoutSeller() {
  loggingOut = true;
  try {
    await authClient.signOut();
  } catch {
    loggingOut = false;
    throw new ApiError(0);
  }
}
