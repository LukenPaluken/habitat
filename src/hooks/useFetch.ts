import { useEffect, useState } from "react";
import { ApiError, getJson, isAbortError } from "@/lib/api/client";

// What the last finished request left behind. `key` says which request it was.
interface Settled<T> {
  key: string;
  data?: T;
  error?: ApiError;
}

export interface FetchResult<T> {
  /** Last successful body. Kept while the next request is in flight. */
  data: T | undefined;
  error: ApiError | undefined;
  /** From the moment the URL changes until its answer arrives. */
  isLoading: boolean;
  /** Runs the same request again (the "Reintentar" button). */
  reload: () => void;
}

/**
 * GET `url` and keep track of it. A new URL cancels the request still in
 * flight (AbortController), so a slow answer can never overwrite a newer one.
 */
export function useFetch<T>(url: string): FetchResult<T> {
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState<Settled<T> | null>(null);
  const key = `${attempt}:${url}`;

  useEffect(() => {
    const controller = new AbortController();

    getJson<T>(url, controller.signal)
      .then((data) => setSettled({ key, data }))
      .catch((error: unknown) => {
        if (isAbortError(error)) return;
        const apiError = error instanceof ApiError ? error : new ApiError(500);
        setSettled((previous) => ({
          key,
          data: previous?.data,
          error: apiError,
        }));
      });

    return () => controller.abort();
  }, [key, url]);

  // Derived, not stored: it is loading while the answer on hand is for another request.
  const isLoading = settled?.key !== key;

  return {
    data: settled?.data,
    error: isLoading ? undefined : settled?.error,
    isLoading,
    reload: () => setAttempt((current) => current + 1),
  };
}
