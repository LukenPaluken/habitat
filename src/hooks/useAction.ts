import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api/client";

type ActionState<TResult> =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "success"; result: TResult }
  | { status: "error"; error: ApiError };

/**
 * Something the user triggers (send a question, request a visit): the write
 * counterpart of `useFetch`. `run` never throws; look at `error` / `result`.
 */
export function useAction<TInput, TResult>(
  action: (input: TInput) => Promise<TResult>,
  /** Runs the moment a failure happens (e.g. to refresh after a 409). */
  onError?: (error: ApiError) => void
) {
  const [state, setState] = useState<ActionState<TResult>>({ status: "idle" });

  // `run` must stay the same function between renders, but has to call the
  // latest `action` (it closes over the current property id, for example).
  const actionRef = useRef({ action, onError });
  useEffect(() => {
    actionRef.current = { action, onError };
  });

  const run = useCallback(async (input: TInput) => {
    setState({ status: "pending" });
    try {
      const result = await actionRef.current.action(input);
      setState({ status: "success", result });
      return result;
    } catch (error) {
      const apiError = error instanceof ApiError ? error : new ApiError(500);
      setState({ status: "error", error: apiError });
      actionRef.current.onError?.(apiError);
      return undefined;
    }
  }, []);

  const reset = useCallback(() => setState({ status: "idle" }), []);

  return {
    run,
    reset,
    isPending: state.status === "pending",
    isSuccess: state.status === "success",
    error: state.status === "error" ? state.error : undefined,
    result: state.status === "success" ? state.result : undefined,
  };
}
